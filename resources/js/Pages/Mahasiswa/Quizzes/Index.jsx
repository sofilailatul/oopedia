// resources/js/Pages/Mahasiswa/Quizzes/Index.jsx
import React, { useEffect } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import { usePopup } from "@/Components/PopUp/PopUpProvider";
import { FaQuestionCircle } from "react-icons/fa";

import { useQuizIndex } from "@/Features/quiz/useQuizIndex";
import QuizCard from "@/Components/Quiz/quizCard";
import QuizSidebar from "@/Components/Quiz/quizSidebar";
import { useTour } from "@/Hooks/useTour";

export default function Index({ quizzes = [] }) {
  const vm = useQuizIndex({ quizzes });
  const { state, view, actions } = vm;
  const popup = usePopup();

  const { startTour, checkAndStart, addSteps, next, back, cancel, complete } = useTour({
    storageKey: 'oopedia_tour_quizzes',
  });

  useEffect(() => {
    addSteps([
      {
        id: 'quiz-intro',
        title: 'Halaman Quiz',
        text: 'Di sini kamu bisa melihat semua quiz yang tersedia. Quiz adalah ujian akhir setelah kamu menyelesaikan semua materi dan latihan soal terkait.',
        buttons: [
          { text: 'Lanjut →', action: next },
        ],
      },
      {
        id: 'quiz-status',
        title: 'Status Quiz',
        text: 'Quiz yang terkunci artinya kamu belum menyelesaikan semua syaratnya. Selesaikan latihan soal terlebih dahulu agar quiz terbuka.',
        buttons: [
          { text: '← Kembali', action: back, classes: 'shepherd-button-secondary' },
          { text: 'Lanjut →', action: next },
        ],
      },
      {
        id: 'quiz-start',
        title: 'Cara Mulai Quiz',
        text: 'Klik kartu quiz untuk melihat detailnya — waktu pengerjaan, jumlah soal, dan passing score. Kalau sudah siap, klik tombol Mulai Quiz!',
        buttons: [
          { text: '← Kembali', action: back, classes: 'shepherd-button-secondary' },
          { text: 'Siap! Mulai Belajar 🚀', action: complete },
        ],
      },
    ]);
    checkAndStart();
  }, []);

  const onStart = (quiz) => {
    if (quiz.end_at && new Date(quiz.end_at) < new Date()) {
      popup.alert({
        title: "Waktu Habis",
        message: "Batas pengerjaan sudah habis. Hubungi dosen yang bersangkutan.",
        confirmText: "Tutup",
      });
      return;
    }
    router.post(route("quizzes.attempts.start", quiz.id));
  };

  const onReview = (quiz) => {
    if (!quiz?.attempt_id) return;
    router.get(route("quizzes.review", quiz.attempt_id));
  };

  return (
    <AppLayout title="Kuis" label="Kuis" fullHeight={false}>
      <div className="space-y-6 min-h-[582px]">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kuis</h1>
          <button
            onClick={startTour}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <FaQuestionCircle className="text-indigo-500 h-4 w-4" />
            Panduan Quiz
          </button>
        </div>

        {/* DESKTOP */}
        <div className="hidden lg:flex items-start">
          <main className="flex-1">
            <div className="grid grid-cols-3 gap-6">
              {view.visibleQuizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onClick={actions.openSidebar}
                />
              ))}
            </div>
          </main>

          <aside
            className={[
              "transition-all duration-300 ease-in-out overflow-hidden",
              state.sidebarOpen ? "w-[370px] pl-4" : "w-0 pl-0",
            ].join(" ")}
          >
            <div className="w-full">
              {state.sidebarOpen && (
                <QuizSidebar
                  quiz={state.selectedQuiz}
                  onClose={actions.closeSidebar}
                  onStart={onStart}
                  onReview={onReview}
                />
              )}
            </div>
          </aside>
        </div>

        {/* MOBILE/TABLET */}
        <div className="lg:hidden">
          <main>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {view.visibleQuizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onClick={actions.openSidebar}
                />
              ))}
            </div>
          </main>

          {state.sidebarOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/30"
                onClick={actions.closeSidebar}
              />

              <aside className="fixed top-0 right-0 z-50 h-full w-[92%] max-w-[420px] p-4">
                <div className="h-full overflow-y-auto">
                  <QuizSidebar
                    quiz={state.selectedQuiz}
                    onClose={actions.closeSidebar}
                    onStart={onStart}
                    onReview={onReview}
                  />
                </div>
              </aside>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
