import { useMemo, useState } from "react";

export function useQuizIndex({ quizzes = [] }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [perPage, setPerPage] = useState(3);

  const openSidebar = (quiz) => {
    setSelectedQuiz(quiz);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setSelectedQuiz(null);
  };

  const visibleQuizzes = useMemo(() => {
    return quizzes.slice(0, perPage);
  }, [quizzes, perPage]);

  return {
    state: { sidebarOpen, selectedQuiz, perPage },
    view: { visibleQuizzes },
    actions: { openSidebar, closeSidebar, setPerPage },
  };
}
