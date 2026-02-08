// resources/js/Features/practice/dragDropUtils.js

export function seededShuffle(list, seedValue) {
  const arr = [...list];
  let s = seedValue % 2147483647;
  if (s <= 0) s += 2147483646;

  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function normalizeSelection(selectionItems = [], items = []) {
  return selectionItems.filter((text) => items.includes(text));
}

export function buildDragState(question, existingSelection = []) {
  const items = (question.items ?? []).map((item) => item.item_text);
  const seed = Number(question.id) || 1;

  const normalizedSelection = normalizeSelection(existingSelection, items);

  const slots = Array.from({ length: items.length }, (_, idx) => normalizedSelection[idx] ?? null);
  const shuffled = seededShuffle(items, seed);

  const pool = shuffled.filter((text) => !normalizedSelection.includes(text));

  return { pool, slots };
}
