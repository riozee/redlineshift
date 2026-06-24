import { useState, useEffect, useRef } from "react";
import { generateId } from "../utils/id.js";

// Maps a raw text value to a parsed { type, text } if it starts with a markdown prefix.
// Returns null if no prefix matches.
const PREFIXES = [
  { prefix: "### ", type: "h3" },
  { prefix: "## ", type: "h2" },
  { prefix: "# ", type: "h1" },
  { prefix: "- ", type: "li" },
];

const parseMarkdownPrefix = (text) => {
  for (const { prefix, type } of PREFIXES) {
    if (text === prefix) return { type, text: "" };
  }
  return null;
};

const BLOCK_ROW_STYLE = {
  h1: "mt-6 mb-3",
  h2: "mt-5 mb-2",
  h3: "mt-4 mb-2",
  li: "",
  p: "",
};

const BLOCK_TEXT_STYLE = {
  h1: "text-3xl font-normal tracking-tight",
  h2: "text-2xl font-normal tracking-tight",
  h3: "text-xl font-medium tracking-tight",
  li: "text-base placeholder-gray-300",
  p: "text-base leading-relaxed placeholder-gray-300",
};

// --- BlockNode ---
// A single auto-resizing textarea that renders one block.

function BlockNode({
  block,
  lineNumber,
  isMarked,
  setRef,
  onChange,
  onKeyDown,
  onToggleMark,
  theme,
}) {
  const internalRef = useRef(null);

  const handleRef = (el) => {
    internalRef.current = el;
    if (setRef) setRef(el);
  };

  // Auto-resize whenever text or type changes.
  useEffect(() => {
    const el = internalRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [block.text, block.type]);

  const baseClass =
    "w-full resize-none overflow-hidden bg-transparent focus:outline-none transition-colors ";

  return (
    <div
      className={`flex items-start gap-12 ${BLOCK_ROW_STYLE[block.type] ?? BLOCK_ROW_STYLE.p}`}
    >
      <div className="w-14 shrink-0 flex items-center gap-2 justify-end select-none mt-2">
        <button
          type="button"
          onClick={onToggleMark}
          aria-label={`Toggle marker on line ${lineNumber}`}
          className={`w-2.5 h-2.5 rounded-full border transition-all ${
            isMarked
              ? "bg-red-500 border-red-600"
              : "bg-transparent border-transparent hover:border-red-500"
          }`}
        />
        <span
          className={`text-[10px] font-mono ${
            theme === "dark" ? "text-zinc-500" : "text-gray-400"
          }`}
        >
          {lineNumber}
        </span>
      </div>
      <div className={`relative flex-1 ${block.type === "li" ? "pl-6" : ""}`}>
        {block.type === "li" && (
          <span
            className={`absolute left-0 top-2.5 w-1.5 h-1.5 ${theme === "dark" ? "bg-zinc-100" : "bg-black"}`}
          ></span>
        )}
        <textarea
          ref={handleRef}
          value={block.text}
          placeholder={
            block.type === "p"
              ? "Type '# ' for headings, '- ' for lists..."
              : ""
          }
          rows={1}
          className={`${baseClass}${BLOCK_TEXT_STYLE[block.type] ?? BLOCK_TEXT_STYLE.p} ${theme === "dark" ? "text-zinc-100" : "text-gray-700"}`}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}

// --- BlockEditor ---
// Manages the full list of blocks and keyboard navigation.

export function BlockEditor({
  blocks,
  markedBlockIds = [],
  onChange,
  onToggleMark,
  onSave,
  theme = "light",
}) {
  const [focusId, setFocusId] = useState(null);
  const inputRefs = useRef({});

  // Apply focus after a block is created.
  useEffect(() => {
    if (focusId && inputRefs.current[focusId]) {
      inputRefs.current[focusId].focus();
      setFocusId(null);
    }
  }, [focusId]);

  const updateBlock = (index, newText) => {
    // Real-time markdown prefix detection: convert type immediately when prefix is typed.
    const parsed = parseMarkdownPrefix(newText);
    const newBlocks = [...blocks];
    if (parsed) {
      newBlocks[index] = {
        ...newBlocks[index],
        type: parsed.type,
        text: parsed.text,
      };
    } else {
      newBlocks[index] = { ...newBlocks[index], text: newText };
    }
    onChange(newBlocks);
  };

  const handleKeyDown = (e, index) => {
    // Ctrl+Enter / Cmd+Enter → save snapshot
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const current = blocks[index];

      // Empty list item → break out of list
      if (current.type === "li" && current.text === "") {
        const newBlocks = [...blocks];
        newBlocks[index] = { ...current, type: "p" };
        onChange(newBlocks);
        return;
      }

      // New block inherits list type; otherwise defaults to paragraph
      const newType = current.type === "li" ? "li" : "p";
      const newId = generateId();
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, { id: newId, type: newType, text: "" });
      onChange(newBlocks);
      setFocusId(newId);
      return;
    }

    if (e.key === "Backspace" && blocks[index].text === "") {
      e.preventDefault();

      // Non-paragraph empty block → convert to paragraph first
      if (blocks[index].type !== "p") {
        const newBlocks = [...blocks];
        newBlocks[index] = { ...blocks[index], type: "p" };
        onChange(newBlocks);
        return;
      }

      // Remove the block and focus previous
      if (blocks.length > 1) {
        const newBlocks = [...blocks];
        newBlocks.splice(index, 1);
        onChange(newBlocks);
        if (index > 0) setFocusId(blocks[index - 1].id);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {blocks.map((block, i) => (
        <BlockNode
          key={block.id}
          block={block}
          lineNumber={i + 1}
          isMarked={markedBlockIds.includes(block.id)}
          setRef={(el) => (inputRefs.current[block.id] = el)}
          onChange={(val) => updateBlock(i, val)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onToggleMark={() => onToggleMark?.(block.id)}
          theme={theme}
        />
      ))}
    </div>
  );
}
