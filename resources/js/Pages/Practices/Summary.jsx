import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link } from "@inertiajs/react";
import Button from "@/Components/Button";
import Icons from "@/icons";
import {
  levelLabel as difficultyLabel,
  PASSING_SCORE,
  HARD_PASSING_SCORE,
} from "@/Features/practice/core";

// ─── Derive summary state dari data backend ────────────────────────────────────
function useSummaryState({ attempt, cfg, nextLevel }) {
  const finalScore   = Number(attempt?.final_score ?? 0);
  const attemptLevel = cfg?.level ?? attempt?.level ?? null;
  const attemptType  = attempt?.attempt_type ?? "practice";

  const threshold = attemptLevel === "hard" ? HARD_PASSING_SCORE : PASSING_SCORE;
  const isPassed = finalScore >= threshold;
  const showCorrectAnswers = isPassed;

  // ✅ Selalu ikut backend, jangan hitung target level sendiri di frontend
  const action       = nextLevel?.action ?? null;
  const nextLvl      = nextLevel?.next_level ?? null;
  const nextMessage  = nextLevel?.message ?? null;
  const weakSubTopic =
    nextLevel?.weak_sub_topic ??
    nextLevel?.weak_subtopic_name ??
    null;

  const actionMeta = deriveActionMeta(action, nextLvl, attemptLevel);

  return {
    finalScore,
    threshold,
    isPassed,
    showCorrectAnswers,
    attemptLevel,
    attemptType,
    action,
    nextLvl,
    nextMessage,
    weakSubTopic,
    actionMeta,
  };
}

function deriveActionMeta(action, nextLvl, currentLevel) {
  const nextLabel = nextLvl ? difficultyLabel(nextLvl) : null;
  const currLabel = currentLevel ? difficultyLabel(currentLevel) : null;

  switch (action) {
    case "go_next_material":
    case "next_material":
      return {
        tone: "purple",
        icon: "ChevronRight",
        heading: "Selesai — lanjut ke materi berikutnya",
        ctaLabel: "Lihat materi berikutnya",
        ctaHref: route("materials.index"),
      };

    case "next_level":
      return {
        tone: "green",
        icon: "Play",
        heading: nextLabel ? `Naik ke level ${nextLabel}` : "Lanjut ke level berikutnya",
        ctaLabel: nextLabel ? `Mulai level ${nextLabel}` : "Lanjut latihan",
        ctaHref: route("practices.index"),
      };

    case "retry":
      return {
        tone: "amber",
        icon: "Refresh",
        heading: currLabel ? `Ulangi remedial level ${currLabel}` : "Ulangi remedial",
        ctaLabel: "Ulangi latihan",
        ctaHref: route("practices.index"),
      };

    case "fallback_easy":
    case "fallback_medium": {
      const fallbackLabel = nextLabel ?? "bawah";
      return {
        tone: "amber",
        icon: "Refresh",
        heading: `Turun ke level ${fallbackLabel} — fokus sub-topik lemah`,
        ctaLabel: `Kerjakan level ${fallbackLabel}`,
        ctaHref: route("practices.index"),
      };
    }

    case "review_material":
    case "read_material_again":
      return {
        tone: "red",
        icon: "BookOpen",
        heading: "Baca ulang materi dulu",
        ctaLabel: "Ke halaman materi",
        ctaHref: route("practices.index"),
      };

    default:
      return {
        tone: "slate",
        icon: "ChevronRight",
        heading: "Kembali ke latihan",
        ctaLabel: "Kembali",
        ctaHref: route("practices.index"),
      };
  }
}

// ─── Tone style maps ──────────────────────────────────────────────────────────

const TONE_BTN = {
  purple: "purple",
  green: "emerald",
  amber: "amber",
  red: "rose",
  slate: "indigo",
};

