import { DIFFICULTY, QUESTION_TYPE } from "./constants";

export const difficultyLabel = (level) =>
  ({
    [DIFFICULTY.EASY]: "Easy",
    [DIFFICULTY.NORMAL]: "Medium",
    [DIFFICULTY.HARD]: "Hard",
  }[level] ?? "Pilih Level");

export const questionTypeLabel = (type) =>
  ({
    [QUESTION_TYPE.MC]: "Multiple Choice",
    [QUESTION_TYPE.DRAG]: "Drag & Drop",
    [QUESTION_TYPE.MIXED]: "Mixed (MCQ + Drag & Drop)",
  }[type] ?? "Pilih Tipe Soal");
