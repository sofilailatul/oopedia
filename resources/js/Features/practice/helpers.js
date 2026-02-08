export const totalQuestions = (questionCounts, difficulty, questionType) => {
  if (!difficulty || !questionType) return 0;
  return questionCounts?.[difficulty]?.[questionType] ?? 0;
};

export const canStartPractice = (selectedPractice, difficulty, questionType) => {
  if (!selectedPractice || !difficulty || !questionType) return false;

  const practiceId = selectedPractice.levels?.[difficulty];
  const total = totalQuestions(selectedPractice.question_counts, difficulty, questionType);

  return Boolean(practiceId) && total > 0;
};