const TONE_ICON_BG = {
  purple: "bg-purple-100 text-purple-600",
  green: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  red: "bg-rose-100 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function Summary({ practice, attempt, answers, cfg, nextLevel }) {
  const materialName = practice?.material?.material_name ?? "-";
  const totalAnswers = answers?.length ?? 0;

  const {
    finalScore,
    threshold,
    isPassed,
    showCorrectAnswers,
    attemptLevel,
    attemptType,
    nextMessage,
    weakSubTopic,
    actionMeta,
  } = useSummaryState({ attempt, cfg, nextLevel });

  const levelText = difficultyLabel(attemptLevel);
  const attemptTypeLabel =
    { pretest: "Pre-test", practice: "Latihan", remedial: "Remedial" }[attemptType] ?? "Latihan";

  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const latestAnswers = Object.values(
    (answers ?? []).reduce((acc, row) => {
      const qid = Number(row?.practice_questions_id ?? row?.question?.id ?? 0);
      if (!qid) return acc;
      const prev = acc[qid];
      if (!prev || Number(row?.attempt ?? 0) >= Number(prev?.attempt ?? 0)) {
        acc[qid] = row;
      }
      return acc;
    }, {}),
  );

  const reviewedAnswers = latestAnswers.map((answer) => buildReviewedAnswer(answer));
  const subtopicScores = buildSubtopicScores(latestAnswers);

  return (
    <AppLayout
      title="Hasil Latihan Soal"
      label="Hasil Latihan Soal"
      backHref={route("practices.index")}
      backLabel="Kembali ke Daftar"
    >
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
        <HeroBanner
          isPassed={isPassed}
          finalScore={finalScore}
          threshold={threshold}
          materialName={materialName}
          levelText={levelText}
          attemptTypeLabel={attemptTypeLabel}
          today={today}
        />

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <ScoreCard
            finalScore={finalScore}
            threshold={threshold}
            isPassed={isPassed}
            totalAnswers={totalAnswers}
            subtopicScores={subtopicScores}
          />
          <NextActionCard
            actionMeta={actionMeta}
            nextMessage={nextMessage}
            weakSubTopic={weakSubTopic}
          />
        </div>

        <AnswerReview
          reviewedAnswers={reviewedAnswers}
          showCorrectAnswers={showCorrectAnswers}
          threshold={threshold}
        />
      </div>
    </AppLayout>
  );
}

// ─── Hero banner ──────────────────────────────────────────────────────────────

function HeroBanner({ isPassed, finalScore, threshold, materialName, levelText, attemptTypeLabel, today }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 p-6 md:p-8 text-white shadow-lg shadow-indigo-200">
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-14 -left-6 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-50 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            {today}
          </div>
          <div>
            <p className="text-sm font-medium text-sky-100/90">
              {attemptTypeLabel} · {materialName} · Level {levelText}
            </p>
            <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight leading-tight">
              {isPassed ? "Mantap, kamu lulus level ini!" : "Belum lulus — tapi ini bukan akhir"}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-sky-100/85">
              {isPassed
                ? `Nilai kamu ${finalScore} — melewati batas minimum ${threshold}. Lihat arahan berikutnya di bawah.`
                : `Nilai kamu ${finalScore} — butuh minimal ${threshold} untuk lulus. Cek review jawaban untuk tahu yang perlu diperbaiki.`}
            </p>
          </div>
        </div>

        <div className="shrink-0 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm min-w-[140px] text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-100/80 mb-2">Nilai kamu</p>
          <p className="text-5xl font-semibold tracking-tight">{finalScore}</p>
          <p className="mt-1 text-xs text-sky-100/70">min. {threshold} untuk lulus</p>
          <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
            isPassed ? "bg-emerald-400/25 text-emerald-50" : "bg-rose-400/25 text-rose-50"
          }`}>
            {isPassed ? "Lulus" : "Belum lulus"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Score card ───────────────────────────────────────────────────────────────

function ScoreCard({ finalScore, threshold, isPassed, totalAnswers, subtopicScores = [] }) {
  const correctCount = Math.round((finalScore / 100) * totalAnswers);

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Nilai per sub-topik
          </p>
          <span className="text-[11px] text-slate-500">{subtopicScores.length} sub-topik</span>
        </div>

        {subtopicScores.length > 0 ? (
          <div className="space-y-3">
            {subtopicScores.map((item) => {
              const barColor = item.percentage >= 70 ? "bg-emerald-400" : "bg-rose-400";

              return (
                <div key={item.key} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="text-[12px] font-medium text-slate-800">{item.name}</p>
                    <span className="text-[11px] font-semibold text-slate-700">
                      {item.percentage}%
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{item.correctCount}/{item.totalQuestions} benar</span>
                    <span>{item.earnedScore}/{item.maxScore} poin</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-sm text-slate-500">
            Data sub-topik belum tersedia.
          </div>
        )}

      <div className="mt-5">
        <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
          <span>0</span>
          <span className="text-slate-500">Batas: {threshold}</span>
          <span>100</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isPassed ? "bg-emerald-400" : "bg-rose-400"}`}
            style={{ width: `${Math.min(finalScore, 100)}%` }}
          />
        </div>
        <div className="relative" style={{ marginTop: -10 }}>
          <div
            className="absolute h-4 w-0.5 bg-slate-400"
            style={{ left: `${threshold}%`, transform: "translateX(-50%)" }}
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, highlight = false, suffix = null }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tracking-tight ${highlight ? "text-emerald-600" : "text-slate-900"}`}>
        {value}
        {suffix ? <span className="text-sm font-normal text-slate-400 ml-1">{suffix}</span> : null}
      </p>
    </div>
  );
}

// ─── Next action card ─────────────────────────────────────────────────────────

function NextActionCard({ actionMeta, nextMessage, weakSubTopic }) {
  const IconComp = Icons[actionMeta.icon] ?? Icons.ChevronRight;
  const btnColor = TONE_BTN[actionMeta.tone] ?? "indigo";
  const iconBg = TONE_ICON_BG[actionMeta.tone] ?? TONE_ICON_BG.slate;

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm flex flex-col">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Arahan berikutnya</p>
      <h3 className="mt-1 text-base font-semibold text-slate-900">{actionMeta.heading}</h3>

      {nextMessage && (
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{nextMessage}</p>
      )}

      {weakSubTopic && (
        <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
          <p className="text-[11px] font-medium text-amber-700 uppercase tracking-wide">Sub-topik lemah</p>
          <p className="text-sm font-medium text-amber-900 mt-0.5">{weakSubTopic}</p>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 flex-1 flex flex-col justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 ${iconBg}`}>
            <IconComp className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium text-slate-800">{actionMeta.ctaLabel}</p>
        </div>

        <Button
          as={Link}
          href={actionMeta.ctaHref}
          variant="solid"
          color={btnColor}
          size="md"
          className="w-full rounded-full"
        >
          {actionMeta.ctaLabel}
        </Button>
      </div>
    </div>
  );
}

