import { useState } from "react";
import { computeDiff } from "../utils/diff.js";

const DIFF_TYPE_CLASS = {
  h1: "text-3xl font-normal tracking-tight mt-6 mb-3",
  h2: "text-2xl font-normal tracking-tight mt-5 mb-2",
  h3: "text-xl font-medium tracking-tight mt-4 mb-2",
  li: "list-item ml-6 text-base",
  p: "text-base leading-relaxed",
};

const LI_MARKER = {
  unchanged: <span className="mr-3 text-gray-300 text-xs">■</span>,
  added: <span className="mr-3 text-green-500 text-xs">＋</span>,
  removed: <span className="mr-3 text-red-400 text-xs">－</span>,
};

function DiffNode({ status, block }) {
  if (!block.text && status === "unchanged") return <div className="h-6"></div>;

  const wrapperClass = `mb-2 flex px-2 py-1 -mx-2 transition-colors border-l-2 ${
    status === "added"
      ? "bg-green-50 border-green-500"
      : status === "removed"
        ? "bg-red-50 border-red-400"
        : "border-transparent opacity-80"
  }`;

  const textClass =
    status === "added"
      ? "text-green-900"
      : status === "removed"
        ? "text-red-800 line-through opacity-60"
        : "text-gray-800";

  const typeClass = DIFF_TYPE_CLASS[block.type] ?? DIFF_TYPE_CLASS.p;

  return (
    <div className={wrapperClass}>
      <div className={`${typeClass} w-full`}>
        {block.type === "li" && LI_MARKER[status]}
        <span className={textClass}>
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

export function HistoryModal({ project, onClose }) {
  const [selectedCommitId, setSelectedCommitId] = useState(null);

  const commits = [...project.history].reverse();
  const viewingCommit = commits.find((c) => c.id === selectedCommitId) ?? null;

  const diffNodes = (() => {
    if (!viewingCommit) return [];
    const index = project.history.findIndex((c) => c.id === viewingCommit.id);
    const prevBlocks = index > 0 ? project.history[index - 1].blocks : [];
    return computeDiff(prevBlocks, viewingCommit.blocks);
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-16">
      <div
        className="absolute inset-0 bg-white/60 backdrop-blur-md"
        onClick={onClose}
      ></div>

      <div className="bg-white border border-gray-300 w-full max-w-6xl h-full max-h-[85vh] shadow-2xl relative flex overflow-hidden flex-col md:flex-row">
        {/* Sidebar — snapshot list */}
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
                  className={`p-4 cursor-pointer transition-all border-l-2 ${
                    selectedCommitId === commit.id
                      ? "bg-white border-black shadow-sm"
                      : "border-transparent hover:bg-gray-100"
                  }`}
                >
                  <div className="text-[10px] text-gray-400 mb-1 font-mono uppercase">
                    {new Date(commit.timestamp).toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-gray-800">
                    {i === 0 ? "Latest Snapshot" : `Snapshot −${i}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Diff panel */}
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
                <span className="text-green-600 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-600 inline-block"></span>{" "}
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
