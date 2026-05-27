import React from "react";
import { Link } from "@inertiajs/react";
import { FaTimes, FaBookOpen, FaArrowRight } from "react-icons/fa";
import Button from "@/Components/Button";
import {
  levelLabel,
  getFlowUI,
  getJourneySteps,
  PASSING_SCORE,
  HARD_PASSING_SCORE,
} from "@/Features/practice/core";

// ─── Main component ────────────────────────────────────────────────────────────

export default function PracticeSidebar({
  selectedPractice,
  progress = null,
  onClose,
  onStart,
  canStart = true,
  startLabel,
  showJoinCta = false,
  joinHref,
  joinLabel,
}) {
  const [openLevels, setOpenLevels] = React.useState({
    easy: false,
    medium: false,
    hard: false,
  });
  const scores = selectedPractice?.scores ?? { easy: null, medium: null, hard: null };
  const scoresByMode = selectedPractice?.scores_by_mode ?? {
    easy: { normal: null, focused_remedial: null },
    medium: { normal: null, focused_remedial: null },
    hard: { normal: null, focused_remedial: null },
  };
  const flow = getFlowUI(progress);
  const steps = getJourneySteps(progress, scores);
  const focusedSubtopicNames = progress?.focused_subtopic_names ?? (progress?.focused_subtopic_name ? [progress.focused_subtopic_name] : []);

  const toggleLevel = (level) => {
    setOpenLevels((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

      {/* Header — fixed, tidak ikut scroll */}
      <div className="flex-shrink-0 border-b border-slate-100 px-4 py-4 md:px-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 leading-snug">
            {selectedPractice?.material_name ?? "Pilih Materi"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
        >
          <FaTimes className="w-3 h-3" />
        </button>
      </div>

      {/* Konten scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-4 md:p-5">

          {/* Journey stepper — dengan skor per level */}
          <JourneyStepper steps={steps} scores={scores} pretestScore={progress?.pretest_score ?? null} />

          {/* Current action card */}
          <ActionCard flow={flow} />

          {/* Focused subtopic — hanya saat mode remedial */}
          {flow.showSubtopic && focusedSubtopicNames.length > 0 && (
            <InfoSection label="Fokus pada topik ini">
              <div className="flex flex-col gap-2">
                {focusedSubtopicNames.map((name, idx) => (
                  <div key={idx} className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                    <p className="text-[11px] font-medium text-amber-800">{name}</p>
                  </div>
                ))}
              </div>
            </InfoSection>
          )}

          {/* Scores per level — termasuk nilai remedial */}
          <InfoSection label="Nilai per level">
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              {["easy", "medium", "hard"].map((level, i) => (
                <LevelScoreAccordionRow
                  key={level}
                  level={level}
                  practiceId={selectedPractice?.levels?.[level] ?? null}
                  score={scores[level]}
                  modeScores={scoresByMode[level]}
                  isOpen={Boolean(openLevels[level])}
                  onToggle={() => toggleLevel(level)}
                  divider={i < 2}
                />
              ))}
            </div>
          </InfoSection>


          {/* Read-material warning */}
          {progress?.current_mode === "repeat_material" && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
              <FaBookOpen className="mt-0.5 text-amber-500 flex-shrink-0" style={{ fontSize: 14 }} />
              <div>
                <p className="text-[13px] font-medium text-amber-800">
                  Baca ulang materi sebelum latihan lagi
                </p>
                <p className="mt-0.5 text-[12px] text-amber-700 leading-relaxed">
                  Setelah memahami materi, kembali ke sini untuk melanjutkan.
                </p>
              </div>
            </div>
          )}

          {/* Summary history links */}
          {selectedPractice?.summary_links?.length > 0 && (
            <InfoSection label="Riwayat ringkasan">
              <div className="space-y-1.5">
                {selectedPractice.summary_links.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-left hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors"
                  >
                    <p className="text-[12px] font-medium text-slate-700">{item.label}</p>
                    <span className="rounded-lg bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {item.score ?? 0} pts
                    </span>
                  </Link>
                ))}
              </div>
            </InfoSection>
          )}
        </div>
      </div>

      {/* CTA — sticky di bawah, tidak ikut scroll */}
      <div className="flex-shrink-0 border-t border-slate-100 p-4 pt-3 md:p-5">
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            disabled={!canStart}
            onClick={() => onStart?.()}
            variant="solid"
            color="indigo"
            size="lg"
            className={`w-full rounded-2xl font-semibold py-3.5 transition-all
              ${!canStart
                ? "bg-slate-100 text-slate-400 border border-slate-200 shadow-none"
                : "shadow-[0_4px_14px_0_rgb(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.2)] hover:bg-indigo-700"
              }`}
          >
            <span className="inline-flex items-center gap-2 text-sm">
              {startLabel ?? flow.button}
              <FaArrowRight style={{ fontSize: 11 }} />
            </span>
          </Button>

          {showJoinCta && joinHref && (
            <Button
              as={Link}
              href={joinHref}
              variant="outline"
              color="blue"
              size="lg"
              className="w-full rounded-2xl font-semibold py-3.5"
            >
              {joinLabel ?? "Gabung Kelas"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Journey stepper ───────────────────────────────────────────────────────────

const STEP_STYLES = {
  done:    { dot: "bg-green-100 text-green-700",    label: "text-green-700" },
  active:  { dot: "bg-blue-100 text-blue-700 ring-2 ring-blue-300 ring-offset-1", label: "text-blue-700 font-medium" },
  skipped: { dot: "bg-slate-100 text-slate-400",    label: "text-slate-400" },
  locked:  { dot: "bg-slate-50 text-slate-300 border border-slate-200", label: "text-slate-300" },
};

const STEP_ICONS = {
  done:    "✓",
  active:  "●",
  skipped: "—",
  locked:  "○",
};

// Map step key → skor yang relevan
function getStepScore(key, scores, pretestScore) {
  if (key === "pretest") return pretestScore;
  if (key === "passed")  return null;
  return scores?.[key] ?? null;
}

function JourneyStepper({ steps, scores = {}, pretestScore = null }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
        Perjalananmu
      </p>
      <div className="flex items-center overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const score = getStepScore(step.key, scores, pretestScore);
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${STEP_STYLES[step.state].dot}`}>
                  {STEP_ICONS[step.state]}
                </div>
                <span className={`text-[9px] ${STEP_STYLES[step.state].label}`}>
                  {step.label}
                </span>
                {/* Nilai di bawah label — tampil jika sudah ada skor */}
                <span className={`text-[9px] font-semibold ${
                  score != null ? "text-slate-500" : "text-slate-300"
                }`}>
                  {score != null ? score : "—"}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-1 mb-7 ${
                  step.state === "done" ? "bg-green-300" : "bg-slate-200"
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Action card ───────────────────────────────────────────────────────────────

const TONE_STYLES = {
  blue:  "bg-blue-50 border-blue-100",
  amber: "bg-amber-50 border-amber-100",
  red:   "bg-red-50 border-red-100",
  green: "bg-emerald-50 border-emerald-100",
  slate: "bg-slate-50 border-slate-200",
};

const TONE_TITLE = {
  blue:  "text-blue-800",
  amber: "text-amber-800",
  red:   "text-red-800",
  green: "text-emerald-800",
  slate: "text-slate-800",
};

const TONE_HINT = {
  blue:  "text-blue-700",
  amber: "text-amber-700",
  red:   "text-red-700",
  green: "text-emerald-700",
  slate: "text-slate-600",
};

function ActionCard({ flow }) {
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${TONE_STYLES[flow.tone] ?? TONE_STYLES.slate}`}>
      <p className={`text-[12px] font-semibold mb-1 ${TONE_TITLE[flow.tone] ?? TONE_TITLE.slate}`}>
        {flow.title}
      </p>
      <p className={`text-[11px] leading-relaxed ${TONE_HINT[flow.tone] ?? TONE_HINT.slate}`}>
        {flow.hint}
      </p>
    </div>
  );
}

// ─── Reason box ────────────────────────────────────────────────────────────────

const REASON_STYLES = {
  slate: "bg-slate-50 text-slate-600 border-slate-200",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  red:   "bg-red-50 text-red-700 border-red-100",
};

function ReasonBox({ text, tone }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 text-[11px] leading-relaxed ${REASON_STYLES[tone] ?? REASON_STYLES.slate}`}>
      {text}
    </div>
  );
}

// ─── Level score row ───────────────────────────────────────────────────────────

const LEVEL_DOT = {
  easy:   "bg-teal-400",
  medium: "bg-amber-400",
  hard:   "bg-blue-500",
};

function formatModeScore(level, score) {
  if (score == null) {
    return { label: "Belum ada nilai", tone: "text-slate-400" };
  }

  const threshold = level === "hard" ? HARD_PASSING_SCORE : PASSING_SCORE;
  if (score >= threshold) {
    return { label: `${score} - lulus`, tone: "text-emerald-700" };
  }

  return { label: `${score} - belum lulus`, tone: "text-red-600" };
}

function LevelScoreAccordionRow({ level, practiceId, score, modeScores, isOpen, onToggle, divider }) {
  const normalScore = modeScores?.normal ?? null;
  const remedialScore = modeScores?.focused_remedial ?? null;
  const hasAttempt = normalScore != null || remedialScore != null || score != null;
  const summary = score != null ? `${score}` : "Belum pernah dikerjakan";
  const summaryTone = hasAttempt ? "text-slate-700" : "text-slate-400";
  const normalHref = practiceId ? `${route("practices.summary", practiceId)}?mode=normal` : null;
  const remedialHref = practiceId ? `${route("practices.summary", practiceId)}?mode=focused_remedial` : null;

  return (
    <div className={`${divider ? "border-b border-slate-100" : ""} ${!hasAttempt ? "bg-slate-100/70" : "bg-slate-50/50"}`}>
      <button
        type="button"
        onClick={onToggle}
        disabled={!hasAttempt}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-left ${!hasAttempt ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasAttempt ? LEVEL_DOT[level] : "bg-slate-300"}`} />
          {levelLabel(level)}
        </span>
        <span className="flex items-center gap-2">
          <span className={`text-[10px] ${summaryTone}`}>{summary}</span>
          <span className={`text-[10px] ${hasAttempt ? "text-slate-500" : "text-slate-300"}`}>
            {isOpen ? "▾" : "▸"}
          </span>
        </span>
      </button>

      {isOpen && hasAttempt && (
        <div className="px-3 pb-3 space-y-1.5">
          <Link
            href={normalHref ?? "#"}
            className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 ${
              normalScore != null && normalHref
                ? "border-slate-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
                : "border-slate-100 bg-slate-50 pointer-events-none"
            }`}
          >
            <span className="text-[10px] font-medium text-slate-500">Mode Normal</span>
            <span className={`text-[10px] font-medium ${formatModeScore(level, normalScore).tone}`}>
              {formatModeScore(level, normalScore).label}
            </span>
          </Link>
          <Link
            href={remedialHref ?? "#"}
            className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 ${
              remedialScore != null && remedialHref
                ? "border-slate-100 bg-white hover:border-amber-200 hover:bg-amber-50/30"
                : "border-slate-100 bg-slate-50 pointer-events-none"
            }`}
          >
            <span className="text-[10px] font-medium text-slate-500">Mode Remedial</span>
            <span className={`text-[10px] font-medium ${formatModeScore(level, remedialScore).tone}`}>
              {formatModeScore(level, remedialScore).label}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Info section wrapper ──────────────────────────────────────────────────────

function InfoSection({ label, children }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      {children}
    </div>
  );
}