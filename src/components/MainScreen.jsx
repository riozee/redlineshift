import { getDeadlineColor, formatTimeLeft } from "../utils/deadline.js";

function SyncDot({ status }) {
  const colorClass =
    status === "syncing"
      ? "bg-blue-500 animate-pulse"
      : status === "error"
        ? "bg-red-500"
        : "bg-green-500 opacity-20";

  return (
    <div className="flex items-center gap-1.5" title={`Sync: ${status}`}>
      <span className={`w-2 h-2 block ${colorClass}`}></span>
    </div>
  );
}

function ProjectCard({ project, now, onSelect, theme }) {
  const bgColor = getDeadlineColor(project.deadline, now);
  const markedIds = Array.isArray(project.markedBlockIds)
    ? project.markedBlockIds
    : [];
  const markedText = (project.blocks || [])
    .filter((block) => markedIds.includes(block.id))
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join("\n");

  return (
    <div
      onClick={() => onSelect(project.id)}
      className={`cursor-pointer p-5 flex flex-col min-h-56 border transition-all duration-300 group ${
        theme === "dark"
          ? "border-zinc-700 hover:border-zinc-300 text-zinc-100"
          : "border-gray-200 hover:border-black text-gray-900"
      }`}
      style={{ backgroundColor: bgColor }}
    >
      <div className="text-3xl mb-4 opacity-80 group-hover:opacity-100 transition-opacity">
        {project.emoji}
      </div>
      <h3 className="text-lg font-medium leading-snug mb-3">{project.name}</h3>
      <div className="flex-1 min-h-0 overflow-hidden mb-3">
        {markedText ? (
          <p
            className={`text-sm leading-6 whitespace-pre-wrap wrap-break-word ${theme === "dark" ? "text-zinc-200/90" : "text-gray-800/90"}`}
          >
            {markedText}
          </p>
        ) : null}
      </div>
      <div
        className={`pt-4 border-t flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-wider ${theme === "dark" ? "border-white/10 text-zinc-300" : "border-gray-900/10 text-gray-600"}`}
      >
        <span>{formatTimeLeft(project.deadline, now)}</span>
        <span className="text-right">
          {Math.max(0, Math.min(100, project.progress ?? 0))}%
        </span>
      </div>
    </div>
  );
}

export function MainScreen({
  projects,
  now,
  syncStatus,
  theme,
  showArchived,
  onSelect,
  onCreate,
  onToggleTheme,
  onToggleArchived,
  onOpenSettings,
}) {
  const activeProjects = [...projects]
    .filter((project) => !project.archived)
    .sort((a, b) => a.deadline - b.deadline);
  const archivedProjects = [...projects]
    .filter((project) => project.archived)
    .sort((a, b) => a.deadline - b.deadline);

  return (
    <div
      className={`p-5 md:p-8 max-w-7xl mx-auto min-h-screen flex flex-col ${theme === "dark" ? "text-zinc-100" : "text-gray-900"}`}
    >
      <header
        className={`flex justify-between items-end mb-8 border-b pb-4 shrink-0 ${theme === "dark" ? "border-zinc-700" : "border-gray-300"}`}
      >
        <div>
          <h1
            className={`text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-3 ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}
          >
            Workspace
            <SyncDot status={syncStatus} />
          </h1>
          <h2 className="text-3xl font-light tracking-tight">
            Active Projects
          </h2>
        </div>
        <div className="flex gap-2 items-center flex-wrap justify-end">
          <button
            onClick={onOpenSettings}
            className="text-lg opacity-50 hover:opacity-100 transition-opacity focus:outline-none"
            title="Workspace Settings"
          >
            ⚙️
          </button>
          <button
            onClick={onToggleTheme}
            className={`px-3 py-2 text-[11px] uppercase tracking-widest border transition-colors ${theme === "dark" ? "border-zinc-700 hover:border-zinc-300" : "border-gray-300 hover:border-black"}`}
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={onToggleArchived}
            className={`px-3 py-2 text-[11px] uppercase tracking-widest border transition-colors ${theme === "dark" ? "border-zinc-700 hover:border-zinc-300" : "border-gray-300 hover:border-black"}`}
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </button>
          <button
            onClick={onCreate}
            className="bg-black text-white px-4 py-2 text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-colors duration-200 focus:outline-none"
          >
            New Project
          </button>
        </div>
      </header>

      {activeProjects.length === 0 && archivedProjects.length === 0 ? (
        <div
          className={`flex-1 flex flex-col items-center justify-center opacity-40 ${theme === "dark" ? "text-zinc-400" : "text-gray-900"}`}
        >
          <div className="text-6xl mb-6">✧</div>
          <p className="text-sm uppercase tracking-widest font-bold">
            No active projects
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {activeProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                now={now}
                theme={theme}
                onSelect={onSelect}
              />
            ))}
          </div>
          {showArchived && archivedProjects.length > 0 && (
            <section className="space-y-4">
              <div
                className={`text-xs uppercase tracking-widest font-bold ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}
              >
                Archived Projects
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 opacity-80">
                {archivedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    now={now}
                    theme={theme}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
