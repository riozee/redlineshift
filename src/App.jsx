import { useState, useEffect, useRef } from "react";

// --- Math & Time Utilities ---
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_DAYS = 365;

const getDeadlineColor = (deadlineMs, nowMs) => {
  const days = (deadlineMs - nowMs) / MS_PER_DAY;
  if (days >= 60) return "rgb(255, 255, 255)";
  if (days <= 3) return "rgb(255, 210, 210)";

  if (days <= 14) {
    const ratio = (days - 3) / 11;
    const r = Math.round(255 - ratio * (255 - 210));
    const g = Math.round(210 + ratio * (245 - 210));
    return `rgb(${r}, ${g}, 210)`;
  } else if (days <= 30) {
    const ratio = (days - 14) / 16;
    const g = Math.round(245 - ratio * (245 - 230));
    const b = Math.round(210 + ratio * (255 - 210));
    return `rgb(210, ${g}, ${b})`;
  } else {
    const ratio = (days - 30) / 30;
    const r = Math.round(210 + ratio * (255 - 210));
    const g = Math.round(230 + ratio * (255 - 230));
    return `rgb(${r}, ${g}, 255)`;
  }
};

const formatTimeLeft = (deadlineMs, nowMs) => {
  const diff = deadlineMs - nowMs;
  const isOverdue = diff < 0;
  const absDiff = Math.abs(diff);

  const days = Math.floor(absDiff / MS_PER_DAY);
  const hours = Math.floor((absDiff % MS_PER_DAY) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  const timeString =
    days > 0
      ? `${days}d ${hours}h`
      : hours > 0
        ? `${hours}h ${minutes}m`
        : `${minutes}m`;

  return isOverdue ? `Overdue by ${timeString}` : `${timeString} remaining`;
};

const sliderToDays = (sliderValue) =>
  Math.pow(MAX_DAYS + 1, sliderValue / 100) - 1;
const daysToSlider = (days) =>
  days <= 0
    ? 0
    : Math.max(
        0,
        Math.min(100, (Math.log(days + 1) / Math.log(MAX_DAYS + 1)) * 100),
      );
const formatLocalDatetime = (ts) => {
  const d = new Date(ts);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const parseLocalDatetime = (str) => new Date(str).getTime();
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateToken = () => crypto.randomUUID() + "-" + crypto.randomUUID();

// --- Main Application ---
export default function App() {
  const [now, setNow] = useState(() => Date.now());
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [token, setToken] = useState(
    () => localStorage.getItem("redlineshift_token") || null,
  );
  const [showSettings, setShowSettings] = useState(false);

  function handleLogout() {
    localStorage.removeItem("redlineshift_token");
    setToken(null);
    setIsLoaded(false);
    setProjects([]);
    setShowSettings(false);
    setActiveProjectId(null);
  }

  useEffect(() => {
    if (!token) return;
    const loadData = async () => {
      try {
        setSyncStatus("syncing");
        const res = await fetch("/api/sync", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
          setIsLoaded(true);
          setSyncStatus("idle");
        } else if (res.status === 401) {
          handleLogout();
        } else setSyncStatus("error");
      } catch {
        setSyncStatus("error");
      }
    };
    loadData();
  }, [token]);

  useEffect(() => {
    if (!isLoaded || !token) return;
    const timeoutId = setTimeout(async () => {
      try {
        setSyncStatus("syncing");
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projects }),
        });
        if (!res.ok) throw new Error("Save failed");
        setSyncStatus("idle");
      } catch {
        setSyncStatus("error");
      }
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [projects, isLoaded, token]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = (newToken) => {
    localStorage.setItem("redlineshift_token", newToken);
    setToken(newToken);
  };

  const handleNukeDatabase = async () => {
    const passkey = window.prompt(
      "Enter your passkey to permanently delete this workspace:",
    );
    if (!passkey) return;

    try {
      const res = await fetch("/api/sync", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Workspace-Passkey": passkey,
        },
      });
      if (res.ok) {
        handleLogout();
      } else {
        alert("Invalid passkey. Deletion rejected.");
      }
    } catch {
      console.error("Delete failed");
    }
  };

  const handleRotateToken = async () => {
    const passkey = window.prompt(
      "Enter your passkey to authorize token rotation:",
    );
    if (!passkey) return;

    const newToken = generateToken();
    try {
      // 1. Copy data to new token with the same passkey
      await fetch("/api/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${newToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passkey, projects }),
      });

      // 2. Delete old token
      const delRes = await fetch("/api/sync", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Workspace-Passkey": passkey,
        },
      });

      if (!delRes.ok) {
        // Rollback: Invalid passkey, so nuke the newly created orphaned workspace
        await fetch("/api/sync", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${newToken}`,
            "X-Workspace-Passkey": passkey,
          },
        });
        alert("Invalid passkey. Rotation aborted.");
        return;
      }

      handleLogin(newToken);
      setShowSettings(false);
    } catch {
      console.error("Rotation failed");
    }
  };

  const handleUpdateProject = (id, updates) =>
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );

  const handleCreateProject = () => {
    const newProject = {
      id: Date.now().toString(),
      name: "Untitled Project",
      emoji: "✧",
      deadline: Date.now() + 7 * MS_PER_DAY,
      blocks: [
        { id: generateId(), type: "h1", text: "Title" },
        { id: generateId(), type: "p", text: "" },
      ],
      history: [],
    };
    setProjects([...projects, newProject]);
  };

  const handleDeleteProject = (id) => {
    setProjects(projects.filter((p) => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  if (!token) return <WelcomeScreen onLogin={handleLogin} />;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 animate-pulse">
          Syncing Workspace...
        </div>
      </div>
    );
  }

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="min-h-screen text-gray-900 font-sans selection:bg-black selection:text-white transition-colors duration-700 ease-in-out">
      {activeProject ? (
        <ProjectScreen
          project={activeProject}
          now={now}
          onUpdate={(updates) => handleUpdateProject(activeProject.id, updates)}
          onBack={() => setActiveProjectId(null)}
          onDelete={() => handleDeleteProject(activeProject.id)}
        />
      ) : (
        <MainScreen
          projects={projects}
          now={now}
          syncStatus={syncStatus}
          onSelect={setActiveProjectId}
          onCreate={handleCreateProject}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
      {showSettings && (
        <SettingsModal
          token={token}
          onClose={() => setShowSettings(false)}
          onLogout={handleLogout}
          onRotate={handleRotateToken}
          onNuke={handleNukeDatabase}
        />
      )}
    </div>
  );
}

// --- Screens & Modals ---

function WelcomeScreen({ onLogin }) {
  const [inputToken, setInputToken] = useState("");
  const [passkey, setPasskey] = useState("");

  const handleCreateNew = async () => {
    if (!passkey.trim()) return;
    const newToken = generateToken();
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${newToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passkey: passkey.trim(), projects: [] }),
      });
      onLogin(newToken);
    } catch {
      console.error("Failed to initialize workspace");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-12 border border-gray-200 shadow-xl rounded-none">
        <h1 className="text-2xl font-light tracking-tight mb-8 text-center">
          Redlineshift
        </h1>

        <div className="bg-gray-50 p-6 border border-gray-200 mb-8">
          <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-4">
            New Workspace
          </label>
          <input
            type="password"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            placeholder="Set a Passkey (e.g. PIN)"
            className="w-full bg-white border border-gray-300 p-3 font-mono text-sm focus:outline-none focus:border-black transition-colors rounded-none mb-4"
          />
          <button
            onClick={handleCreateNew}
            disabled={!passkey.trim()}
            className="w-full bg-black text-white px-6 py-3 text-xs uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200 rounded-none font-bold"
          >
            Create
          </button>
        </div>

        <div className="relative flex py-4 items-center mb-8">
          <div className="grow border-t border-gray-200"></div>
          <span className="shrink-0 mx-4 text-gray-400 text-[10px] uppercase tracking-widest">
            Or Access Existing
          </span>
          <div className="grow border-t border-gray-200"></div>
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            placeholder="Paste your access token..."
            className="w-full bg-gray-50 border border-gray-300 p-4 font-mono text-xs focus:outline-none focus:border-black transition-colors rounded-none"
          />
          <button
            onClick={() => inputToken.trim() && onLogin(inputToken.trim())}
            disabled={!inputToken.trim()}
            className="w-full border border-black text-black px-6 py-3 text-xs uppercase tracking-widest hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors duration-200 rounded-none font-bold"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ token, onClose, onLogout, onRotate, onNuke }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-white/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="bg-white border border-gray-300 w-full max-w-lg shadow-2xl relative flex flex-col rounded-none p-8">
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <h3 className="text-lg font-light tracking-tight">
            Workspace Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black font-bold focus:outline-none"
          >
            ✕
          </button>
        </div>

        <div className="mb-8">
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Your Access Token
          </label>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            Copy and save this string safely. It's the only way to access this
            workspace from other devices.
          </p>
          <div className="flex">
            <input
              type="text"
              readOnly
              value={token}
              className="flex-1 bg-gray-50 border border-gray-300 border-r-0 p-3 font-mono text-xs text-gray-600 focus:outline-none rounded-none"
            />
            <button
              onClick={handleCopy}
              className="bg-black text-white px-6 font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-none"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={onLogout}
            className="w-full text-left p-4 border border-gray-200 hover:border-black transition-colors rounded-none flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-sm">Log Out</div>
              <div className="text-xs text-gray-500 mt-1">
                Clear local access. Data remains in the cloud.
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-black">→</span>
          </button>

          <button
            onClick={onRotate}
            className="w-full text-left p-4 border border-gray-200 hover:border-black transition-colors rounded-none flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-sm">Rotate Token</div>
              <div className="text-xs text-gray-500 mt-1">
                Requires Passkey. Generate a new key and move data.
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-black">→</span>
          </button>

          <button
            onClick={onNuke}
            className="w-full text-left p-4 border border-red-200 hover:bg-red-50 hover:border-red-600 transition-colors rounded-none flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-sm text-red-600">
                Nuke Workspace
              </div>
              <div className="text-xs text-red-400 mt-1">
                Requires Passkey. Permanently delete all data.
              </div>
            </div>
            <span className="text-red-400 group-hover:text-red-600">☠</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MainScreen({
  projects,
  now,
  syncStatus,
  onSelect,
  onCreate,
  onOpenSettings,
}) {
  const sortedProjects = [...projects].sort((a, b) => a.deadline - b.deadline);

  return (
    <div className="p-8 md:p-16 max-w-7xl mx-auto min-h-screen flex flex-col">
      <header className="flex justify-between items-end mb-16 border-b border-gray-300 pb-6 shrink-0">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-3">
            Workspace
            <div
              className="flex items-center gap-1.5"
              title={`Sync status: ${syncStatus}`}
            >
              <span
                className={`w-2 h-2 rounded-none block ${
                  syncStatus === "syncing"
                    ? "bg-blue-500 animate-pulse"
                    : syncStatus === "error"
                      ? "bg-red-500"
                      : "bg-green-500 opacity-20"
                }`}
              ></span>
            </div>
          </h1>
          <h2 className="text-4xl font-light tracking-tight">
            Active Projects
          </h2>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={onOpenSettings}
            className="text-2xl opacity-50 hover:opacity-100 transition-opacity focus:outline-none"
            title="Workspace Settings"
          >
            ⚙️
          </button>
          <button
            onClick={onCreate}
            className="bg-black text-white px-6 py-2 text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors duration-200 rounded-none focus:outline-none"
          >
            New Project
          </button>
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center opacity-40">
          <div className="text-6xl mb-6">✧</div>
          <p className="text-sm uppercase tracking-widest font-bold">
            No active projects
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {sortedProjects.map((project) => {
            const bgColor = getDeadlineColor(project.deadline, now);
            return (
              <div
                key={project.id}
                onClick={() => onSelect(project.id)}
                className="cursor-pointer p-8 flex flex-col min-h-65 border border-gray-200 hover:border-black transition-all duration-300 rounded-none group bg-white/40 backdrop-blur-md"
                style={{ backgroundColor: bgColor }}
              >
                <div className="text-4xl mb-6 opacity-80 group-hover:opacity-100 transition-opacity">
                  {project.emoji}
                </div>
                <h3 className="text-xl font-medium leading-snug mb-4">
                  {project.name}
                </h3>
                <div className="mt-auto pt-6 border-t border-gray-900/10 flex items-center justify-between font-mono text-xs uppercase tracking-wider text-gray-600">
                  <span>{formatTimeLeft(project.deadline, now)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProjectScreen({ project, now, onUpdate, onBack, onDelete }) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const bgColor = getDeadlineColor(project.deadline, now);
  const currentDiffDays = (project.deadline - now) / MS_PER_DAY;
  const sliderValue = daysToSlider(currentDiffDays);

  const handleSliderChange = (e) => {
    const addedDays = sliderToDays(parseFloat(e.target.value));
    onUpdate({ deadline: Date.now() + addedDays * MS_PER_DAY });
  };

  const handleDateChange = (e) => {
    const ms = parseLocalDatetime(e.target.value);
    if (!isNaN(ms)) onUpdate({ deadline: ms });
  };

  const commitChanges = () => {
    const newCommit = {
      id: generateId(),
      timestamp: Date.now(),
      blocks: JSON.parse(JSON.stringify(project.blocks)),
    };
    onUpdate({ history: [...project.history, newCommit] });
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col p-6 md:p-12 transition-colors duration-700 ease-in-out"
      style={{ backgroundColor: bgColor }}
    >
      <div className="bg-white/80 backdrop-blur-md p-6 flex flex-col md:flex-row gap-6 justify-between items-center mb-8 border border-gray-200 shrink-0 rounded-none">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <button
            onClick={onBack}
            className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center border-l border-gray-300 pl-6">
            <input
              type="text"
              value={project.emoji}
              onChange={(e) => onUpdate({ emoji: e.target.value })}
              className="w-10 h-10 text-xl text-center bg-transparent focus:outline-none rounded-none border-b border-transparent focus:border-black transition-colors"
            />
            <input
              type="text"
              value={project.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="flex-1 w-48 md:w-80 h-10 text-2xl font-light bg-transparent focus:outline-none placeholder-gray-300 ml-4 border-b border-transparent focus:border-black transition-colors rounded-none"
              placeholder="Project Name"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="text-xs uppercase tracking-widest font-bold border border-gray-300 px-4 py-2 hover:border-black transition-colors rounded-none bg-white"
          >
            History ({project.history.length})
          </button>
          <button
            onClick={onDelete}
            className="text-xs uppercase tracking-widest font-bold border border-red-200 text-red-600 px-4 py-2 hover:bg-red-50 hover:border-red-600 transition-colors rounded-none bg-white"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md p-8 flex flex-col lg:flex-row gap-12 mb-8 border border-gray-200 shrink-0 rounded-none">
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-2">
            <label className="text-xs uppercase tracking-widest text-gray-500">
              Timeline (1 Year Max)
            </label>
            <span className="font-mono text-sm tracking-tight text-black">
              {formatTimeLeft(project.deadline, now)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.01"
            value={sliderValue}
            onChange={handleSliderChange}
            className="w-full h-1 bg-gray-300 appearance-none cursor-pointer focus:outline-none accent-black rounded-none"
          />
        </div>
        <div className="flex flex-col justify-center shrink-0 lg:border-l lg:border-gray-200 lg:pl-12">
          <label className="text-xs uppercase tracking-widest text-gray-500 mb-4">
            Exact Deadline
          </label>
          <input
            type="datetime-local"
            value={formatLocalDatetime(project.deadline)}
            onChange={handleDateChange}
            className="bg-transparent border-b border-gray-300 pb-1 font-mono text-sm focus:outline-none focus:border-black transition-colors text-gray-900 rounded-none"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white/90 backdrop-blur-xl border border-gray-200 overflow-hidden relative rounded-none shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/50">
          <span className="text-xs text-gray-400 uppercase tracking-wider ml-4">
            Press <kbd className="font-mono text-black">Ctrl+Enter</kbd> to save
            a snapshot
          </span>
          <button
            onClick={commitChanges}
            className="text-xs uppercase tracking-widest font-bold bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors rounded-none"
          >
            Save Snapshot
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-12 relative">
          <BlockEditor
            blocks={project.blocks}
            onChange={(newBlocks) => onUpdate({ blocks: newBlocks })}
            onSave={commitChanges}
          />
        </div>
      </div>

      {isHistoryOpen && (
        <HistoryModal
          project={project}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}
    </div>
  );
}

// --- Block Editor (Notion-like) ---
function BlockEditor({ blocks, onChange, onSave }) {
  const [focusId, setFocusId] = useState(null);
  const inputRefs = useRef({});

  useEffect(() => {
    if (focusId && inputRefs.current[focusId]) {
      inputRefs.current[focusId].focus();
      setFocusId(null);
    }
  }, [focusId]);

  const updateBlock = (index, newText) => {
    const newBlocks = [...blocks];
    newBlocks[index].text = newText;
    onChange(newBlocks);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const currentBlock = blocks[index];

      if (currentBlock.type === "li" && currentBlock.text === "") {
        const newBlocks = [...blocks];
        newBlocks[index] = { ...currentBlock, type: "p" };
        onChange(newBlocks);
        return;
      }

      let newType = "p";
      let parsedType = currentBlock.type;
      let parsedText = currentBlock.text;

      if (parsedText.startsWith("### ")) {
        parsedType = "h3";
        parsedText = parsedText.slice(4);
      } else if (parsedText.startsWith("## ")) {
        parsedType = "h2";
        parsedText = parsedText.slice(3);
      } else if (parsedText.startsWith("# ")) {
        parsedType = "h1";
        parsedText = parsedText.slice(2);
      } else if (parsedText.startsWith("- ")) {
        parsedType = "li";
        parsedText = parsedText.slice(2);
      }

      if (parsedType === "li") newType = "li";

      const newBlockId = generateId();
      const newBlocks = [...blocks];
      newBlocks[index] = {
        ...currentBlock,
        type: parsedType,
        text: parsedText,
      };
      newBlocks.splice(index + 1, 0, {
        id: newBlockId,
        type: newType,
        text: "",
      });

      onChange(newBlocks);
      setFocusId(newBlockId);
    } else if (e.key === "Backspace" && blocks[index].text === "") {
      e.preventDefault();
      if (blocks[index].type !== "p") {
        const newBlocks = [...blocks];
        newBlocks[index].type = "p";
        onChange(newBlocks);
        return;
      }

      if (blocks.length > 1) {
        const newBlocks = [...blocks];
        newBlocks.splice(index, 1);
        onChange(newBlocks);
        if (index > 0) setFocusId(blocks[index - 1].id);
      } else {
        const newBlocks = [...blocks];
        newBlocks[0].type = "p";
        onChange(newBlocks);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-32">
      {blocks.map((block, i) => (
        <BlockNode
          key={block.id}
          block={block}
          setRef={(el) => (inputRefs.current[block.id] = el)}
          onChange={(val) => updateBlock(i, val)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        />
      ))}
    </div>
  );
}

function BlockNode({ block, setRef, onChange, onKeyDown }) {
  const internalRef = useRef(null);

  const handleRef = (el) => {
    internalRef.current = el;
    if (setRef) setRef(el);
  };

  useEffect(() => {
    if (internalRef.current) {
      internalRef.current.style.height = "auto";
      internalRef.current.style.height =
        internalRef.current.scrollHeight + "px";
    }
  }, [block.text, block.type]);

  let styleClass =
    "w-full resize-none overflow-hidden bg-transparent focus:outline-none transition-colors rounded-none ";

  if (block.type === "h1")
    styleClass += "text-3xl font-normal tracking-tight text-black mt-8 mb-4";
  else if (block.type === "h2")
    styleClass += "text-2xl font-normal tracking-tight text-gray-800 mt-6 mb-3";
  else if (block.type === "h3")
    styleClass += "text-xl font-medium tracking-tight text-gray-800 mt-5 mb-2";
  else if (block.type === "li")
    styleClass +=
      "text-base text-gray-700 list-item ml-6 mb-2 placeholder-gray-300";
  else
    styleClass +=
      "text-base leading-relaxed text-gray-700 mb-3 placeholder-gray-300";

  return (
    <div className={`relative ${block.type === "li" ? "pl-6" : ""}`}>
      {block.type === "li" && (
        <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-black rounded-none"></span>
      )}
      <textarea
        ref={handleRef}
        value={block.text}
        placeholder={
          block.type === "p" ? "Type '/' for commands or markdown..." : ""
        }
        rows={1}
        className={styleClass}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

function HistoryModal({ project, onClose }) {
  const [selectedCommitId, setSelectedCommitId] = useState(null);

  const commits = [...project.history].reverse();
  const viewingCommit = commits.find((c) => c.id === selectedCommitId) || null;

  const diffNodes = (() => {
    if (!viewingCommit) return [];
    const index = project.history.findIndex((c) => c.id === viewingCommit.id);
    const prevCommit = index > 0 ? project.history[index - 1] : { blocks: [] };

    const nodes = [];
    const prevBlocks = prevCommit.blocks;
    const currBlocks = viewingCommit.blocks;

    const currIds = new Set(currBlocks.map((b) => b.id));
    const prevIds = new Set(prevBlocks.map((b) => b.id));

    let prevIdx = 0;
    let currIdx = 0;

    while (prevIdx < prevBlocks.length || currIdx < currBlocks.length) {
      const prev = prevBlocks[prevIdx];
      const curr = currBlocks[currIdx];

      if (prev && curr && prev.id === curr.id) {
        if (prev.text !== curr.text || prev.type !== curr.type) {
          nodes.push({ status: "removed", block: prev });
          nodes.push({ status: "added", block: curr });
        } else {
          nodes.push({ status: "unchanged", block: curr });
        }
        prevIdx++;
        currIdx++;
      } else if (prev && !currIds.has(prev.id)) {
        nodes.push({ status: "removed", block: prev });
        prevIdx++;
      } else if (curr && !prevIds.has(curr.id)) {
        nodes.push({ status: "added", block: curr });
        currIdx++;
      } else if (curr) {
        nodes.push({ status: "added", block: curr });
        currIdx++;
      } else {
        nodes.push({ status: "removed", block: prev });
        prevIdx++;
      }
    }

    return nodes;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-16">
      <div
        className="absolute inset-0 bg-white/60 backdrop-blur-md"
        onClick={onClose}
      ></div>
      <div className="bg-white border border-gray-300 w-full max-w-6xl h-full max-h-[85vh] shadow-2xl relative flex overflow-hidden flex-col md:flex-row rounded-none">
        <div className="w-full md:w-72 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">
              Timeline
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-black font-bold focus:outline-none"
            >
              ✕
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-4 space-y-1">
            {commits.length === 0 ? (
              <p className="text-gray-400 text-xs uppercase tracking-widest text-center mt-12">
                No snapshots
              </p>
            ) : (
              commits.map((commit, i) => (
                <div
                  key={commit.id}
                  onClick={() => setSelectedCommitId(commit.id)}
                  className={`p-4 cursor-pointer transition-all border-l-2 rounded-none ${selectedCommitId === commit.id ? "bg-white border-black shadow-sm" : "border-transparent hover:bg-gray-100"}`}
                >
                  <div className="text-[10px] text-gray-400 mb-1 font-mono uppercase">
                    {new Date(commit.timestamp).toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-gray-800">
                    {i === 0 ? "Current State" : `Snapshot -${i}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 bg-white overflow-y-auto p-12 relative">
          {!viewingCommit ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
              <span className="text-4xl font-light">Select a snapshot</span>
              <p className="text-sm uppercase tracking-widest">
                To view the diff timeline
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <div className="mb-10 pb-4 border-b border-gray-200 flex gap-6 text-xs font-mono uppercase tracking-wider text-gray-500">
                <span className="text-red-500 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 inline-block"></span>{" "}
                  Removed
                </span>
                <span className="text-blue-500 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 inline-block"></span>{" "}
                  Added
                </span>
                <span className="ml-auto text-gray-400 border border-gray-200 px-2 py-1">
                  Read Only
                </span>
              </div>
              {diffNodes.map((node, i) => (
                <DiffNode key={i} status={node.status} block={node.block} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DiffNode({ status, block }) {
  const typeClass =
    block.type === "h1"
      ? "text-3xl font-normal tracking-tight mt-6 mb-3"
      : block.type === "h2"
        ? "text-2xl font-normal tracking-tight mt-5 mb-2"
        : block.type === "h3"
          ? "text-xl font-medium tracking-tight mt-4 mb-2"
          : block.type === "li"
            ? "list-item ml-6 text-base"
            : "text-base leading-relaxed";

  let statusClass = "text-gray-800";
  let wrapperClass = "mb-2 flex px-2 py-1 -mx-2 transition-colors";

  if (status === "added") {
    statusClass = "text-blue-900";
    wrapperClass += " bg-blue-50/50 border-l-2 border-blue-400";
  } else if (status === "removed") {
    statusClass = "text-red-800 line-through opacity-60";
    wrapperClass += " bg-red-50/50 border-l-2 border-red-400";
  } else {
    wrapperClass += " border-l-2 border-transparent opacity-80";
  }

  if (!block.text && status === "unchanged") return <div className="h-6"></div>;

  return (
    <div className={wrapperClass}>
      <div className={`${typeClass} w-full`}>
        {block.type === "li" && status === "unchanged" && (
          <span className="mr-3 text-gray-300 text-xs">■</span>
        )}
        {block.type === "li" && status === "added" && (
          <span className="mr-3 text-blue-400 text-xs">＋</span>
        )}
        {block.type === "li" && status === "removed" && (
          <span className="mr-3 text-red-400 text-xs">－</span>
        )}
        <span className={statusClass}>
          {block.text ||
            (status !== "unchanged" ? (
              <span className="text-gray-400 text-sm italic">empty line</span>
            ) : (
              ""
            ))}
        </span>
      </div>
    </div>
  );
}
