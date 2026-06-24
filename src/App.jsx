import { useState, useEffect } from "react";
import { IS_DEV, MOCK_PROJECTS } from "./data/mockProjects.js";
import { MS_PER_DAY } from "./utils/deadline.js";
import { generateId, generateToken } from "./utils/id.js";
import {
  fetchWorkspace,
  saveWorkspace,
  initWorkspace,
  deleteWorkspace,
} from "./api/client.js";
import { WelcomeScreen } from "./components/WelcomeScreen.jsx";
import { SettingsModal } from "./components/SettingsModal.jsx";
import { MainScreen } from "./components/MainScreen.jsx";
import { ProjectScreen } from "./components/ProjectScreen.jsx";

// ---------------------------------------------------------------------------
// App — state management and routing only. All UI lives in /components/.
// ---------------------------------------------------------------------------

const normalizeProject = (project) => ({
  progress: 0,
  archived: false,
  ...project,
  markedBlockIds: Array.isArray(project.markedBlockIds)
    ? project.markedBlockIds
    : [],
});

const normalizeProjects = (items) => items.map(normalizeProject);

export default function App() {
  const [now, setNow] = useState(() => Date.now());
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projects, setProjects] = useState(() => (IS_DEV ? MOCK_PROJECTS : []));
  const [isLoaded, setIsLoaded] = useState(IS_DEV);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("redlineshift_theme") || "light",
  );
  const [showArchived, setShowArchived] = useState(false);
  const [token, setToken] = useState(() =>
    IS_DEV ? "dev" : localStorage.getItem("redlineshift_token") || null,
  );
  const [showSettings, setShowSettings] = useState(false);

  // ── Auth helpers (declared before effects that reference them) ───────────
  const handleLogin = (newToken) => {
    localStorage.setItem("redlineshift_token", newToken);
    setToken(newToken);
  };

  useEffect(() => {
    localStorage.setItem("redlineshift_theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleLogout = () => {
    localStorage.removeItem("redlineshift_token");
    setToken(null);
    setIsLoaded(false);
    setProjects([]);
    setShowSettings(false);
    setActiveProjectId(null);
  };

  // ── Clock ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || IS_DEV) return;
    const load = async () => {
      try {
        setSyncStatus("syncing");
        const data = await fetchWorkspace(token);
        setProjects(normalizeProjects(data.projects || []));
        setIsLoaded(true);
        setSyncStatus("idle");
      } catch (err) {
        if (err.status === 401) handleLogout();
        else setSyncStatus("error");
      }
    };
    load();
  }, [token]);

  // ── Debounced auto-save (1.5 s) ───────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || !token || IS_DEV) return;
    const id = setTimeout(async () => {
      try {
        setSyncStatus("syncing");
        await saveWorkspace(token, projects);
        setSyncStatus("idle");
      } catch {
        setSyncStatus("error");
      }
    }, 1500);
    return () => clearTimeout(id);
  }, [projects, isLoaded, token]);

  const handleNukeDatabase = async () => {
    const passkey = window.prompt(
      "Enter your passkey to permanently delete this workspace:",
    );
    if (!passkey) return;
    try {
      await deleteWorkspace(token, passkey);
      handleLogout();
    } catch {
      alert("Invalid passkey. Deletion rejected.");
    }
  };

  const handleRotateToken = async () => {
    const passkey = window.prompt(
      "Enter your passkey to authorize token rotation:",
    );
    if (!passkey) return;

    const newToken = generateToken();
    try {
      // Step 1 — copy data to the new token
      await initWorkspace(newToken, passkey, projects);

      // Step 2 — delete old token (validates passkey server-side)
      try {
        await deleteWorkspace(token, passkey);
      } catch {
        // Passkey mismatch — roll back the orphaned workspace
        try {
          await deleteWorkspace(newToken, passkey);
        } catch {
          /* best-effort */
        }
        alert("Invalid passkey. Rotation aborted.");
        return;
      }

      handleLogin(newToken);
      setShowSettings(false);
    } catch {
      alert("Rotation failed. Please try again.");
    }
  };

  // ── Project helpers ───────────────────────────────────────────────────────
  const handleUpdateProject = (id, updates) =>
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );

  const handleCreateProject = () =>
    setProjects((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "Untitled Project",
        emoji: "✧",
        deadline: Date.now() + 7 * MS_PER_DAY,
        progress: 0,
        archived: false,
        markedBlockIds: [],
        blocks: [
          { id: generateId(), type: "h1", text: "Title" },
          { id: generateId(), type: "p", text: "" },
        ],
        history: [],
      },
    ]);

  const handleDeleteProject = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const handleArchiveProject = (id) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id ? { ...project, archived: true } : project,
      ),
    );
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const handleToggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (!token) return <WelcomeScreen onLogin={handleLogin} theme={theme} />;

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
    <div
      className={`min-h-screen font-sans selection:bg-black selection:text-white transition-colors duration-300 ${
        theme === "dark"
          ? "bg-zinc-950 text-zinc-100"
          : "bg-white text-gray-900"
      }`}
    >
      {activeProject ? (
        <ProjectScreen
          project={activeProject}
          now={now}
          theme={theme}
          onUpdate={(updates) => handleUpdateProject(activeProject.id, updates)}
          onBack={() => setActiveProjectId(null)}
          onDelete={() => handleDeleteProject(activeProject.id)}
          onArchive={() => handleArchiveProject(activeProject.id)}
        />
      ) : (
        <MainScreen
          projects={projects}
          now={now}
          syncStatus={syncStatus}
          theme={theme}
          showArchived={showArchived}
          onSelect={setActiveProjectId}
          onCreate={handleCreateProject}
          onToggleTheme={handleToggleTheme}
          onToggleArchived={() => setShowArchived((current) => !current)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
      {showSettings && (
        <SettingsModal
          token={token}
          theme={theme}
          onClose={() => setShowSettings(false)}
          onLogout={handleLogout}
          onRotate={handleRotateToken}
          onNuke={handleNukeDatabase}
        />
      )}
    </div>
  );
}
