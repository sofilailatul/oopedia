import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { router } from "@inertiajs/react";
import { QUESTION_TYPE } from "./core";

function shuffleArray(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function usePracticeAttempt({ attempt, cfg, questions = [], savedAnswers = {} }) {
  const normalizedQuestions = useMemo(() => {
    return questions.map((q) => {
      if (q.type !== QUESTION_TYPE.MC || !Array.isArray(q.options)) return q;
      return {
        ...q,
        options: shuffleArray(q.options),
      };
    });
  }, [questions]);

  const total = normalizedQuestions.length;
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
          } catch {}
        }
      }
    }

    if (endAt) return Math.max(0, Math.round((endAt - now) / 1000));
    return durationSeconds;
  };

  const initialAnswers = useMemo(() => {
    const out = {};

    for (const q of normalizedQuestions) {
      const saved = savedAnswers?.[q.id];
      if (!saved) continue;

      if (q.type === QUESTION_TYPE.MC) {
        out[q.id] = {
          type: QUESTION_TYPE.MC,
          option_id: saved.practice_options_id ?? null,
          timespent: saved.timespent ?? 0,
        };
      } else {
        out[q.id] = {
          type: QUESTION_TYPE.DRAG,
          selection_items: saved.selection_items ?? [],
          timespent: saved.timespent ?? 0,
        };
      }
    }

    return out;
  }, [normalizedQuestions, savedAnswers]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [remaining, setRemaining] = useState(getInitialRemaining);

  const current = normalizedQuestions[currentIndex] ?? null;
  const currentQuestionId = current?.id ?? null;
  const enterAtRef = useRef(Date.now());
  const answersRef = useRef(initialAnswers);
  const submittingRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const commitTimeSpent = useCallback(() => {
    if (!currentQuestionId) return answersRef.current;

    const now = Date.now();
    const deltaSec = Math.max(0, Math.round((now - enterAtRef.current) / 1000));

    const existing = answersRef.current[currentQuestionId];
    if (!existing) {
      enterAtRef.current = now;
      return answersRef.current;
    }

    const nextAnswers = {
      ...answersRef.current,
      [currentQuestionId]: {
        ...existing,
        timespent: (existing.timespent ?? 0) + deltaSec,
      },
    };

    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);
    enterAtRef.current = now;

    return nextAnswers;
  }, [currentQuestionId]);

  const goTo = useCallback((idx) => {
    if (idx < 0 || idx >= total) return;
    commitTimeSpent();
    setCurrentIndex(idx);
  }, [total, commitTimeSpent]);

  const next = useCallback(() => goTo(Math.min(total - 1, currentIndex + 1)), [goTo, total, currentIndex]);
  const prev = useCallback(() => goTo(Math.max(0, currentIndex - 1)), [goTo, currentIndex]);

  const setMC = useCallback((questionId, optionId) => {
    setAnswers((prev) => {
      const next = {
        ...prev,
        [questionId]: {
          type: QUESTION_TYPE.MC,
          option_id: optionId,
          timespent: prev?.[questionId]?.timespent ?? 0,
        },
      };
      answersRef.current = next;
      return next;
    });
  }, []);

  const setDragSelection = useCallback((questionId, selectionItems) => {
    setAnswers((prev) => {
      const next = {
        ...prev,
        [questionId]: {
          type: QUESTION_TYPE.DRAG,
          selection_items: selectionItems,
          timespent: prev?.[questionId]?.timespent ?? 0,
        },
      };
      answersRef.current = next;
      return next;
    });
  }, []);

  const isAnswered = useCallback((q) => {
    const a = answersRef.current[q.id];
    if (!a) return false;
    if (q.type === QUESTION_TYPE.MC) return !!a.option_id;
    return Array.isArray(a.selection_items) && a.selection_items.length > 0;
  }, []);

  const answeredCount = useMemo(() => {
    let count = 0;
    for (const q of normalizedQuestions) {
      const a = answers[q.id];
      if (!a) continue;
      if (q.type === QUESTION_TYPE.MC && a.option_id) count++;
      if (q.type !== QUESTION_TYPE.MC && Array.isArray(a.selection_items) && a.selection_items.length > 0) count++;
    }
    return count;
  }, [answers, normalizedQuestions]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const submit = useCallback((auto = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    const finalAnswers = commitTimeSpent();

    if (storageKey) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {}
    }

    router.post(
      route("practices.attempts.submit", attempt.id),
      {
        answers: finalAnswers,
        question_ids: normalizedQuestions.map((q) => q.id),
        auto_submit: auto ? 1 : 0,
      },
      {
        preserveScroll: true,
        onFinish: () => {
          submittingRef.current = false;
        },
      }
    );
  }, [attempt.id, normalizedQuestions, storageKey, commitTimeSpent]);

  useEffect(() => {
    if (remaining === 0 && total > 0) {
      submit(true);
    }
  }, [remaining, total, submit]);

  return {
    cfg,
    questions: normalizedQuestions,
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