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
  purple: "blue",
  green: "green",
  amber: "yellow",
  red: "red",
  slate: "gray",
};

const TONE_ICON_BG = {
  purple: "bg-indigo-100 text-indigo-600",
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
      <div className="mx-auto space-y-6 pb-8">
        <HeroBanner
          isPassed={isPassed}
          finalScore={finalScore}
          threshold={threshold}
          materialName={materialName}
          levelText={levelText}
          attemptTypeLabel={attemptTypeLabel}
          attemptType={attemptType}
          today={today}
          actionMeta={actionMeta}
          nextMessage={nextMessage}
          weakSubTopic={weakSubTopic}
        />

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr] items-start">
          <AnswerReview
            reviewedAnswers={reviewedAnswers}
            showCorrectAnswers={showCorrectAnswers}
            threshold={threshold}
          />

          <ScoreCard
            finalScore={finalScore}
            threshold={threshold}
            isPassed={isPassed}
            totalAnswers={totalAnswers}
            subtopicScores={subtopicScores}
          />
        </div>
      </div>
    </AppLayout>
  );
}

// ─── Hero banner ──────────────────────────────────────────────────────────────

function HeroBanner({ isPassed, finalScore, threshold, materialName, levelText, attemptTypeLabel, today, attemptType, actionMeta, nextMessage, weakSubTopic }) {
  const IconComp = Icons[actionMeta.icon] ?? Icons.ChevronRight;
  const btnColor = TONE_BTN[actionMeta.tone] ?? "indigo";
  const iconBg = TONE_ICON_BG[actionMeta.tone] ?? TONE_ICON_BG.slate;

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sky-50 via-white to-blue-50 p-7 text-slate-900 border border-sky-100 shadow-xl shadow-slate-200/40 transition-all duration-500">
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-sky-200/20 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-blue-200/20 blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-sky-100 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600 shadow-sm backdrop-blur-md">
            <span className={`h-2 w-2 rounded-full animate-pulse ${isPassed ? "bg-emerald-400" : "bg-rose-400"}`} />
            {today}
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-widest">{attemptTypeLabel}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="text-xs font-medium uppercase tracking-widest">{materialName}</span>
              {attemptType !== "pretest" && (
                <>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="text-xs font-medium uppercase tracking-widest">Level {levelText}</span>
                </>
              )}
            </div>
            
            <h1 className="text-3xl font-black tracking-tight leading-tight text-slate-900">
              {isPassed ? "KERJA BAGUS!" : "JANGAN MENYERAH!"}
            </h1>
            
            <p className="mt-4 max-w-xl text-[12px] text-slate-500 font-normal leading-relaxed">
              {isPassed
                ? `Kamu berhasil melewati tantangan ini dengan skor ${finalScore}. Terus pertahankan semangat belajarmu!`
                : `Skor kamu ${finalScore}, sedikit lagi mencapai target ${threshold}. Yuk, pelajari lagi bagian yang masih sulit.`}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex flex-col md:flex-row items-center gap-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-sky-200/30 blur-2xl rounded-full scale-110 group-hover:scale-125 transition-transform duration-500" />
            <div className="relative rounded-[3rem] border border-sky-100 bg-white/80 p-7 backdrop-blur-xl min-w-[180px] text-center shadow-2xl">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-0.5">Skor Akhir</p>
              <p className="text-5xl font-black tracking-tighter tabular-nums text-slate-900">{finalScore}</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${isPassed ? "bg-emerald-400" : "bg-rose-400"}`} />
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
                  {isPassed ? "LULUS" : "GAGAL"}
                </p>
              </div>
            </div>
          </div>
          {/* Next Action in Hero */}
          <div className="hidden lg:flex flex-col min-w-[200px] max-w-[250px]">
             <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-inner ${iconBg}`}>
                <IconComp className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rencana Lanjut</p>
                <p className="text-[12px] font-bold text-slate-900 leading-snug truncate max-w-[200px]">{actionMeta.heading}</p>
              </div>
            </div>

            <Button
              as={Link}
              href={actionMeta.ctaHref}
              variant="solid"
              color={btnColor}
              size="sm"
              className="!rounded-lg font-bold uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20"
            >
              {actionMeta.ctaLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Score card ───────────────────────────────────────────────────────────────

function ScoreCard({ finalScore, threshold, isPassed, totalAnswers, subtopicScores = [] }) {
  return (
    <div className="rounded-[2.5rem] border border-white/60 bg-white/70 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Analisis Capaian</h3>
          <p className="text-[10px] font-medium text-slate-500 mt-0.5">Detail nilai per sub-topik materi</p>
        </div>
        <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
          <Icons.Progress className="h-3.5 w-3.5 text-indigo-600" />
        </div>
      </div>
      {subtopicScores.length > 0 ? (
        <div className="space-y-3">
          {subtopicScores.map((item) => {
            const isHigh = item.percentage >= 70;
            return (
              <div key={item.key} className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-2.5 transition-all duration-300 hover:bg-white hover:shadow-md hover:border-slate-200">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${isHigh ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                      {isHigh ? <Icons.Check className="h-2.5 w-2.5" /> : <Icons.Error className="h-2.5 w-2.5" />}
                    </div>
                    <p className="text-[11px] font-medium text-slate-800 truncate">{item.name}</p>
                  </div>
                  <span className={`text-[12px] font-bold ${isHigh ? "text-emerald-600" : "text-rose-600"}`}>
                    {item.percentage}
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/50">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${isHigh ? "bg-emerald-500" : "bg-rose-500"}`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>

                <div className="mt-2.5 flex items-center gap-4 text-[9px] font-medium uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1">
                    <Icons.Star className="h-2.5 w-2.5" /> {item.earnedScore}/{item.maxScore} Poin
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 py-10 text-center">
          <Icons.Info className="h-7 w-7 text-slate-300 mb-2" />
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Analisis tidak tersedia</p>
        </div>
      )}
    </div>
  );
}


// ─── Answer review ────────────────────────────────────────────────────────────

function AnswerReview({ reviewedAnswers, showCorrectAnswers, threshold }) {
  return (
    <div className="rounded-[2.5rem] border border-white/60 bg-white/70 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">Review Jawaban</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200">
          <span className="text-[10px] font-bold text-slate-600 tabular-nums">{reviewedAnswers.length} Pertanyaan</span>
        </div>
      </div>

      <div className="grid gap-4">
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
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 py-8 text-center">
            <Icons.Practice className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Belum ada jawaban untuk direview</p>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionReviewCard({ item, index, showCorrectAnswers }) {
  const isHigh = item.isCorrect;
  return (
    <div className="group rounded-3xl border border-slate-100 bg-white p-4 transition-all duration-300 hover:shadow-xl hover:border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 mb-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-slate-900 text-[8px] font-bold text-white">
              {index + 1}
            </span>
            <h4 className="text-[12px] font-semibold text-slate-800 leading-relaxed max-w-2xl">{item.questionText}</h4>
          </div>
        </div>
        
        <div className={`flex items-center gap-1.5 px-2.5 h-6 rounded-xl border font-semibold text-[9px] uppercase tracking-widest ${
          isHigh ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
        }`}>
          {isHigh ? <Icons.CheckCircle className="h-2.5 w-2.5" /> : <Icons.Failed className="h-2.5 w-2.5" />}
          {isHigh ? "Benar" : "Salah"}
        </div>
      </div>

      <div className="mt-2 space-y-2.5">
        {/* Code Snippet for drag-drop questions */}
        {item.questionType === "drag_drop" && item.codeSnippet && (
          <div className="rounded-xl border border-slate-700/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border-b border-slate-700/50">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Code Snippet</span>
            </div>
            <div className="p-3 overflow-x-auto">
              <pre className="text-[11px] leading-relaxed font-mono text-emerald-300 whitespace-pre-wrap">
                <code>{item.codeSnippet}</code>
              </pre>
            </div>
          </div>
        )}

        {item.questionType === "multiple_choice"
          ? <MultipleChoiceOptions item={item} showCorrectAnswers={showCorrectAnswers} />
          : <DragDropAnswer item={item} showCorrectAnswers={showCorrectAnswers} />}
      </div>

      {showCorrectAnswers && (
        <div className={`mt-4 p-3.5 rounded-xl border leading-relaxed text-[11px] font-normal ${
          isHigh ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" : "bg-rose-50/50 border-rose-100 text-rose-800"
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <Icons.Lightbulb className={`h-3 w-3 ${isHigh ? "text-emerald-500" : "text-rose-500"}`} />
            <span className="text-[8px] font-bold uppercase tracking-widest">Penjelasan</span>
          </div>
          {isHigh ? item.feedbackCorrect : item.feedbackIncorrect}
        </div>
      )}
    </div>
  );
}

function MultipleChoiceOptions({ item, showCorrectAnswers }) {
  if (!item.options.length) return null;

  return (
    <div className="grid gap-3">
      {item.options.map((option) => {
        const optId = Number(option?.id ?? 0);
        const isSelected = optId === item.selectedOptionId;
        const isCorrectOpt = Number(option?.is_correct) === 1;
        const showAsCorrect = showCorrectAnswers && isCorrectOpt;

        let styleClass = "border-slate-100 bg-slate-50/50 text-slate-600";
        if (isSelected) {
          styleClass = item.isCorrect 
            ? "border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm" 
            : "border-rose-200 bg-rose-50 text-rose-900 shadow-sm";
        } else if (showAsCorrect) {
          styleClass = "border-emerald-200 bg-emerald-50/30 text-emerald-700";
        }

        return (
          <div key={optId} className={`relative overflow-hidden rounded-xl border p-2.5 transition-all ${styleClass}`}>
            <div className="flex items-center justify-between gap-3 relative z-10">
              <p className="text-[12px] font-medium">{option?.option_text ?? "-"}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                {isSelected && (
                  <span className={`px-1.5 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest ${
                    item.isCorrect ? "bg-emerald-200 text-emerald-800" : "bg-rose-200 text-rose-800"
                  }`}>
                    Pilihanmu
                  </span>
                )}
                {showAsCorrect && (
                  <Icons.CheckCircle className="h-4 w-4 text-emerald-500" />
                )}
              </div>
            </div>
            {isSelected && <div className={`absolute inset-0 opacity-10 ${item.isCorrect ? "bg-emerald-400" : "bg-rose-400"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function DragDropAnswer({ item, showCorrectAnswers }) {
  const userSteps = Array.isArray(item.userAnswerItems) ? item.userAnswerItems : [];
  const correctSteps = Array.isArray(item.correctAnswerItems) ? item.correctAnswerItems : [];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-2.5">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Jawaban Kamu</p>
        <div className={`rounded-2xl border p-3.5 ${item.isCorrect ? "bg-emerald-50/30 border-emerald-100" : "bg-rose-50/30 border-rose-100"}`}>
          {userSteps.length > 0 ? (
            <div className="space-y-1.5">
              {userSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-medium text-slate-500">{index + 1}</span>
                  <p className="text-[12px] font-medium text-slate-800 leading-tight">{step}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-3 text-center text-[11px] font-normal text-slate-400">Kosong</p>
          )}
        </div>
      </div>

      {showCorrectAnswers && (
        <div className="space-y-2.5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Solusi Benar</p>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3.5">
            <div className="space-y-1.5">
              {correctSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-emerald-100 shadow-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-[10px] font-medium text-white">{index + 1}</span>
                  <p className="text-[12px] font-medium text-slate-800 leading-tight">{step}</p>
                </div>
              ))}
            </div>
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
    codeSnippet: question?.code_snippet ?? null,
    feedbackCorrect: question?.feedback_correct ?? "Jawaban kamu sudah benar.",
    feedbackIncorrect: question?.feedback_incorrect ?? "Jawaban kamu belum tepat.",
  };
}

function getSubtopicName(question) {
  return (
    question?.sub_topic_ref?.name ??
    question?.subTopicRef?.name ??
    question?.sub_topic_name ??
    question?.subtopic_name ??
    question?.subtopicName ??
    question?.subtopic?.name ??
    question?.sub_topic ??
    null
  );
}

function buildSubtopicScores(latestAnswers = []) {
  const grouped = new Map();

  latestAnswers.forEach((answer) => {
    const question = answer?.question ?? {};

    const subtopicId =
      question?.subtopic_id ??
      question?.sub_topic_id ??
      question?.subTopicId ??
      question?.sub_topic_ref?.id ??
      question?.subTopicRef?.id ??
      question?.sub_topic?.id ??
      question?.subTopic?.id ??
      question?.subtopic?.id ??
      null;

    const subtopicName = getSubtopicName(question);

    const key =
      subtopicId != null
        ? `subtopic-${subtopicId}`
        : `subtopic-${subtopicName ?? "unknown"}`;

    const name =
      subtopicName ??
      (subtopicId != null
        ? `Sub-topik ${subtopicId}`
        : "Sub-topik belum terhubung");

    const questionPoints = Number(question?.points ?? 10);
    const isCorrect = parseIsCorrect(answer?.is_correct);

    const rawScore = answer?.score;
    const earnedScore =
      rawScore !== undefined && rawScore !== null && rawScore !== ""
        ? Number(rawScore)
        : isCorrect
          ? questionPoints
          : 0;

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

    row.earnedScore += Number.isFinite(earnedScore) ? earnedScore : 0;
    row.maxScore += questionPoints;
    row.correctCount += isCorrect ? 1 : 0;
    row.totalQuestions += 1;
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      percentage:
        item.maxScore > 0
          ? Math.round((item.earnedScore / item.maxScore) * 100)
          : 0,
    }))
    .sort((a, b) => a.percentage - b.percentage);
}