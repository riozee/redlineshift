/**
 * Two-pointer diff algorithm that aligns blocks by their unique IDs.
 * Returns an array of { status: "added" | "removed" | "unchanged", block } nodes
 * ordered to reflect their position in the document flow.
 */
export const computeDiff = (prevBlocks, currBlocks) => {
  const nodes = [];
  const currIds = new Set(currBlocks.map((b) => b.id));
  const prevIds = new Set(prevBlocks.map((b) => b.id));

  let prevIdx = 0;
  let currIdx = 0;

  while (prevIdx < prevBlocks.length || currIdx < currBlocks.length) {
    const prev = prevBlocks[prevIdx];
    const curr = currBlocks[currIdx];

    if (prev && curr && prev.id === curr.id) {
      // Same block — mark changed or unchanged
      if (prev.text !== curr.text || prev.type !== curr.type) {
        nodes.push({ status: "removed", block: prev });
        nodes.push({ status: "added", block: curr });
      } else {
        nodes.push({ status: "unchanged", block: curr });
      }
      prevIdx++;
      currIdx++;
    } else if (prev && !currIds.has(prev.id)) {
      // Block was deleted
      nodes.push({ status: "removed", block: prev });
      prevIdx++;
    } else if (curr && !prevIds.has(curr.id)) {
      // Block was inserted
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
};
