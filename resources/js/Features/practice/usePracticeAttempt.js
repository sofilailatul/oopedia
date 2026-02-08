import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";

export function usePracticeAttempt({ attempt, cfg, questions = [], savedAnswers = {} }) {
  const total = questions.length;
  const durationSeconds = cfg?.duration_seconds ?? 18 * 60;
  const storageKey = attempt?.id ? `practice_attempt_${attempt.id}_end_at` : null;

  const getInitialRemaining = () => {
    const now = Date.now();
    let endAt = null;

    if (storageKey) {
      try {
        const cached = window.localStorage.getItem(storageKey);
        if (cached) endAt = Number(cached);
      } catch {
        endAt = null;
      }
    }

    if (!endAt && attempt?.started_at) {
      const startedAtMs = Date.parse(attempt.started_at);
      if (!Number.isNaN(startedAtMs)) {
        endAt = startedAtMs + durationSeconds * 1000;
        if (storageKey) {
          try {
            window.localStorage.setItem(storageKey, String(endAt));
          } catch {
            // ignore storage errors
          }
        }
      }
    }

    if (endAt) return Math.max(0, Math.round((endAt - now) / 1000));
    return durationSeconds;
  };

  // init from saved
  const initialAnswers = useMemo(() => {
    const out = {};
    for (const q of questions) {
      const saved = savedAnswers?.[q.id];
      if (!saved) continue;

      if (q.type === "multiple_choice") {
        out[q.id] = {
          type: "multiple_choice",
          option_id: saved.practice_options_id ?? null,
          timespent: saved.timespent ?? 0,
        };
      } else {
        out[q.id] = {
          type: "drag_drop",
          selection_items: saved.selection_items ?? [],
          timespent: saved.timespent ?? 0,
        };
      }
    }
    return out;
  }, [questions, savedAnswers]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [remaining, setRemaining] = useState(getInitialRemaining);

  const current = questions[currentIndex] ?? null;
  const currentQuestionId = current?.id ?? null;

  // time tracking
  const enterAtRef = useRef(Date.now());

  const commitTimeSpent = () => {
    if (!currentQuestionId) return;

    const now = Date.now();
    const deltaSec = Math.max(0, Math.round((now - enterAtRef.current) / 1000));

    setAnswers((prev) => {
      const existing = prev[currentQuestionId];
      if (!existing) return prev;

      return {
        ...prev,
        [currentQuestionId]: {
          ...existing,
          timespent: (existing.timespent ?? 0) + deltaSec,
        },
      };
    });

    enterAtRef.current = now;
  };

  const goTo = (idx) => {
    if (idx < 0 || idx >= total) return;
    commitTimeSpent();
    setCurrentIndex(idx);
  };

  const next = () => goTo(Math.min(total - 1, currentIndex + 1));
  const prev = () => goTo(Math.max(0, currentIndex - 1));

  const setMC = (questionId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        type: "multiple_choice",
        option_id: optionId,
        timespent: prev?.[questionId]?.timespent ?? 0,
      },
    }));
  };

  const setDragSelection = (questionId, selectionItems) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        type: "drag_drop",
        selection_items: selectionItems,
        timespent: prev?.[questionId]?.timespent ?? 0,
      },
    }));
  };

  const isAnswered = (q) => {
    const a = answers[q.id];
    if (!a) return false;
    if (q.type === "multiple_choice") return !!a.option_id;
    return Array.isArray(a.selection_items) && a.selection_items.length > 0;
  };

  const answeredCount = useMemo(() => {
    let c = 0;
    for (const q of questions) if (isAnswered(q)) c++;
    return c;
  }, [answers, questions]);

  // timer tick
  useEffect(() => {
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const submit = (auto = false) => {
    commitTimeSpent();
    if (storageKey) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore storage errors
      }
    }
    router.post(`/latihan-soal-attempts/${attempt.id}/answers`, {
      answers,
      auto_submit: auto ? 1 : 0,
    });
  };

  // auto submit
  useEffect(() => {
    if (remaining === 0 && total > 0) submit(true);
  }, [remaining]);

  return {
    cfg,
    questions,
    total,
    currentIndex,
    current,
    remaining,
    answeredCount,
    answers,

    actions: {
      goTo,
      next,
      prev,
      submit,
      setMC,
      setDragSelection,
      commitTimeSpent,
      isAnswered,
    },
  };
}
