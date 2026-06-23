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

function ProjectCard({ project, now, onSelect }) {
  const bgColor = getDeadlineColor(project.deadline, now);
  return (
    <div
      onClick={() => onSelect(project.id)}
      className="cursor-pointer p-8 flex flex-col min-h-65 border border-gray-200 hover:border-black transition-all duration-300 group"
      style={{ backgroundColor: bgColor }}
    >
      <div className="text-4xl mb-6 opacity-80 group-hover:opacity-100 transition-opacity">
        {project.emoji}
      </div>
      <h3 className="text-xl font-medium leading-snug mb-4">{project.name}</h3>
      <div className="mt-auto pt-6 border-t border-gray-900/10 font-mono text-xs uppercase tracking-wider text-gray-600">
        {formatTimeLeft(project.deadline, now)}
      </div>
    </div>
  );
}

export function MainScreen({
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
            <SyncDot status={syncStatus} />
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
            className="bg-black text-white px-6 py-2 text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors duration-200 focus:outline-none"
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
          {sortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              now={now}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
