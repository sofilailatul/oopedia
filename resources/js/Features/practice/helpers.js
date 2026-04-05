export const totalQuestions = (questionCounts, difficulty, questionType) => {
  if (!difficulty || !questionType) return 0;
  if (questionType === "mixed") {
    const mc = questionCounts?.[difficulty]?.multiple_choice ?? 0;
    const drag = questionCounts?.[difficulty]?.drag_drop ?? 0;
    return mc + drag;
  }
  return questionCounts?.[difficulty]?.[questionType] ?? 0;
};

export const canStartPractice = (selectedPractice, difficulty, questionType) => {
  if (!selectedPractice || !difficulty || !questionType) return false;

  // Tidak boleh mulai jika materi terkait belum dibaca
  if (selectedPractice.is_locked || selectedPractice.material_read === false) return false;

  const practiceId = selectedPractice.levels?.[difficulty];
  const total = totalQuestions(selectedPractice.question_counts, difficulty, questionType);

  return Boolean(practiceId) && total > 0;
};
