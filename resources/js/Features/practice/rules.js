import { DIFFICULTY, PASSING_SCORE, EXCELLENT_SCORE } from "./constants";

export function calculateDifficultyRule(scores) {
  const sEasy = scores?.easy ?? null;
  const sNormal = scores?.normal ?? null;
  const sHard = scores?.hard ?? null;

  if (typeof sHard === "number" && sHard > EXCELLENT_SCORE) {
    return {
      enabled: { easy: true, normal: true, hard: true },
      suggest: null,
      nextAction: null,
      hint: "Level Hard sudah > 80. Materi selesai, lanjut ke materi berikutnya.",
      tone: "success",
    };
  }

  if (typeof sHard === "number" && sHard < EXCELLENT_SCORE) {
    return {
      enabled: { easy: true, normal: true, hard: true },
      suggest: DIFFICULTY.HARD,
      nextAction: { type: "practice", difficulty: DIFFICULTY.HARD },
      hint:
        sHard < PASSING_SCORE
          ? "Hard masih di bawah 60. Sistem akan arahkan remedial sub-topik atau turun ke Medium."
          : "Hard belum > 80. Lanjutkan remedial sub-topik sampai > 80.",
      tone: "warn",
    };
  }

  if (typeof sNormal === "number" && sNormal >= PASSING_SCORE) {
    return {
      enabled: { easy: true, normal: true, hard: true },
      suggest: DIFFICULTY.HARD,
      nextAction: { type: "practice", difficulty: DIFFICULTY.HARD },
      hint: `Nilai Medium ${sNormal} sudah lulus. Lanjut ke level Hard.`,
      tone: "ok",
    };
  }

  if (typeof sNormal === "number" && sNormal < PASSING_SCORE) {
    return {
      enabled: { easy: true, normal: true, hard: true },
      suggest: DIFFICULTY.NORMAL,
      nextAction: { type: "practice", difficulty: DIFFICULTY.NORMAL },
      hint: "Jika Medium < 60, sistem akan remedial sub-topik 1x lalu fallback ke Easy jika masih belum lulus.",
      tone: "warn",
    };
  }

  if (typeof sEasy === "number" && sEasy < PASSING_SCORE) {
    return {
      enabled: { easy: true, normal: true, hard: true },
      suggest: DIFFICULTY.EASY,
      nextAction: { type: "practice", difficulty: DIFFICULTY.EASY },
      hint: "Easy belum lulus. Sistem menyediakan remedial sub-topik maksimal 3x sebelum rekomendasi baca ulang materi.",
      tone: "warn",
    };
  }

  if (typeof sEasy === "number" && sEasy >= PASSING_SCORE) {
    return {
      enabled: { easy: true, normal: true, hard: true },
      suggest: DIFFICULTY.NORMAL,
      nextAction: { type: "practice", difficulty: DIFFICULTY.NORMAL },
      hint: "Easy sudah lulus. Lanjut ke level Medium.",
      tone: "ok",
    };
  }

  return {
    enabled: { easy: true, normal: true, hard: true },
    suggest: DIFFICULTY.NORMAL,
    nextAction: { type: "practice", difficulty: DIFFICULTY.NORMAL },
    hint: "Mulai pre-test dari level Medium untuk menentukan level awal.",
    tone: "info",
  };
}

export const canSelectDifficulty = (level, rule) => {
  if (!rule?.enabled) {
    return true;
  }

  return Boolean(rule.enabled[level]);
};
