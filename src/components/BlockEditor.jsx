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

const BLOCK_STYLE = {
  h1: "text-3xl font-normal tracking-tight text-black mt-8 mb-4",
  h2: "text-2xl font-normal tracking-tight text-gray-800 mt-6 mb-3",
  h3: "text-xl font-medium tracking-tight text-gray-800 mt-5 mb-2",
  li: "text-base text-gray-700 mb-2 placeholder-gray-300",
  p: "text-base leading-relaxed text-gray-700 mb-3 placeholder-gray-300",
};

// --- BlockNode ---
// A single auto-resizing textarea that renders one block.

function BlockNode({ block, setRef, onChange, onKeyDown }) {
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
    <div className={`relative ${block.type === "li" ? "pl-6" : ""}`}>
      {block.type === "li" && (
        <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-black"></span>
      )}
      <textarea
        ref={handleRef}
        value={block.text}
        placeholder={
          block.type === "p" ? "Type '# ' for headings, '- ' for lists..." : ""
        }
        rows={1}
        className={baseClass + (BLOCK_STYLE[block.type] ?? BLOCK_STYLE.p)}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

// --- BlockEditor ---
// Manages the full list of blocks and keyboard navigation.

export function BlockEditor({ blocks, onChange, onSave }) {
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
