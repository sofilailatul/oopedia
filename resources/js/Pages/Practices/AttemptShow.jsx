import React, { useEffect, useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/Button";
import { usePracticeAttempt } from "@/Features/practice/usePracticeAttempt";
import { formatMMSS } from "@/Features/practice/time";
import { difficultyLabel, questionTypeLabel } from "@/Features/practice/labels";
import { useDragDropOrder } from "@/Features/practice/useDragDropOrder";
import Icons from "@/icons";

export default function AttemptShow(props) {
  const vm = usePracticeAttempt(props);

  const { cfg, questions, total, currentIndex, current, remaining, answeredCount, answers, actions } = vm;
  const materialName = props?.attempt?.practice?.material?.material_name ?? "-";
  const levelLabel = difficultyLabel(cfg?.level ?? props?.attempt?.practice?.difficulty_level);

  const [feedback, setFeedback] = useState(null);
  const [lockedQuestionIds, setLockedQuestionIds] = useState(() => new Set());
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

  const isLastQuestion = currentIndex >= total - 1;
  const isCurrentLocked = Boolean(current?.id && lockedQuestionIds.has(current.id));

  useEffect(() => {
    if (!feedback?.autoSubmitLast) return;

    setIsAutoSubmitting(true);
    const timeoutId = window.setTimeout(() => {
      actions.submit(false);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [feedback, actions]);

  const lockQuestion = (questionId) => {
    if (!questionId) return;
    setLockedQuestionIds((prev) => {
      const next = new Set(prev);
      next.add(questionId);
      return next;
    });
  };

  const evaluateMCAnswer = (questionId, optionId) => {
    const question = current;
    if (!question) return null;

    const selectedOption = question.options?.find((opt) => opt.id === optionId);
    const isCorrect = selectedOption?.is_correct === 1 || selectedOption?.is_correct === true;

    return {
      isCorrect,
      feedbackText: isCorrect
        ? (question.feedback_correct ?? "Jawaban kamu benar!")
        : (question.feedback_incorrect ?? "Jawaban kamu salah."),
    };
  };

  const evaluateDragAnswer = (questionId, selectionItems) => {
    const question = current;
    if (!question) return null;

    const correctOrder = question.items?.map((item) => item.item_text) ?? [];
    const isCorrect = JSON.stringify(selectionItems) === JSON.stringify(correctOrder);

    return {
      isCorrect,
      feedbackText: isCorrect
        ? (question.feedback_correct ?? "Urutan kamu benar!")
        : (question.feedback_incorrect ?? "Urutan belum tepat."),
    };
  };

  const handleMCClick = (optionId) => {
    if (!current || isCurrentLocked || isAutoSubmitting) return;

    actions.setMC(current.id, optionId);
    const result = evaluateMCAnswer(current.id, optionId);
    if (result) {
      if (isLastQuestion) {
        lockQuestion(current.id);
      }
      setFeedback({
        ...result,
        autoSubmitLast: isLastQuestion,
      });
    }
  };
  const blockTheme = (index) => {
    const themes = [
      "bg-blue-50 border-blue-200 text-blue-700",
      "bg-emerald-50 border-emerald-200 text-emerald-700",
      "bg-purple-50 border-purple-200 text-purple-700",
      "bg-amber-50 border-amber-200 text-amber-700",
      "bg-rose-50 border-rose-200 text-rose-700",
    ];
    return themes[index % themes.length];
  };

  const { currentDrag, dragHandlers } = useDragDropOrder({
    current,
    answers,
    setDragSelection: (qid, items) => {
      if (lockedQuestionIds.has(qid) || isAutoSubmitting) return;

      actions.setDragSelection(qid, items);
      // Only show feedback when all items are placed
      const totalItems = current?.items?.length ?? 0;
      if (totalItems > 0 && items.length === totalItems) {
        const result = evaluateDragAnswer(qid, items);
        if (result) {
          const shouldAutoSubmit = isLastQuestion;
          if (shouldAutoSubmit) {
            lockQuestion(qid);
          }
          setFeedback({
            ...result,
            autoSubmitLast: shouldAutoSubmit,
          });
        }
      }
    },
  });

  return (
    <AppLayout title="Latihan Soal" label="Latihan Soal">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6">
          <main className="flex-1">
            <div className="flex items-center gap-3 mb-5">
              <button
                type="button"
                onClick={() => {
                  actions.commitTimeSpent();
                  window.history.back();
                }}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                aria-label="Kembali"
              >
                ←
              </button>

              <div className="font-semibold text-sm text-slate-900">
                {currentIndex + 1}. Latihan Soal 
              </div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-6">
              {!current ? (
                <div className="text-slate-500">Soal tidak tersedia.</div>
              ) : (
                <>
                  <div className="text-sm font-semibold text-slate-900">
                    {current.question_text}
                  </div>

                  {(current.image_path || current.image_url) && (
                    <div className="mt-5">
                      <div className="rounded-2xl border bg-slate-50 p-4 flex items-center justify-center">
                        <img
                          src={
                            current.image_url
                              ? current.image_url
                              : `/storage/${current.image_path}`
                          }
                          alt="Ilustrasi soal"
                          className="max-h-56 object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {current.type === "multiple_choice" && (
                    <div className="mt-6 space-y-3">
                      {(current.options ?? []).map((opt) => {
                        const selected = answers?.[current.id]?.option_id === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={isCurrentLocked || isAutoSubmitting}
                            onClick={() => handleMCClick(opt.id)}
                            className={`w-full text-left  text-xs rounded-2xl border px-5 py-3 shadow-sm transition ${
                              selected
                                ? "border-slate-700 bg-slate-50"
                                : "border-slate-200 hover:border-slate-300"
                            } ${
                              isCurrentLocked || isAutoSubmitting
                                ? "opacity-70 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {opt.option_text}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {current.type === "drag_drop" && (
                    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                      <div className="rounded-2xl border bg-white p-5">
                        <div className="text-sm font-semibold text-slate-900">Workspace</div>
                        <div className="mt-4 space-y-3">
                          {(currentDrag?.slots ?? []).map((slot, idx) => (
                            <div
                              key={`slot-${idx}`}
                              draggable={Boolean(slot) && !isCurrentLocked && !isAutoSubmitting}
                              onDragStart={(event) =>
                                slot && !isCurrentLocked && !isAutoSubmitting && dragHandlers.handleDragStart(event, { source: "slot", index: idx, text: slot })
                              }
                              onDragOver={(event) => !isCurrentLocked && !isAutoSubmitting && event.preventDefault()}
                              onDrop={(event) => !isCurrentLocked && !isAutoSubmitting && dragHandlers.handleDropOnSlot(event, idx)}
                              className={`flex min-h-[60px] items-center gap-3 rounded-xl border px-4 text-xs transition ${
                                slot
                                  ? "border-slate-200 bg-slate-50 cursor-grab"
                                  : "border-dashed border-slate-200 bg-slate-50/70"
                              }`}
                            >
                              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                                {"</>"}
                              </span>
                              <span className={slot ? "text-slate-800" : "text-slate-400"}>
                                {slot ?? "Drag code blocks here to arrange"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border bg-white p-5">
                        <div className="text-sm font-semibold text-slate-900">Code Blocks</div>
                        <p className="mt-1 text-[11px] text-slate-500">Drag these blocks to the workspace</p>
                        <div
                          className="mt-4 space-y-3"
                          onDragOver={(event) => !isCurrentLocked && !isAutoSubmitting && event.preventDefault()}
                          onDrop={(event) => !isCurrentLocked && !isAutoSubmitting && dragHandlers.handleDropOnPool(event)}
                        >
                          {(currentDrag?.pool ?? []).map((item, idx) => (
                            <div
                              key={`pool-${idx}-${item}`}
                              draggable={!isCurrentLocked && !isAutoSubmitting}
                              onDragStart={(event) =>
                                !isCurrentLocked && !isAutoSubmitting && dragHandlers.handleDragStart(event, { source: "pool", index: idx, text: item })
                              }
                              className={`cursor-grab rounded-xl border px-3 py-3 text-xs font-medium shadow-sm transition active:cursor-grabbing ${blockTheme(
                                idx
                              )}`}
                            >
                              {item}
                            </div>
                          ))}
                          {currentDrag?.pool?.length === 0 && (
                            <div className="rounded-xl border border-dashed px-4 py-6 text-center text-xs text-slate-400">
                              Semua blok sudah dipakai.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          <aside className="w-[360px] shrink-0">
            <div className="bg-white rounded-2xl border shadow-sm p-5 sticky top-6">
              <div className="space-y-3 mb-4">
                <div className="rounded-2xl border p-3">
                  <div className="text-xs text-slate-600">Materi</div>
                  <div className="mt-1 text-xs font-medium text-slate-900">{materialName}</div>
                </div>
                <div className="rounded-2xl border p-3">
                  <div className="text-xs text-slate-600">Level</div>
                  <div className="mt-1 text-xs font-medium text-slate-900">{levelLabel}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border p-3">
                  <div className="text-xs text-slate-600">Terjawab</div>
                  <div className="mt-1 text-xs font-medium text-slate-900">{answeredCount}</div>
                </div>
                <div className="rounded-2xl border p-3">
                  <div className="text-xs text-slate-600">Waktu</div>
                  <div className="mt-1 text-xs font-medium text-slate-900">
                    {formatMMSS(remaining)}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="grid grid-cols-4 gap-2">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentIndex;
                    const isDone = actions.isAnswered(q);
                    return (
                      <Button
                        key={q.id}
                        type="button"
                        size="sm"
                        variant="outline"
                        color="blue"
                        onClick={() => actions.goTo(idx)}
                        disabled={isAutoSubmitting}
                        className={`h-9 w-[36px] rounded-lg border text-sm font-medium transition ${
                          isCurrent
                            ? "border-slate-500 text-slate-700"
                            : isDone
                            ? "border-slate-300 bg-slate-300 text-slate-500"
                            : "border-slate-200 text-slate-500"
                        }`}
                      >
                        {idx + 1}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Button
                variant="solid"
                color="yellow"
                onClick={actions.next}
                disabled={currentIndex >= total - 1 || isAutoSubmitting}
                className={`mt-5 w-full px-4 py-3 transition ${
                  (currentIndex >= total - 1 || isAutoSubmitting)
                    ? "bg-amber-100 text-slate-400 cursor-not-allowed"
                    : "bg-amber-400 text-slate-900 hover:bg-amber-300"
                }`}
              >
                Lanjut Pertanyaan Selanjutnya
              </Button>

              <Button
                variant="solid"
                color="green"
                onClick={() => actions.submit(false)}
                disabled={answeredCount === 0 || isAutoSubmitting}
                className={`mt-3 w-full px-4 py-3 transition ${
                  (answeredCount === 0 || isAutoSubmitting)
                    ? "bg-emerald-100 text-emerald-300 cursor-not-allowed"
                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                }`}
              >
                Submit Jawaban
              </Button>
            </div>
          </aside>
        </div>

        {/* Feedback Modal */}
        {feedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className={`rounded-t-3xl px-6 py-6 text-center ${feedback.isCorrect ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-rose-400 to-rose-500"}`}>
                <div className="flex justify-center mb-3">
                  {feedback.isCorrect ? (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                      <Icons.Success className="h-8 w-8 text-white" />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                      <Icons.Failed className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {feedback.isCorrect ? "Benar!" : "Salah"}
                </h3>
              </div>

              <div className="px-6 py-6">
                <p className="text-center text-slate-700 leading-relaxed">
                  {feedback.feedbackText}
                </p>

                <Button
                  onClick={() => {
                    if (feedback?.autoSubmitLast || isAutoSubmitting) {
                      return;
                    }
                    setFeedback(null);
                    actions.next();
                  }}
                  variant="solid"
                  color={feedback.isCorrect ? "green" : "red"}
                  disabled={feedback?.autoSubmitLast || isAutoSubmitting}
                  className="mt-6 w-full rounded-full py-3"
                >
                  {feedback?.autoSubmitLast || isAutoSubmitting ? "Mengirim jawaban..." : "Lanjutkan"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
