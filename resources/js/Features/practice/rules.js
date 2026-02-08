import { DIFFICULTY, PASSING_SCORE, EXCELLENT_SCORE } from "./constants";

export function calculateDifficultyRule(scores) {
  const sEasy = scores?.easy ?? null;
  const sNormal = scores?.normal ?? null;
  const sHard = scores?.hard ?? null;

  // optional: kalau kamu memang pakai "selesai >80 semua"
  const allDone = [sEasy, sNormal, sHard].every((v) => typeof v === "number");
  const allExcellent = [sEasy, sNormal, sHard].every((v) => typeof v === "number" && v > EXCELLENT_SCORE);
  if (allDone && allExcellent) {
    return {
      enabled: { easy: true, normal: true, hard: true },
      suggest: null,
      nextAction: null,
      hint: "🎉 Selamat, Anda telah menyelesaikan latihan soal.",
      tone: "success",
    };
  }

  // belum pernah normal => wajib normal
  if (sNormal == null) {
    return {
      enabled: { easy: false, normal: true, hard: false },
      suggest: DIFFICULTY.NORMAL,
      nextAction: { type: "practice", difficulty: DIFFICULTY.NORMAL },
      hint: "Mulai dengan Level NORMAL terlebih dahulu.",
      tone: "info",
    };
  }

  // normal < 60 => disarankan easy, hard terkunci
  if (sNormal < PASSING_SCORE) {
    return {
      enabled: { easy: true, normal: true, hard: false },
      suggest: DIFFICULTY.EASY,
      nextAction: { type: "practice", difficulty: DIFFICULTY.EASY },
      hint: `Nilai NORMAL terakhir ${sNormal}. Kerjakan level Easy dulu ya.`,
      tone: "warn",
    };
  }

  // normal >= 60 => hard terbuka (sesuai narasi kamu)
  return {
    enabled: { easy: true, normal: true, hard: true },
    suggest: DIFFICULTY.HARD,
    nextAction: { type: "practice", difficulty: DIFFICULTY.HARD },
    hint: `Good Job! Nilai NORMAL terakhir ${sNormal}. Lanjutkan ke Level Hard ya.`,
    tone: "ok",
  };
}

export const canSelectDifficulty = (level, rule) => Boolean(rule?.enabled?.[level]);
