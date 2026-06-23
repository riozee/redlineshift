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

export function ProjectScreen({ project, now, onUpdate, onBack, onDelete }) {
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
      className="min-h-screen w-full flex flex-col p-6 md:p-12 transition-colors duration-700 ease-in-out"
      style={{ backgroundColor: bgColor }}
    >
      {/* ── Top bar ── */}
      <div className="bg-white/80 backdrop-blur-md p-6 flex flex-col md:flex-row gap-6 justify-between items-center mb-8 border border-gray-200 shrink-0">
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
              className="w-10 h-10 text-xl text-center bg-transparent focus:outline-none border-b border-transparent focus:border-black transition-colors"
            />
            <input
              type="text"
              value={project.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="flex-1 w-48 md:w-80 h-10 text-2xl font-light bg-transparent focus:outline-none placeholder-gray-300 ml-4 border-b border-transparent focus:border-black transition-colors"
              placeholder="Project Name"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="text-xs uppercase tracking-widest font-bold border border-gray-300 px-4 py-2 hover:border-black transition-colors bg-white"
          >
            History ({project.history.length})
          </button>
          <button
            onClick={onDelete}
            className="text-xs uppercase tracking-widest font-bold border border-red-200 text-red-600 px-4 py-2 hover:bg-red-50 hover:border-red-600 transition-colors bg-white"
          >
            Delete
          </button>
        </div>
      </div>

      {/* ── Deadline controls ── */}
      <div className="bg-white/80 backdrop-blur-md p-8 flex flex-col lg:flex-row gap-12 mb-8 border border-gray-200 shrink-0">
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
            className="w-full h-1 bg-gray-300 appearance-none cursor-pointer focus:outline-none accent-black"
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
            className="bg-transparent border-b border-gray-300 pb-1 font-mono text-sm focus:outline-none focus:border-black transition-colors text-gray-900"
          />
        </div>
      </div>

      {/* ── Block editor ── */}
      <div className="flex-1 flex flex-col bg-white/90 backdrop-blur-xl border border-gray-200 overflow-hidden relative shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/50">
          <span className="text-xs text-gray-400 uppercase tracking-wider ml-4">
            Press <kbd className="font-mono text-black">Ctrl+Enter</kbd> to save
            a snapshot
          </span>
          <button
            onClick={saveSnapshot}
            className="text-xs uppercase tracking-widest font-bold bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors"
          >
            Save Snapshot
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-12 relative">
          <BlockEditor
            blocks={project.blocks}
            onChange={(newBlocks) => onUpdate({ blocks: newBlocks })}
            onSave={saveSnapshot}
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
