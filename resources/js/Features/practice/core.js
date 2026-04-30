// ─── Constants ────────────────────────────────────────────────────────────────

export const PRACTICE_LEVEL = Object.freeze({
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
});

export const PRACTICE_MODE = Object.freeze({
  PRETEST: "pretest",
  NORMAL: "normal",
  FOCUSED_REMEDIAL: "focused_remedial",
  REPEAT_MATERIAL: "repeat_material",
  PASSED: "passed",
});

export const QUESTION_TYPE = Object.freeze({
  MC: "multiple_choice",
  DRAG: "drag_drop",
  MIXED: "mixed",
});

export const PASSING_SCORE = 60;
export const HARD_PASSING_SCORE = 80;

// ─── Label helpers ─────────────────────────────────────────────────────────────

export function levelLabel(level) {
  return { easy: "Easy", medium: "Medium", hard: "Hard" }[level] ?? "-";
}

export function modeLabel(mode) {
  return {
    pretest: "Pretest",
    normal: "Latihan",
    focused_remedial: "Remedial",
    repeat_material: "Baca Ulang",
    passed: "Selesai",
  }[mode] ?? "-";
}

export function questionTypeLabel(type) {
  return {
    multiple_choice: "Multiple Choice",
    drag_drop: "Drag & Drop",
    mixed: "Campuran",
  }[type] ?? "-";
}

// ─── Status helpers ────────────────────────────────────────────────────────────

export function isPracticeLocked(practice) {
  return Boolean(practice?.is_locked || practice?.material_read === false);
}

export function canStartPractice(practice) {
  if (!practice || isPracticeLocked(practice)) return false;
  return practice?.progress?.current_mode !== "unknown";
}

export function getPracticeStatus(practice) {
  if (isPracticeLocked(practice)) return "locked";
  const mode = practice?.progress?.current_mode ?? null;
  if (mode === PRACTICE_MODE.PASSED) return "completed";
  if (mode) return "available";
  return "available";
}

// ─── Journey steps ─────────────────────────────────────────────────────────────
// Returns array of { key, label, state } for the progress stepper.
// state: "done" | "active" | "skipped" | "locked"

export function getJourneySteps(progress, scores) {
  const mode = progress?.current_mode ?? PRACTICE_MODE.PRETEST;
  const level = progress?.current_level ?? null;
  const pretestDone = Boolean(progress?.completed_pretest_at);

  // Determine which levels were skipped (pretest score placed user above them)
  const pretestScore = progress?.pretest_score ?? null;
  const skippedLevels = new Set();
  if (pretestScore !== null) {
    if (pretestScore > 80) {
      skippedLevels.add("easy");
      skippedLevels.add("medium");
    } else if (pretestScore > 60) {
      skippedLevels.add("easy");
    }
  }

  const isPassed = mode === PRACTICE_MODE.PASSED;

  function levelState(lvl) {
    if (scores?.[lvl] != null && scores[lvl] >= PASSING_SCORE && lvl !== "hard") return "done";
    if (lvl === "hard" && scores?.hard != null && scores.hard >= HARD_PASSING_SCORE) return "done";
    if (skippedLevels.has(lvl)) return "skipped";
    if (level === lvl) return "active";
    // If current level is higher, this one is done or skipped already
    const order = { easy: 0, medium: 1, hard: 2 };
    if (level && order[lvl] < order[level]) return "done";
    return "locked";
  }

  return [
    {
      key: "pretest",
      label: "Pre-test",
      state: pretestDone ? "done" : "active",
    },
    { key: "easy",   label: "Easy",   state: levelState("easy") },
    { key: "medium", label: "Medium", state: levelState("medium") },
    { key: "hard",   label: "Hard",   state: levelState("hard") },
    {
      key: "passed",
      label: "Lulus",
      state: isPassed ? "done" : "locked",
    },
  ];
}

// ─── Level score display ────────────────────────────────────────────────────────
// Returns { label, variant } for each level's score cell.
// variant: "done" | "fail" | "active" | "skipped" | "pending"

export function getLevelScoreDisplay(level, score, progress) {
  const mode = progress?.current_mode ?? null;
  const currentLevel = progress?.current_level ?? null;
  const pretestScore = progress?.pretest_score ?? null;

  const skippedLevels = new Set();
  if (pretestScore !== null) {
    if (pretestScore > 80) { skippedLevels.add("easy"); skippedLevels.add("medium"); }
    else if (pretestScore > 60) skippedLevels.add("easy");
  }

  const passingThreshold = level === "hard" ? HARD_PASSING_SCORE : PASSING_SCORE;

  if (score != null && score >= passingThreshold) {
    return { label: `${score}`, variant: "done" };
  }

  if (score != null && score < passingThreshold) {
    const isCurrentLevel = currentLevel === level;
    if (isCurrentLevel && mode === PRACTICE_MODE.REPEAT_MATERIAL) {
      return { label: `${score} — perlu baca ulang`, variant: "fail" };
    }
    return { label: `${score} — belum lulus`, variant: "fail" };
  }

  // score is null
  if (skippedLevels.has(level)) {
    return { label: "Di-skip", variant: "skipped", note: "otomatis" };
  }

  if (currentLevel === level) {
    return { label: "Belum dikerjakan", variant: "active" };
  }

  return { label: "Menunggu", variant: "pending" };
}

