import React, { useState, useCallback } from "react";
import axios from "axios";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/Button";
import { useQuizAttempt } from "@/Features/quiz/useQuizAttempt";
import { formatMMSS } from "@/Features/quiz/time";
import { useTour } from "@/Hooks/useTour";
import { FaQuestionCircle } from "react-icons/fa";
import Icons from "@/icons";


export default function AttemptShow(props) {
  return (
    <AppLayout title="Kuis" label="Kuis">
      <AttemptContent {...props} />
    </AppLayout>
  );
}

function AttemptContent(props) {
  const vm = useQuizAttempt(props);
  const { cfg, questions, total, currentIndex, current, remaining, answeredCount, answers, actions } = vm;
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [checkedQuestions, setCheckedQuestions] = useState(new Set());

  const shuffledOptions = React.useMemo(() => {
    if (!current?.options) return [];
    return [...current.options].sort(() => Math.random() - 0.5);
  }, [current?.id, current?.options]);

  const isLastQuestion = currentIndex >= total - 1;

  const handleNext = useCallback(async () => {
    if (!current) return;

    const answer = answers?.[current.id];
    if (!answer?.option_id) {
      if (!isLastQuestion) actions.next();
      return;
    }

    setChecking(true);
    try {
      const { data } = await axios.post(`/quiz-attempts/${props.attempt.id}/check-answer`, {
        question_id: current.id,
        option_id: answer.option_id,
      });

      setFeedback({
        isCorrect: data.is_correct,
        feedbackText: data.feedback || (data.is_correct ? "Jawaban kamu benar!" : "Jawaban kamu salah."),
      });
      setCheckedQuestions((prev) => {
        const next = new Set(prev);
        next.add(current.id);
        return next;
      });
    } catch {
      if (!isLastQuestion) actions.next();
    } finally {
      setChecking(false);
    }
  }, [current, currentIndex, total, answers, actions, props.attempt.id, isLastQuestion]);

  const { startTour, addSteps, next, back, cancel, complete } = useTour();

  React.useEffect(() => {
    addSteps([
      {
        id: 'question',
        title: 'Pertanyaan Kuis',
        text: 'Ini adalah area pertanyaan kuis. Pilih satu jawaban yang menurutmu benar.',
        attachTo: { element: '#tour-quiz-question', on: 'bottom' },
        buttons: [
          { text: 'Lewati', action: cancel, classes: 'shepherd-button-secondary' },
          { text: 'Lanjut', action: next }
        ]
      },
      {
        id: 'sidebar',
        title: 'Panel Kontrol',
        text: 'Lihat sisa waktu, jumlah soal yang sudah dijawab, dan navigasi soal di sini.',
        attachTo: { element: '#tour-quiz-aside', on: 'left' },
        buttons: [
          { text: 'Kembali', action: back, classes: 'shepherd-button-secondary' },
          { text: 'Selesai', action: complete }
        ]
      }
    ]);
  }, []);


  return (
      <div className="relative w-full overflow-hidden">
        {/* Background Decorative Blurs */}
        <div className="absolute -right-40 h-[500px] w-[500px] rounded-full pointer-events-none" />
        <div className="absolute -left-40 h-[400px] w-[400px] rounded-full pointer-events-none" />

        <div className="relative z-10 mx-auto ">
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Main Content Area */}
            <main className="flex-1 space-y-2">

              <div id="tour-quiz-question" className="overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/70 shadow-2xl shadow-slate-200/50 backdrop-blur-xl">

                <div className="p-6">
                  {!current ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <span className="text-2xl text-slate-400">?</span>
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
                          {current.quiz_text ?? current.question_text}
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

                      <div className="mt-6 grid gap-3">
                        {shuffledOptions.map((opt) => {
                          const selected = answers?.[current.id]?.option_id === opt.id;
                          const locked = actions.isAnswered(current); 
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={locked}
                              onClick={() => {
                                actions.setOptionOnce(current.id, opt.id);
                              }}
                              className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-300 ${
                                selected
                                  ? "border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500"
                                  : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5"
                              } ${
                                locked && !selected
                                  ? "opacity-60 cursor-not-allowed"
                                  : "active:scale-[0.98]"
                              }`}
                            >
                              <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-300 ${
                                selected
                                  ? "border-indigo-500 bg-indigo-500 text-white"
                                  : "border-slate-200 bg-slate-50 text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-400"
                              }`}>
                                <svg className={`h-2.5 w-2.5 transition-transform duration-300 ${selected ? "scale-100" : "scale-0"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </div>
                              <span className={`text-[12px] font-medium ${selected ? "text-indigo-900" : "text-slate-700"}`}>
                                {opt.option_text}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </main>

            {/* Right Sidebar Panel */}
            <aside id="tour-quiz-aside" className="w-full lg:w-[260px] shrink-0">
              <div className="sticky top-8 space-y-6">
                <div className="overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/70 shadow-2xl shadow-slate-200/50 backdrop-blur-xl">
                  <div className="p-5">
                    <div className="mb-6 flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sisa Waktu</span>
                      </div>
                      <span className={`text-[14px] font-black tabular-nums ${remaining < 60 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
                        {formatMMSS(remaining)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      <div className="flex flex-col gap-1 p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                        <span className="text-[9px] font-semibold text-indigo-400 uppercase tracking-widest leading-none">Terjawab</span>
                        <span className="text-[14px] font-bold text-slate-900 leading-tight truncate">{answeredCount} / {total}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Kuis</span>
                          <span className="text-[11px] font-bold text-slate-900 truncate" title={cfg?.title ?? "-"}>{cfg?.title ?? "-"}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Navigasi</h3>
                      <div className="grid grid-cols-5 gap-2">
                        {questions.map((q, idx) => {
                          const isCurrent = idx === currentIndex;
                          const isDone = actions.isAnswered(q);
                          return (
                            <Button
                              key={q.id}
                              color={isCurrent ? "blue" : (isDone ? "green" : "gray")}
                              variant={isCurrent || isDone ? "solid" : "outline"}
                              size="sm"
                              onClick={() => actions.goTo(idx)}
                              className={`!h-8 !w-8 !text-[11px] !rounded-xl !p-0 flex items-center justify-center ${
                                isCurrent
                                  ? "shadow-lg shadow-indigo-500/40 ring-4 ring-indigo-50"
                                  : isDone
                                  ? "shadow-md shadow-emerald-500/20"
                                  : ""
                              } ${
                                "hover:-translate-y-1"
                              }`}
                            >
                              {idx + 1}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <Button
                        color="yellow"
                        size="sm"
                        onClick={handleNext}
                        disabled={checking || (isLastQuestion && current && checkedQuestions.has(current.id))}
                        className="w-full !rounded-3xl !py-3 shadow-lg shadow-amber-500/20"
                      >
                        {checking ? "Memeriksa..." : isLastQuestion ? "Cek Jawaban" : "Berikutnya"}
                      </Button>

                      <Button
                        color="green"
                        size="sm"
                        onClick={() => actions.submit(false)}
                        className="w-full !rounded-3xl !py-3 shadow-lg shadow-emerald-500/30"
                      >
                        Selesaikan Kuis
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
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2rem] backdrop-blur-md shadow-inner mb-6">
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
                    setFeedback(null);
                    if (!isLastQuestion) actions.next();
                  }}
                  className="w-full !rounded-[1.5rem] !py-3 font-black uppercase tracking-[0.2em] shadow-lg"
                >
                  Lanjutkan
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
