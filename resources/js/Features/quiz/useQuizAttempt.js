import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";

export function useQuizAttempt({ attempt, cfg, questions = [], savedAnswers = {} }) {
  const total = questions.length;

  const initialAnswers = useMemo(() => {
    const out = {};
    for (const q of questions) {
      const saved = savedAnswers?.[q.id];
      if (saved) {
        out[q.id] = {
          option_id: saved.quiz_options_id ?? null,
          timespent: saved.timespent ?? 0,
        };
      }
    }
    return out;
  }, [questions, savedAnswers]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [remaining, setRemaining] = useState(cfg?.duration_seconds ?? (cfg?.duration ?? 90) * 60);

  const questionEnterAtRef = useRef(Date.now());
  const currentQuestionId = questions?.[currentIndex]?.id;

  const current = questions?.[currentIndex];

  const answeredCount = useMemo(() => {
    let c = 0;
    for (const q of questions) {
      const a = answers[q.id];
      if (a?.option_id) c++;
    }
    return c;
  }, [answers, questions]);

  useEffect(() => {
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining === 0 && total > 0) {
      submit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const commitTimeSpent = () => {
    if (!currentQuestionId) return;
    const now = Date.now();
    const deltaSec = Math.max(0, Math.round((now - questionEnterAtRef.current) / 1000));

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

    questionEnterAtRef.current = now;
  };

  const goTo = (idx) => {
    if (idx < 0 || idx >= total) return;
    commitTimeSpent();
    setCurrentIndex(idx);
  };

  const next = () => goTo(Math.min(total - 1, currentIndex + 1));
  const prev = () => goTo(Math.max(0, currentIndex - 1));

  // sekali jawab: kalau sudah ada option_id, tidak bisa diubah
  const setOptionOnce = (questionId, optionId) => {
    setAnswers((prev) => {
      const existing = prev[questionId];
      if (existing?.option_id) return prev; // kunci
      return {
        ...prev,
        [questionId]: {
          option_id: optionId,
          timespent: existing?.timespent ?? 0,
        },
      };
    });
  };

  const isAnswered = (q) => !!answers?.[q.id]?.option_id;

  const submit = (auto = false) => {
    commitTimeSpent();

    router.post(`/quiz-attempts/${attempt.id}/answers`, {
      answers,
      auto_submit: auto ? 1 : 0,
    });
  };

  return {
    cfg,
    questions,
    total,
    currentIndex,
    current,
    remaining,
    answeredCount,
    answers,
    actions: { goTo, next, prev, submit, setOptionOnce, isAnswered, commitTimeSpent },
  };
}