// ─── Answer review ────────────────────────────────────────────────────────────

function AnswerReview({ reviewedAnswers, showCorrectAnswers, threshold }) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Review jawaban</p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">Soal dan jawaban yang kamu isi</h3>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {reviewedAnswers.length > 0 ? (
          reviewedAnswers.map((item, index) => (
            <QuestionReviewCard
              key={item.id ?? index}
              item={item}
              index={index}
              showCorrectAnswers={showCorrectAnswers}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            Belum ada jawaban yang bisa ditampilkan.
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionReviewCard({ item, index, showCorrectAnswers }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">Soal {index + 1}</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-900">{item.questionText}</p>
        </div>
        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-semibold flex-shrink-0 ${
          item.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
        }`}>
          {item.isCorrect ? "Benar" : "Salah"}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {item.questionType === "multiple_choice"
          ? <MultipleChoiceOptions item={item} showCorrectAnswers={showCorrectAnswers} />
          : <DragDropAnswer item={item} showCorrectAnswers={showCorrectAnswers} />}
      </div>

      {showCorrectAnswers && (
        <p className={`mt-3 text-[12px] leading-relaxed ${item.isCorrect ? "text-emerald-600" : "text-rose-600"}`}>
          {item.isCorrect ? item.feedbackCorrect : item.feedbackIncorrect}
        </p>
      )}
    </div>
  );
}

function MultipleChoiceOptions({ item, showCorrectAnswers }) {
  if (!item.options.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-500">
        Opsi jawaban tidak tersedia.
      </div>
    );
  }

  return item.options.map((option) => {
    const optId = Number(option?.id ?? 0);
    const isSelected = optId === item.selectedOptionId;
    const isCorrectOpt = Number(option?.is_correct) === 1;
    const showAsCorrect = showCorrectAnswers && isCorrectOpt;

    const cls = isSelected
      ? (item.isCorrect
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-rose-300 bg-rose-50 text-rose-700")
      : showAsCorrect
        ? "border-emerald-200 bg-emerald-50/60 text-emerald-700"
        : "border-slate-200 bg-white text-slate-700";

    return (
      <div key={optId} className={`rounded-xl border p-3 ${cls}`}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm leading-relaxed">{option?.option_text ?? "-"}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isSelected && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                item.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}>
                Pilihanmu
              </span>
            )}
            {showAsCorrect && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Jawaban benar
              </span>
            )}
          </div>
        </div>
      </div>
    );
  });
}

function DragDropAnswer({ item, showCorrectAnswers }) {
  const userSteps = Array.isArray(item.userAnswerItems) ? item.userAnswerItems : [];
  const correctSteps = Array.isArray(item.correctAnswerItems) ? item.correctAnswerItems : [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Jawaban kamu
          </p>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              item.isCorrect
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {item.isCorrect ? "Sudah benar" : "Perlu diperbaiki"}
          </span>
        </div>

        {userSteps.length > 0 ? (
          <div className="space-y-2">
            {userSteps.map((step, index) => (
              <div
                key={`user-step-${index}`}
                className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${
                  item.isCorrect
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-rose-200 bg-rose-50/60"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    item.isCorrect
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed text-slate-800">{step}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-400">
            Belum ada susunan jawaban.
          </div>
        )}
      </div>

      {showCorrectAnswers ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Urutan yang benar
            </p>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
              Acuan
            </span>
          </div>

          {correctSteps.length > 0 ? (
            <div className="space-y-2">
              {correctSteps.map((step, index) => (
                <div
                  key={`correct-step-${index}`}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-800">{step}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-400">
              Urutan jawaban benar tidak tersedia.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400 mb-3">
            Urutan yang benar
          </p>
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-400">
            Tersembunyi — lulus dulu untuk melihat urutan yang benar.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Build reviewed answer dari raw answer row ────────────────────────────────

function parseIsCorrect(value) {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0" || value == null) return false;
  return Number(value) === 1;
}

function buildReviewedAnswer(answer) {
  const question = answer?.question ?? {};
  const questionType = question?.type ?? "multiple_choice";
  const options = Array.isArray(question?.options) ? question.options : [];
  const items = Array.isArray(question?.items) ? question.items : [];

  const selectedOptionId = Number(
    answer?.practice_options_id ?? answer?.practiceOptionId ?? answer?.option?.id ?? 0,
  );

  const selectedOption =
    answer?.option ??
    options.find((o) => Number(o?.id) === Number(answer?.practice_options_id)) ??
    options.find((o) => Number(o?.id) === selectedOptionId) ??
    null;

  const correctOption = options.find((o) => Number(o?.is_correct) === 1);
  const correctItems = items
    .slice()
    .sort((a, b) => Number(a?.id ?? 0) - Number(b?.id ?? 0))
    .map((i) => i?.item_text)
    .filter(Boolean);

  const selectedItems = Array.isArray(answer?.selection_items)
    ? answer.selection_items.map((item) => String(item).trim()).filter(Boolean)
    : [];

  const isCorrect = parseIsCorrect(answer?.is_correct);

  const correctAnswerText = questionType === "multiple_choice"
    ? (correctOption?.option_text ?? "-")
    : (correctItems.join(" → ") || "-");

  const userAnswerText = questionType === "multiple_choice"
    ? (selectedOption?.option_text ?? "Belum dijawab")
    : (selectedItems.join(" → ") || "Belum dijawab");

  return {
    id: answer?.id ?? question?.id,
    questionText: question?.question_text ?? "-",
    questionType,
    isCorrect,
    selectedOptionId,
    options,
    userAnswerText,
    correctAnswerText,
    userAnswerItems: selectedItems,
    correctAnswerItems: correctItems,
    feedbackCorrect: question?.feedback_correct ?? "Jawaban kamu sudah benar.",
    feedbackIncorrect: question?.feedback_incorrect ?? "Jawaban kamu belum tepat.",
  };
}

function getSubtopicName(question) {
  return (
    question?.subtopic?.name ??
    question?.subTopicRef?.name ??
    question?.sub_topic_ref?.name ??
    question?.sub_topic_name ??
    question?.sub_topic ??
    question?.subtopic_name ??
    question?.subtopicName ??
    null
  );
}

function buildSubtopicScores(latestAnswers = []) {
  const grouped = new Map();

  latestAnswers.forEach((answer) => {
    const question = answer?.question ?? {};
    const subtopicId = question?.subtopic_id ?? question?.sub_topic_id ?? null;
    const subtopicName = getSubtopicName(question);
    const key = subtopicId != null ? `subtopic-${subtopicId}` : `subtopic-${subtopicName ?? "unknown"}`;
    const name = subtopicName ?? (subtopicId != null ? `Sub-topik ${subtopicId}` : "Sub-topik lain");

    const questionPoints = Number(question?.points ?? 10);
    const earnedFromAnswer = Number(answer?.score ?? 0);
    const isCorrect = parseIsCorrect(answer?.is_correct);
    const earnedScore = Number.isFinite(earnedFromAnswer)
      ? earnedFromAnswer
      : (isCorrect ? questionPoints : 0);

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        name,
        earnedScore: 0,
        maxScore: 0,
        correctCount: 0,
        totalQuestions: 0,
      });
    }

    const row = grouped.get(key);
    row.earnedScore += earnedScore;
    row.maxScore += questionPoints;
    row.correctCount += isCorrect ? 1 : 0;
    row.totalQuestions += 1;
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      percentage: item.maxScore > 0 ? Math.round((item.earnedScore / item.maxScore) * 100) : 0,
    }))
    .sort((a, b) => a.percentage - b.percentage);
}