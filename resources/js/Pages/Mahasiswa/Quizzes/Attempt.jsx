import React, { useState, useCallback } from "react";
import axios from "axios";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/Button";
import { useQuizAttempt } from "@/Features/quiz/useQuizAttempt";
import { useQuizPopups } from "@/Features/quiz/QuizPopUp";
import { formatMMSS } from "@/Features/quiz/time";
import { useTour } from "@/Hooks/useTour";
import { FaQuestionCircle } from "react-icons/fa";


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
  const popups = useQuizPopups();
  const [checking, setChecking] = useState(false);

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

      popups.showFeedback({
        isCorrect: data.is_correct,
        feedback: data.feedback,
        ms: 10000,
        onDone: () => { if (!isLastQuestion) actions.next(); },
      });
    } catch {
      if (!isLastQuestion) actions.next();
    } finally {
      setChecking(false);
    }
  }, [current, currentIndex, total, answers, actions, props.attempt.id, popups, isLastQuestion]);

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
      <div className=" mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={startTour}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <FaQuestionCircle className="text-rose-500 h-4 w-4" />
            Butuh panduan?
          </button>
        </div>
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
                KUIS {cfg?.title ?? ""}
              </div>
            </div>



            <div id="tour-quiz-question" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

              {!current ? (
                <div className="text-slate-500">Soal tidak tersedia.</div>
              ) : (
                <>
                  <div className="text-lg font-semibold text-slate-900">
                    <span className="mr-3">{currentIndex + 1}.</span>
                    {current.quiz_text ?? current.question_text}
                  </div>

                  {(current.image_path || current.image_url) && (
                    <div className="mt-6 flex justify-center">
                      <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                        <img
                          src={current.image_url ? current.image_url : `/storage/${current.image_path}`}
                          alt="Question"
                          className="max-h-[280px] rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-8 space-y-4">
                    {(current.options ?? []).map((opt) => {
                      const selected = answers?.[current.id]?.option_id === opt.id;
                      const locked = actions.isAnswered(current); 
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={locked}
                          onClick={() => {
                            actions.setOptionOnce(current.id, opt.id);
                            console.log(`Soal #${currentIndex + 1} → Jawaban: "${opt.option_text}" (Option ID: ${opt.id})`);
                          }}
                          className={[
                            "w-full text-left rounded-2xl border px-5 py-4 transition",
                            selected ? "border-slate-700 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50",
                            locked && !selected ? "opacity-50 cursor-not-allowed" : "",
                          ].join(" ")}
                        >
                          <div className="text-slate-800">
                            {opt.option_text}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </main>

          <aside id="tour-quiz-aside" className="w-[360px] shrink-0">

            <div className="bg-white rounded-2xl border shadow-sm p-5 sticky top-6 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-600">Terjawab</div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {answeredCount}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-600">Waktu</div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {formatMMSS(remaining)}
                  </div>
                </div>
              </div>

              <div className="mt-5 ">
                <div className="grid grid-cols-6 gap-3">
                  {questions.map((q, idx) => {
                    const active = idx === currentIndex;
                    const done = actions.isAnswered(q);

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => actions.goTo(idx)}
                        className={[
                          "w-11 h-11 rounded-xl border text-sm font-semibold flex items-center justify-center transition",
                          active
                            ? "bg-slate-700 text-white border-slate-700"
                            : done
                            ? "bg-slate-200 text-slate-800 border-slate-200"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                variant="solid"
                color="yellow"
                onClick={handleNext}
                disabled={checking}
                className="w-full "
              >
                {checking ? "Memeriksa..." : isLastQuestion ? "Cek Jawaban" : "Lanjut Pertanyaan Selanjutnya"}
              </Button>

              <Button
                variant="solid"
                color="green"
                onClick={() => actions.submit(false)}
                className="w-full"
              >
                Submit Jawaban
              </Button>
            </div>
          </aside>
        </div>
      </div>
  );
}