// ─── Flow UI ───────────────────────────────────────────────────────────────────
// Single source of truth for all UI strings & tone based on current progress.

export function getFlowUI(progress) {
  const mode = progress?.current_mode ?? PRACTICE_MODE.PRETEST;
  const level = progress?.current_level ?? null;
  const focusedSubtopics = progress?.focused_subtopic_names ?? (progress?.focused_subtopic_name ? [progress.focused_subtopic_name] : []);
  const hasFocused = focusedSubtopics.length > 0;
  const pretestScore = progress?.pretest_score ?? null;
  const remCount = progress?.easy_remedial_count ?? null;

  const lvlText = level ? levelLabel(level) : null;

  switch (mode) {
    case PRACTICE_MODE.PRETEST:
      return {
        tone: "blue",
        title: "Mulai pre-test dulu",
        hint: "Pre-test menentukan di level mana kamu akan mulai latihan. Kerjakan sebaik mungkin.",
        button: "Mulai pre-test",
        stageLabel: "Pre-test",
        showSubtopic: false,
      };

    case PRACTICE_MODE.NORMAL: {
      const initialLevel = pretestScore !== null 
        ? (pretestScore < 60 ? "easy" : pretestScore <= 80 ? "medium" : "hard")
        : null;
      const isInitialLevel = level === initialLevel;
      const target = level === "hard" ? `> ${HARD_PASSING_SCORE}` : `> ${PASSING_SCORE}`;
      // Gabungkan info pretest score ke hint jika ini level penempatan dari pretest
      const pretestHint = (pretestScore != null && isInitialLevel)
        ? ` Nilai pre-test kamu ${pretestScore}.`
        : "";
      return {
        tone: "slate",
        title: lvlText ? `Lanjutkan level ${lvlText}` : "Kerjakan latihan",
        hint: `Selesaikan dengan skor ${target} untuk lanjut ke tahap berikutnya.${pretestHint}`,
        button: `Mulai latihan ${lvlText ?? ""}`.trim(),
        stageLabel: lvlText ? `Level ${lvlText}` : "Latihan",
        showSubtopic: false,
      };
    }

    case PRACTICE_MODE.FOCUSED_REMEDIAL: {
      const remText = remCount != null && level === "easy"
        ? `Percobaan ke-${remCount} dari 3.`
        : null;
      const remedialLevelText = lvlText ? `Level ${lvlText}` : "Level aktif";
      return {
        tone: "amber",
        title: hasFocused
          ? `Remedial ${remedialLevelText}`
          : `Remedial ${remedialLevelText}`,
        hint: [
          level === "easy" && remCount != null
            ? `Nilai > ${PASSING_SCORE} untuk naik ke Medium.`
            : level === "medium"
            ? `Nilai > ${PASSING_SCORE} untuk naik ke Hard.`
            : `Nilai ≥ ${PASSING_SCORE} untuk menuju level berikutnya.`,
          remText,
        ]
          .filter(Boolean)
          .join(" "),
        button: `Kerjakan remedial ${lvlText ?? ""}`.trim(),
        stageLabel: lvlText ? `Remedial Level ${lvlText}` : "Remedial",
        showSubtopic: hasFocused,  // hanya tampil jika ada subtopik yang difokuskan
        placementReason: remText,
      };
    }

    case PRACTICE_MODE.REPEAT_MATERIAL:
      return {
        tone: "red",
        title: "Baca ulang materi dulu",
        hint: "Sudah 3x remedial di Easy tapi belum mencapai 60. Baca ulang materi, lalu kembali ke sini untuk mencoba lagi.",
        button: "Ke halaman materi",
        stageLabel: "Baca ulang",
        showSubtopic: false,   // baca ulang materi, bukan fokus subtopik
        showPlacementReason: false,
      };

    case PRACTICE_MODE.PASSED:
      return {
        tone: "green",
        title: "Latihan selesai",
        hint: "Kamu sudah menyelesaikan semua level. Lanjut ke materi berikutnya.",
        button: "Lanjut ke materi berikutnya",
        stageLabel: "Selesai",
        showSubtopic: false,
      };

    default:
      return {
        tone: "slate",
        title: "Latihan",
        hint: "Mulai latihan.",
        button: "Mulai",
        stageLabel: "Latihan",
        showSubtopic: false,
      };
  }
}
