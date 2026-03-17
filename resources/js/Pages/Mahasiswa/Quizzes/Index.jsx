// resources/js/Pages/Mahasiswa/Quizzes/Index.jsx
import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import { usePopup } from "@/Components/PopUp/PopUpProvider";

import { useQuizIndex } from "@/Features/quiz/useQuizIndex";
import QuizCard from "@/Components/Quiz/quizCard";
import QuizSidebar from "@/Components/Quiz/quizSidebar";

export default function Index({ quizzes = [] }) {
  const vm = useQuizIndex({ quizzes });
  const { state, view, actions } = vm;
  const popup = usePopup();

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
