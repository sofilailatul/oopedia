import { DIFFICULTY, PASSING_SCORE, EXCELLENT_SCORE } from "./constants";

/**
 * Alur latihan:
 * Start: Normal Level
 * 1. Normal < 60 → Go to Easy
 * 2. Easy < 60 → Retry Easy (loop)
 * 3. Easy ≥ 60 → Back to Normal
 * 4. Normal < 60 (after Easy) → Retry Normal (loop)
 * 5. Normal ≥ 60 → Go to Hard
 * 6. Hard < 60 → Retry Hard (loop)
 * 7. Hard ≥ 60 → Next Material
 */
export function calculateDifficultyRule(scores) {
  const sEasy = scores?.easy ?? null;
  const sNormal = scores?.normal ?? null;
  const sHard = scores?.hard ?? null;

  const allDone = [sEasy, sNormal, sHard].every((v) => typeof v === "number");
  const allExcellent = [sEasy, sNormal, sHard].every((v) => typeof v === "number" && v > EXCELLENT_SCORE);

  if (allDone && allExcellent) {
    return {
      enabled: { easy: true, normal: true, hard: true },
      suggest: null,
      nextAction: null,
      hint: "Selamat, semua level sudah selesai dengan sangat baik.",
      tone: "success",
    };
  }

  // Jika hard sudah lulus, selesai materi.
  if (typeof sHard === "number" && sHard >= PASSING_SCORE) {
    return {
      enabled: { easy: true, normal: true, hard: true },
      suggest: null,
      nextAction: null,
      hint: "Excellent! Level HARD sudah lulus. Lanjut ke materi berikutnya.",
      tone: "success",
    };
  }

  // Requirement utama: kalau normal sudah lulus, langsung ke hard.
  if (typeof sNormal === "number" && sNormal >= PASSING_SCORE) {
    return {
      enabled: { easy: true, normal: true, hard: true },
      suggest: DIFFICULTY.HARD,
      nextAction: { type: "practice", difficulty: DIFFICULTY.HARD },
      hint:
        typeof sHard === "number" && sHard < PASSING_SCORE
          ? `Nilai HARD terakhir ${sHard}. Coba ulang HARD lagi sampai lulus.`
          : `Nilai NORMAL ${sNormal} sudah lulus. Lanjut ke level HARD.`,
      tone: typeof sHard === "number" && sHard < PASSING_SCORE ? "warn" : "ok",
    };
  }

  // Belum ada nilai normal sama sekali: mulai dari normal.
  if (sNormal == null) {
    return {
      enabled: { easy: false, normal: true, hard: false },
      suggest: DIFFICULTY.NORMAL,
      nextAction: { type: "practice", difficulty: DIFFICULTY.NORMAL },
      hint: "Mulai dari level NORMAL terlebih dahulu.",
      tone: "info",
    };
  }

  // Normal belum lulus: jalur easy -> normal.
  if (sNormal < PASSING_SCORE) {
    if (sEasy == null || sEasy < PASSING_SCORE) {
      return {
        enabled: { easy: true, normal: false, hard: false },
        suggest: DIFFICULTY.EASY,
        nextAction: { type: "practice", difficulty: DIFFICULTY.EASY },
        hint:
          sEasy == null
            ? `Nilai NORMAL terakhir ${sNormal}. Kerjakan EASY dulu, NORMAL dikunci sementara.`
            : `Nilai EASY terakhir ${sEasy}. Ulangi EASY sampai > ${PASSING_SCORE} untuk buka NORMAL lagi.`,
        tone: "warn",
      };
    }

    // Easy sudah lulus, balik lagi ke normal.
    return {
      enabled: { easy: true, normal: true, hard: false },
      suggest: DIFFICULTY.NORMAL,
      nextAction: { type: "practice", difficulty: DIFFICULTY.NORMAL },
      hint: `EASY sudah lulus (${sEasy}). Kembali ke NORMAL dan coba lagi.`,
      tone: "ok",
    };
  }

  // Fallback aman.
  return {
    enabled: { easy: true, normal: true, hard: false },
    suggest: DIFFICULTY.NORMAL,
    nextAction: { type: "practice", difficulty: DIFFICULTY.NORMAL },
    hint: "Lanjutkan latihan di level NORMAL.",
    tone: "info",
  };
}

export const canSelectDifficulty = (level, rule) => Boolean(rule?.enabled?.[level]);
