import React, { useEffect, useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/Button";
import { usePracticeAttempt } from "@/Features/practice/usePracticeAttempt";
import { formatMMSS } from "@/Features/practice/time";
import { useDragDropOrder } from "@/Features/practice/useDragDropOrder";
import StatusModal from "@/Components/StatusModal";
import Icons from "@/icons";
import { usePage, router } from "@inertiajs/react"; 
import { useTour } from "@/Hooks/useTour";
import { FaQuestionCircle } from "react-icons/fa";


export default function AttemptShow(props) {
  const vm = usePracticeAttempt(props);
  const { flash } = usePage().props;
  const [errorModal, setErrorModal] = useState(
    flash?.error ? { message: flash.error } : null
  );

  const { attempt } = props;
  const { cfg, questions: vmQuestions, total, currentIndex, current, remaining, answeredCount, answers, actions } = vm;
  const materialName = props?.attempt?.practice?.material?.material_name ?? "-";
  const levelLabel = props?.attempt?.attempt_type === "pretest" 
    ? "Pre-test" 
    : (cfg?.level ?? props?.attempt?.practice?.level ?? "Latihan");

  const [feedback, setFeedback] = useState(null);
  const [lockedQuestionIds, setLockedQuestionIds] = useState(() => new Set());
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

  const isLastQuestion = currentIndex >= total - 1;
  const isCurrentLocked = Boolean(current?.id && lockedQuestionIds.has(current.id));
  const navLocked = Boolean(current && (isCurrentLocked || actions.isAnswered(current)));

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
    const isCorrect = Number(selectedOption?.is_correct) === 1;

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

    const normalizedSelection = (selectionItems ?? [])
      .map((item) => String(item).trim());

    // Use items if available, fallback to options (for older data)
    let rawCorrect = question.items ?? [];
    if (rawCorrect.length === 0) {
      rawCorrect = question.options ?? [];
    }

    const correctOrder = [...rawCorrect]
      .sort((a, b) => Number(a.id) - Number(b.id))
      .map((item) => String(item.item_text ?? item.option_text ?? item.text ?? "").trim());

    const isCorrect =
      normalizedSelection.length === correctOrder.length &&
      normalizedSelection.every((item, index) => item === correctOrder[index]);

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
    lockQuestion(current.id);
    const result = evaluateMCAnswer(current.id, optionId);
    if (result) {
      const isCurrentlyAnswered = actions.isAnswered(current);
      const nextAnsweredCount = isCurrentlyAnswered ? answeredCount : answeredCount + 1;
      
      setFeedback({
        ...result,
        autoSubmitLast: nextAnsweredCount >= total,
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

      // Determine expected item count (items or options fallback)
      const getExpectedCount = (q) => {
        if (!q) return 0;
        const qItems = q.items ?? [];
        if (qItems.length > 0) return qItems.length;
        return (q.options ?? []).length;
      };

      const totalItems = getExpectedCount(current);
      
      if (totalItems > 0 && items.length === totalItems) {
        lockQuestion(qid);
        const result = evaluateDragAnswer(qid, items);
        if (result) {
          const isCurrentlyAnswered = actions.isAnswered(current);
          const nextAnsweredCount = isCurrentlyAnswered ? answeredCount : answeredCount + 1;
          
          setFeedback({
            ...result,
            autoSubmitLast: nextAnsweredCount >= total,
          });
        }
      }
    },
  });

  const { startTour, addSteps, next, back, cancel, complete } = useTour();

  React.useEffect(() => {
    addSteps([
      {
        id: 'question',
        title: 'Pertanyaan',
        text: 'Baca pertanyaan dengan teliti. Beberapa soal mungkin menyertakan gambar pendukung.',
        attachTo: { element: '#tour-question', on: 'bottom' },
        buttons: [
          { text: 'Lewati', action: cancel, classes: 'shepherd-button-secondary' },
          { text: 'Lanjut', action: next }
        ]
      },
      {
        id: 'timer',
        title: 'Waktu Pengerjaan',
        text: 'Perhatikan sisa waktu pengerjaanmu di sini.',
        attachTo: { element: '#tour-timer', on: 'bottom' },
        buttons: [
          { text: 'Kembali', action: back, classes: 'shepherd-button-secondary' },
          { text: 'Lanjut', action: next }
        ]
      },
      {
        id: 'nav',
        title: 'Navigasi Soal',
        text: 'Kamu bisa memantau soal mana yang sudah dikerjakan dan berpindah antar soal.',
        attachTo: { element: '#tour-nav', on: 'left' },
        buttons: [
          { text: 'Kembali', action: back, classes: 'shepherd-button-secondary' },
          { text: 'Lanjut', action: next }
        ]
      },
      {
        id: 'submit',
        title: 'Selesaikan Latihan',
        text: 'Jika sudah yakin dengan semua jawaban, klik tombol ini untuk mengirim hasil latihanmu.',
        attachTo: { element: '#tour-submit', on: 'top' },
        buttons: [
          { text: 'Kembali', action: back, classes: 'shepherd-button-secondary' },
          { text: 'Selesai', action: complete }
        ]
      }
    ]);
  }, []);
  return (
    <AppLayout title="Latihan Soal" label="Latihan Soal">
      <div className="relative w-full overflow-hidden">
        {/* Background Decorative Blurs */}
        <div className="absolute -right-40 h-[500px] w-[500px] rounded-full pointer-events-none" />
        <div className="absolute -left-40 h-[400px] w-[400px] rounded-full pointer-events-none" />

        <div className="relative z-10 mx-auto px-4 ">
          <div className="flex justify-end mb-2">
            <button
              onClick={startTour}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <FaQuestionCircle className="text-amber-500 h-4 w-4" />
              Butuh panduan?
            </button>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Main Content Area */}
            <main className="flex-1 space-y-2">

              <div id="tour-question" className="overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/70 shadow-2xl shadow-slate-200/50 backdrop-blur-xl">

                <div className="p-6">
                  {!current ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <Icons.Error className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-lg font-medium text-slate-600">Soal tidak tersedia.</p>
                    </div>
                  ) : (
                    <>
                      <div className="prose prose-slate max-w-none">
                        <h2 className="text-[14px] font-semibold leading-relaxed text-slate-800">
                          <span className="inline-flex items-center justify-center bg-slate-900 text-white text-[10px] font-black p-2 rounded-lg mr-2 align-baseline shadow-sm">
                            {currentIndex + 1}
                          </span>
                          {current.question_text}
                        </h2>
                      </div>

                      {(current.image_path || current.image_url) && (
                        <div className="mt-4 flex justify-center">
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-1.5 shadow-sm">
                            <img
                              src={current.image_url ? current.image_url : `/storage/${current.image_path}`}
                              alt="Ilustrasi soal"
                              className="max-h-[200px] w-auto object-contain rounded-xl"
                            />
                          </div>
                        </div>
                      )}

                      {current.type === "multiple_choice" && (
                        <div className="mt-6 grid gap-3">
                          {(current.options ?? []).map((opt) => {
                            const selected = answers?.[current.id]?.option_id === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={isCurrentLocked || isAutoSubmitting}
                                onClick={() => handleMCClick(opt.id)}
                                className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-300 ${
                                  selected
                                    ? "border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500"
                                    : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5"
                                } ${
                                  isCurrentLocked || isAutoSubmitting
                                    ? "opacity-60 cursor-not-allowed"
                                    : "active:scale-[0.98]"
                                }`}
                              >
                                <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-300 ${
                                  selected
                                    ? "border-indigo-500 bg-indigo-500 text-white"
                                    : "border-slate-200 bg-slate-50 text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-400"
                                }`}>
                                  <Icons.Check className={`h-2 w-2 transition-transform duration-300 ${selected ? "scale-100" : "scale-0"}`} />
                                </div>
                                <span className={`text-[12px] font-medium ${selected ? "text-indigo-900" : "text-slate-700"}`}>
                                  {opt.option_text}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {current.type === "drag_drop" && (
                        <>
                          {/* Code Snippet Panel */}
                          {(current.code_snippet || current.outputCode) && (
                            <div className="mt-5 rounded-2xl border border-slate-700/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-lg overflow-hidden">
                              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/50">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                                </div>
                                <div className="flex items-center gap-1.5 ml-2">
                                  <Icons.Code className="h-3.5 w-3.5 text-indigo-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Code Snippet</span>
                                </div>
                              </div>
                              <div className="p-4 overflow-x-auto custom-scrollbar">
                                <pre className="text-[12px] leading-relaxed font-mono text-emerald-300 whitespace-pre-wrap">
                                  <code>{current.code_snippet || current.outputCode}</code>
                                </pre>
                              </div>
                            </div>
                          )}

                          <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_300px]">
                            <div className="rounded-[2rem] border border-slate-200 bg-slate-50/50 p-6 shadow-inner">
                              <div className="flex items-center gap-2 mb-5">
                                <Icons.Code className="h-4 w-4 text-indigo-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Workspace</span>
                              </div>
                              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                                {(currentDrag?.slots ?? []).map((slot, idx) => (
                                  <div
                                    key={`slot-${idx}`}
                                    draggable={Boolean(slot) && !isCurrentLocked && !isAutoSubmitting}
                                    onDragStart={(event) =>
                                      slot && !isCurrentLocked && !isAutoSubmitting && dragHandlers.handleDragStart(event, { source: "slot", index: idx, text: slot })
                                    }
                                    onDragOver={(event) => !isCurrentLocked && !isAutoSubmitting && event.preventDefault()}
                                    onDrop={(event) => !isCurrentLocked && !isAutoSubmitting && dragHandlers.handleDropOnSlot(event, idx)}
                                    className={`flex min-h-[50px] items-center gap-2 rounded-2xl border px-3 transition-all duration-300 ${
                                      slot
                                        ? "border-slate-200 bg-white shadow-sm cursor-grab active:cursor-grabbing"
                                        : "border-dashed border-slate-300 bg-white/50"
                                    }`}
                                  >
                                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                                    <span className={`text-[12px] ${slot ? "font-medium text-slate-800" : "text-slate-400 italic"}`}>
                                      {slot ?? "Seret blok kode ke sini..."}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                              <div className="flex items-center gap-2 mb-5">
                                <Icons.Lightbulb className="h-4 w-4 text-amber-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Blok Kode</span>
                              </div>
                              <div
                                className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar"
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
                                    className={`cursor-grab rounded-2xl border px-3 py-3 text-[12px] font-semibold shadow-sm transition-all duration-300 active:cursor-grabbing hover:shadow-md hover:scale-[1.02] active:scale-95 ${blockTheme(idx)}`}
                                  >
                                    {item}
                                  </div>
                                ))}
                                {currentDrag?.pool?.length === 0 && (
                                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                                    <Icons.CheckCircle className="h-6 w-6 text-emerald-500 mb-2" />
                                    <p className="text-xs font-medium text-slate-400">Semua blok terpakai</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </main>

            {/* Right Sidebar Panel */}
            <aside className="w-full lg:w-[260px] shrink-0">
              <div className="sticky top-8 space-y-6">
                <div className="overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/70 shadow-2xl shadow-slate-200/50 backdrop-blur-xl">
                  <div className="p-5">
                    <div id="tour-timer" className="mb-6 flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Icons.Clock className="h-4 w-4 text-indigo-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sisa Waktu</span>
                      </div>
                      <span className={`text-[14px] font-black tabular-nums ${remaining < 60 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
                        {formatMMSS(remaining)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      <div className="flex flex-col gap-1 p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                        <span className="text-[9px] font-semibold text-indigo-400 uppercase tracking-widest leading-none">Materi</span>
                        <span className="text-[11px] font-bold text-slate-900 leading-tight truncate">{materialName}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Tingkat</span>
                          <span className="text-[11px] font-bold text-slate-900">{levelLabel}</span>
                      </div>
                    </div>

                    <div id="tour-nav" className="space-y-2">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Navigasi</h3>
                      <div className="grid grid-cols-5 gap-2">
                        {vmQuestions.map((q, idx) => {
                          const isCurrent = idx === currentIndex;
                          const isDone = actions.isAnswered(q);
                          return (
                            <Button
                              key={q.id}
                              color={isCurrent ? "blue" : (isDone ? "green" : "gray")}
                              variant={isCurrent || isDone ? "solid" : "outline"}
                              size="sm"
                              onClick={() => actions.goTo(idx)}
                              disabled={isAutoSubmitting || idx < currentIndex}
                              className={`!h-8 !w-8 !text-[11px] !rounded-xl !p-0 ${
                                isCurrent
                                  ? "shadow-lg shadow-indigo-500/40 ring-4 ring-indigo-50"
                                  : isDone
                                  ? "shadow-md shadow-emerald-500/20"
                                  : ""
                              } ${
                                idx < currentIndex || isAutoSubmitting
                                  ? "opacity-50"
                                  : "hover:-translate-y-1"
                              }`}
                            >
                              {idx + 1}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <Button
                        color="yellow"
                        size="sm"
                        onClick={actions.next}
                        disabled={currentIndex >= total - 1 || isAutoSubmitting}
                        rightIcon={<Icons.ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                        className="w-full !rounded-3xl !py-3 shadow-lg shadow-amber-500/20"
                      >
                        Pertanyaan Berikutnya
                      </Button>

                      <Button
                        id="tour-submit"
                        color="green"
                        size="sm"
                        onClick={() => actions.submit(false)}

                        disabled={answeredCount === 0 || isAutoSubmitting}
                        leftIcon={<Icons.Check className="h-5 w-5" />}
                        className="w-full !rounded-3xl !py-3 shadow-lg shadow-emerald-500/30"
                      >
                        Selesaikan Latihan
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Feedback Modal */}
        {feedback && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className={`p-6 text-center ${feedback.isCorrect ? "bg-gradient-to-br from-emerald-400 to-teal-500" : "bg-gradient-to-br from-rose-400 to-orange-500"}`}>
                <div className="mx-auto flex h-15 w-15 items-center justify-center rounded-[2rem] backdrop-blur-md shadow-inner mb-6">
                  {feedback.isCorrect ? (
                    <Icons.Success className="h-10 w-10 text-white" />
                  ) : (
                    <Icons.Failed className="h-10 w-10 text-white" />
                  )}
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {feedback.isCorrect ? "KEREN!" : "UPS!"}
                </h3>
                <p className="mt-3 text-white/90 text-[14px] font-medium">
                  {feedback.isCorrect ? "Jawaban kamu benar sekali." : "Jawaban kamu belum tepat."}
                </p>
              </div>

              <div className="p-5">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 mb-2">
                  <p className="text-center text-sm text-slate-700 font-medium leading-relaxed">
                    {feedback.feedbackText}
                  </p>
                </div>

                <Button
                  color={feedback.isCorrect ? "green" : "gray"}
                  onClick={() => {
                    if (feedback?.autoSubmitLast || isAutoSubmitting) return;
                    setFeedback(null);
                    actions.next();
                  }}
                  disabled={feedback?.autoSubmitLast || isAutoSubmitting}
                  className="w-full !rounded-[1.5rem] !py-3 font-black uppercase tracking-[0.2em] shadow-lg"
                >
                  {feedback?.autoSubmitLast || isAutoSubmitting ? "Mengirim..." : "Lanjutkan"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorModal && (
          <StatusModal
            show={true}
            type="error"
            title="Ada Masalah"
            message={errorModal.message}
            confirmText="Kembali"
            onConfirm={() => {
              setErrorModal(null);
              router.visit(route("practices.index"));
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}