import { useState } from "react";
import {
  getDeadlineColor,
  formatTimeLeft,
  sliderToDays,
  daysToSlider,
  MS_PER_DAY,
} from "../utils/deadline.js";
import { formatLocalDatetime, parseLocalDatetime } from "../utils/format.js";
import { generateId } from "../utils/id.js";
import { BlockEditor } from "./BlockEditor.jsx";
import { HistoryModal } from "./HistoryModal.jsx";

export function ProjectScreen({
  project,
  now,
  theme = "light",
  onUpdate,
  onBack,
  onDelete,
  onArchive,
}) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const bgColor = getDeadlineColor(project.deadline, now);
  const sliderValue = daysToSlider((project.deadline - now) / MS_PER_DAY);

  const handleSliderChange = (e) => {
    const days = sliderToDays(parseFloat(e.target.value));
    onUpdate({ deadline: Date.now() + days * MS_PER_DAY });
  };

  const handleDateChange = (e) => {
    const ms = parseLocalDatetime(e.target.value);
    if (!isNaN(ms)) onUpdate({ deadline: ms });
  };

  const saveSnapshot = () => {
    const commit = {
      id: generateId(),
      timestamp: Date.now(),
      blocks: JSON.parse(JSON.stringify(project.blocks)),
    };
    onUpdate({ history: [...project.history, commit] });
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col p-4 md:p-8 transition-colors duration-700 ease-in-out ${
        theme === "dark" ? "text-zinc-100" : "text-gray-900"
      }`}
      style={{ backgroundColor: bgColor }}
    >
      {/* ── Top bar ── */}
      <div
        className={`backdrop-blur-md p-4 flex flex-col md:flex-row gap-4 justify-between items-center mb-6 border shrink-0 ${theme === "dark" ? "bg-zinc-950/75 border-zinc-800" : "bg-white/80 border-gray-200"}`}
      >
        <div className="flex items-center gap-6 w-full md:w-auto">
          <button
            onClick={onBack}
            className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${theme === "dark" ? "text-zinc-400 hover:text-white" : "text-gray-500 hover:text-black"}`}
          >
            ← Back
          </button>
          <div
            className={`flex items-center border-l pl-4 md:pl-5 ${theme === "dark" ? "border-zinc-700" : "border-gray-300"}`}
          >
            <input
              type="text"
              value={project.emoji}
              onChange={(e) => onUpdate({ emoji: e.target.value })}
              className={`w-9 h-9 text-lg text-center bg-transparent focus:outline-none border-b border-transparent transition-colors ${theme === "dark" ? "focus:border-zinc-200" : "focus:border-black"}`}
            />
            <input
              type="text"
              value={project.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className={`flex-1 w-44 md:w-72 h-9 text-xl font-light bg-transparent focus:outline-none placeholder-gray-300 ml-3 border-b border-transparent transition-colors ${theme === "dark" ? "text-zinc-100 focus:border-zinc-200" : "text-gray-900 focus:border-black"}`}
              placeholder="Project Name"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className={`text-[11px] uppercase tracking-widest font-bold border px-3 py-2 transition-colors ${theme === "dark" ? "border-zinc-700 bg-zinc-950 hover:border-zinc-300" : "border-gray-300 bg-white hover:border-black"}`}
          >
            History ({project.history.length})
          </button>
          <button
            onClick={onArchive}
            className={`text-[11px] uppercase tracking-widest font-bold border px-3 py-2 transition-colors ${theme === "dark" ? "border-zinc-700 bg-zinc-950 hover:border-zinc-300" : "border-gray-300 bg-white hover:border-black"}`}
          >
            Archive
          </button>
          <button
            onClick={onDelete}
            className="text-[11px] uppercase tracking-widest font-bold border border-red-200 text-red-600 px-3 py-2 hover:bg-red-50 hover:border-red-600 transition-colors bg-white"
          >
            Delete
          </button>
        </div>
      </div>

      {/* ── Deadline controls ── */}
      <div
        className={`backdrop-blur-md p-4 md:p-5 flex flex-col lg:flex-row gap-6 mb-6 border shrink-0 ${theme === "dark" ? "bg-zinc-950/75 border-zinc-800" : "bg-white/80 border-gray-200"}`}
      >
        <div className="flex-1 flex flex-col justify-center">
          <div
            className={`flex justify-between items-end mb-4 border-b pb-2 ${theme === "dark" ? "border-zinc-800" : "border-gray-200"}`}
          >
            <label
              className={`text-[11px] uppercase tracking-widest ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}
            >
              Timeline (1 Year Max)
            </label>
            <span
              className={`font-mono text-sm tracking-tight ${theme === "dark" ? "text-zinc-100" : "text-black"}`}
            >
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
            className="w-full h-1 bg-gray-300 appearance-none cursor-pointer focus:outline-none accent-black"
          />
        </div>
        <div
          className={`flex flex-col justify-center shrink-0 lg:border-l lg:pl-6 ${theme === "dark" ? "lg:border-zinc-800" : "lg:border-gray-200"}`}
        >
          <label
            className={`text-[11px] uppercase tracking-widest mb-3 ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}
          >
            Exact Deadline
          </label>
          <input
            type="datetime-local"
            value={formatLocalDatetime(project.deadline)}
            onChange={handleDateChange}
            className={`bg-transparent border-b pb-1 font-mono text-sm focus:outline-none transition-colors ${theme === "dark" ? "border-zinc-700 text-zinc-100 focus:border-zinc-200" : "border-gray-300 text-gray-900 focus:border-black"}`}
          />
        </div>
      </div>

      <div
        className={`backdrop-blur-md p-4 md:p-5 flex flex-col lg:flex-row gap-6 mb-6 border shrink-0 ${theme === "dark" ? "bg-zinc-950/75 border-zinc-800" : "bg-white/80 border-gray-200"}`}
      >
        <div className="flex-1 flex flex-col justify-center">
          <div
            className={`flex justify-between items-end mb-4 border-b pb-2 ${theme === "dark" ? "border-zinc-800" : "border-gray-200"}`}
          >
            <label
              className={`text-[11px] uppercase tracking-widest ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}
            >
              Progress
            </label>
            <span
              className={`font-mono text-sm tracking-tight ${theme === "dark" ? "text-zinc-100" : "text-black"}`}
            >
              {Math.max(0, Math.min(100, project.progress ?? 0))}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={project.progress ?? 0}
            onChange={(e) => onUpdate({ progress: Number(e.target.value) })}
            className="w-full h-1 bg-gray-300 appearance-none cursor-pointer focus:outline-none accent-black"
          />
        </div>
      </div>

      {/* ── Block editor ── */}
      <div
        className={`flex-1 flex flex-col backdrop-blur-xl border overflow-hidden relative shadow-sm ${theme === "dark" ? "bg-zinc-950/80 border-zinc-800" : "bg-white/90 border-gray-200"}`}
      >
        <div
          className={`flex items-center justify-between p-3 border-b ${theme === "dark" ? "border-zinc-800 bg-zinc-950/40" : "border-gray-200 bg-white/50"}`}
        >
          <span
            className={`text-[11px] uppercase tracking-wider ml-2 ${theme === "dark" ? "text-zinc-400" : "text-gray-400"}`}
          >
            Press <kbd className="font-mono text-black">Ctrl+Enter</kbd> to save
            a snapshot
          </span>
          <button
            onClick={saveSnapshot}
            className="text-[11px] uppercase tracking-widest font-bold bg-black text-white px-3 py-2 hover:bg-gray-800 transition-colors"
          >
            Save Snapshot
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          <BlockEditor
            blocks={project.blocks}
            onChange={(newBlocks) => onUpdate({ blocks: newBlocks })}
            onSave={saveSnapshot}
            theme={theme}
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
