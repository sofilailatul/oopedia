import { useEffect, useMemo, useState } from "react";
import { QUESTION_TYPE } from "./core";

function shuffleItems(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDragState(question, savedSelection = []) {
  // Prioritas: items (tabel practice_items) 
  // Cadangan: options (tabel practice_options - untuk soal lama)
  let rawItems = [...(question?.items ?? [])]
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((item) => item.item_text);
  
  if (rawItems.length === 0) {
    rawItems = [...(question?.options ?? [])]
      .sort((a, b) => Number(a.id) - Number(b.id))
      .map((opt) => opt.option_text || opt.text);
  }

  const correctItems = rawItems.filter(Boolean);
  const slotCount = correctItems.length;

  const slots = Array.from({ length: slotCount }, (_, idx) => savedSelection[idx] ?? null);
  const used = new Set(slots.filter(Boolean));
  const pool = shuffleItems(correctItems.filter((item) => !used.has(item)));

  return { pool, slots };
}

export function useDragDropOrder({ current, answers, setDragSelection }) {
  const [dragStates, setDragStates] = useState({});

  const currentDrag = useMemo(() => {
    if (!current || current.type !== QUESTION_TYPE.DRAG) return null;

    const existing = dragStates[current.id];
    if (existing) return existing;

    const savedSelection = answers?.[current.id]?.selection_items ?? [];
    return buildDragState(current, savedSelection);
  }, [current, dragStates, answers]);

  useEffect(() => {
    if (!current || current.type !== QUESTION_TYPE.DRAG) return;
    if (dragStates[current.id]) return;

    const savedSelection = answers?.[current.id]?.selection_items ?? [];
    setDragStates((prev) => ({
      ...prev,
      [current.id]: buildDragState(current, savedSelection),
    }));
  }, [current, dragStates, answers]);

  const updateDragState = (questionId, nextState) => {
    setDragStates((prev) => ({ ...prev, [questionId]: nextState }));
    const selectionItems = nextState.slots.filter(Boolean);
    setDragSelection(questionId, selectionItems);
  };

  const handleDragStart = (event, payload) => {
    event.dataTransfer.setData("text/plain", JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnSlot = (event, slotIndex) => {
    event.preventDefault();
    if (!currentDrag || !current) return;

    const raw = event.dataTransfer.getData("text/plain");
    if (!raw) return;

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    const { source, index, text } = payload;
    if (!text) return;

    const nextPool = [...currentDrag.pool];
    const nextSlots = [...currentDrag.slots];
    const targetItem = nextSlots[slotIndex] ?? null;

    if (source === "pool") {
      const poolIndex = nextPool.indexOf(text);
      if (poolIndex >= 0) nextPool.splice(poolIndex, 1);
      if (targetItem) nextPool.push(targetItem);
      nextSlots[slotIndex] = text;
    } else if (source === "slot") {
      if (index === slotIndex) return;
      nextSlots[index] = targetItem;
      nextSlots[slotIndex] = text;
    }

    updateDragState(current.id, { pool: nextPool, slots: nextSlots });
  };

  const handleDropOnPool = (event) => {
    event.preventDefault();
    if (!currentDrag || !current) return;

    const raw = event.dataTransfer.getData("text/plain");
    if (!raw) return;

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    if (payload.source !== "slot") return;
    const { index, text } = payload;
    if (!text) return;

    const nextPool = [...currentDrag.pool, text];
    const nextSlots = [...currentDrag.slots];
    nextSlots[index] = null;

    updateDragState(current.id, { pool: nextPool, slots: nextSlots });
  };

  const removeFromSlot = (slotIndex) => {
    if (!currentDrag || !current) return;
    const slot = currentDrag.slots[slotIndex];
    if (!slot) return;

    const nextPool = [...currentDrag.pool, slot];
    const nextSlots = [...currentDrag.slots];
    nextSlots[slotIndex] = null;

    updateDragState(current.id, { pool: nextPool, slots: nextSlots });
  };

  return {
    currentDrag,
    dragHandlers: {
      handleDragStart,
      handleDropOnSlot,
      handleDropOnPool,
      removeFromSlot,
    },
  };
}