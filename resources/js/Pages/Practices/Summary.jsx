import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link } from "@inertiajs/react";
import Button from "@/Components/Button";
import Icons from "@/icons";
import { difficultyLabel, questionTypeLabel } from "@/Features/practice/labels";

export default function Summary({ practice, attempt, answers, cfg, nextLevel }) {
  const materialName = practice?.material?.material_name ?? "-";
  const levelLabel = difficultyLabel(cfg?.level ?? practice?.difficulty_level);
  const questionType = questionTypeLabel(cfg?.question_type);
  const materialScore = attempt?.total_earned ?? attempt?.final_score ?? 0;
  const finalScore = Number(attempt?.final_score ?? 0);
  const totalAnswers = answers?.length ?? 0;
  const isPassed = Boolean(attempt?.is_passed);
  const showCorrectAnswers = finalScore > 70;
  
  // Use nextLevel data from backend if available, otherwise fallback to old logic
  const nextLevelInfo = nextLevel ?? {
    next_level: showCorrectAnswers ? "hard" : "easy",
    message: showCorrectAnswers 
      ? "Nilai kamu sudah di atas 70, saatnya naik level dan coba tantangan yang lebih berat."
      : "Nilai kamu masih di bawah 70, fokus dulu ke soal easy supaya konsep dasarnya lebih kuat.",
    action: "next_level",
  };
  
  const targetLevelLabel = nextLevelInfo.next_level 
    ? difficultyLabel(nextLevelInfo.next_level) 
    : "Selesai";
  
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const latestAnswers = Object.values(
    (answers ?? []).reduce((acc, row) => {
      const qid = Number(row?.practice_questions_id ?? row?.question?.id ?? 0);
      if (!qid) {
        return acc;
      }

      const prev = acc[qid];
      const prevAttempt = Number(prev?.attempt ?? 0);
      const currAttempt = Number(row?.attempt ?? 0);

      if (!prev || currAttempt >= prevAttempt) {
        acc[qid] = row;
      }

      return acc;
    }, {}),
  );

  const reviewedAnswers = latestAnswers.map((answer) => {
    const question = answer?.question ?? {};
    const questionTypeValue = question?.type ?? "multiple_choice";
    const options = Array.isArray(question?.options) ? question.options : [];
    const selectedOptionId = Number(
      answer?.practice_options_id ?? answer?.practiceOptionId ?? answer?.option?.id ?? 0,
    );
    const selectedOption =
      answer?.option ??
      options.find((option) => Number(option?.id) === Number(answer?.practice_options_id)) ??
      options.find((option) => Number(option?.id) === selectedOptionId) ??
      null;
    const items = Array.isArray(question?.items) ? question.items : [];

    const correctOption = options.find((option) => option?.is_correct);
    const correctItems = items.map((item) => item?.item_text).filter(Boolean);
    const selectedItems = Array.isArray(answer?.selection_items) ? answer.selection_items.filter(Boolean) : [];
    const isCorrect =
      questionTypeValue === "multiple_choice"
        ? Boolean(selectedOption?.is_correct)
        : (selectedItems.length > 0 && selectedItems.join("|") === correctItems.join("|"));

    const correctAnswerText =
      questionTypeValue === "multiple_choice"
        ? (correctOption?.option_text ?? "-")
        : (correctItems.join(" → ") || "-");

    const userAnswerText =
      questionTypeValue === "multiple_choice"
        ? (selectedOption?.option_text ?? "Belum dijawab")
        : (selectedItems.join(" → ") || "Belum dijawab");

    return {
      id: answer?.id ?? question?.id,
      questionText: question?.question_text ?? "-",
      isCorrect,
      selectedOptionId,
      options,
      userAnswerText,
      correctAnswerText,
      feedbackCorrect: question?.feedback_correct ?? "Jawaban kamu sudah benar.",
      feedbackIncorrect: question?.feedback_incorrect ?? "Jawaban kamu belum tepat.",
      questionType: questionTypeValue,
    };
  });

  return (
    <AppLayout
      title="Hasil Latihan Soal"
      label="Hasil Latihan Soal"
      backHref={route("practices.index")}
      backLabel="Kembali ke Daftar"
    >
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
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
                <p className="text-sm font-medium text-sky-100/90">Hasil latihan kamu sudah siap</p>
                <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight leading-tight">
                  {isPassed ? "Mantap, kamu lulus!" : "Tetap gas, belum lulus bukan akhir"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-sky-100/90">
                  Cek ringkasan performa di bawah ini untuk lihat materi, level, dan skor yang berhasil kamu capai.
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm shadow-[0_8px_30px_rgba(15,23,42,0.15)]">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-100/80">Status akhir</p>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                    isPassed ? "bg-emerald-400/20 text-emerald-50" : "bg-rose-400/20 text-rose-50"
                  }`}
                >
                  {isPassed ? "Lulus" : "Belum Lulus"}
                </span>
                <span className="text-sm text-sky-100/85">Nilai {finalScore}</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-sky-100/85">
                Skor yang tercatat: {materialScore}. Kalau ingin hasil yang lebih baik, ulangi latihan dan perhatikan pembahasan.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Detail Nilai</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Skor latihan kamu</h3>
              </div>
              <div className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${isPassed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                {isPassed ? "Lulus" : "Belum Lulus"}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Nilai Akhir</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{finalScore}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Skor Tercatat</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{materialScore}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Arahan Berikutnya</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {nextLevelInfo.action === 'next_material'
                ? 'Selesai! Lanjut ke materi berikutnya'
                : nextLevelInfo.action === 'retry' || nextLevelInfo.action === 'fallback_easy'
                ? `Coba Lagi di Level ${targetLevelLabel}`
                : nextLevelInfo.action === 'next_level'
                ? `Lanjut ke Level ${targetLevelLabel}`
                : 'Mulai dari Level Normal'}
            </h3>
            <p className="mt-3 text-sm text-slate-500">
              {nextLevelInfo.message}
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  nextLevelInfo.action === 'next_material' 
                    ? "bg-purple-100 text-purple-600"
                    : (nextLevelInfo.action === 'retry' || nextLevelInfo.action === 'fallback_easy')
                    ? "bg-amber-100 text-amber-600"
                    : "bg-emerald-100 text-emerald-600"
                }`}>
                  {nextLevelInfo.action === 'next_material' 
                    ? <Icons.ChevronRight className="h-5 w-5" />
                    : (nextLevelInfo.action === 'retry' || nextLevelInfo.action === 'fallback_easy')
                    ? <Icons.Refresh className="h-5 w-5" />
                    : <Icons.Play className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Aksi berikutnya</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {nextLevelInfo.action === 'next_material' 
                      ? 'Kembali ke daftar materi'
                      : (nextLevelInfo.action === 'retry' || nextLevelInfo.action === 'fallback_easy')
                      ? `Ulangi di Level ${targetLevelLabel}`
                      : `Mulai Level ${targetLevelLabel}`}
                  </p>
                </div>
              </div>

              {nextLevelInfo.action === 'next_material' ? (
                <Button
                  as={Link}
                  href={route("practices.index")}
                  variant="solid"
                  color="purple"
                  size="md"
                  className="mt-4 w-full rounded-full"
                >
                  Lihat Materi Berikutnya
                </Button>
              ) : (
                <Button
                  as={Link}
                  href={route("practices.index")}
                  variant="solid"
                  color={nextLevelInfo.action === 'retry' || nextLevelInfo.action === 'fallback_easy' ? "amber" : "emerald"}
                  size="md"
                  className="mt-4 w-full rounded-full"
                >
                  {nextLevelInfo.action === 'retry' || nextLevelInfo.action === 'fallback_easy' 
                    ? `Ulangi Level ${targetLevelLabel}`
                    : `Mulai Level ${targetLevelLabel}`}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Review Jawaban</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Soal dan jawaban yang kamu isi</h3>
            </div>
            <div className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${showCorrectAnswers ? "bg-violet-50 text-violet-600" : "bg-emerald-50 text-emerald-600"}`}>
              {showCorrectAnswers ? "Tampilkan jawaban benar" : "Jawaban benar disembunyikan"}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {reviewedAnswers.length > 0 ? reviewedAnswers.map((item, index) => (
              <div key={item.id ?? index} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">Soal {index + 1}</p>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-slate-900">
                      {item.questionText}
                    </p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-[10px] font-semibold ${item.isCorrect ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                    {item.isCorrect ? "Benar" : "Salah"}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {item.questionType === "multiple_choice" ? (
                    item.options.length > 0 ? item.options.map((option) => {
                      const optionId = Number(option?.id ?? 0);
                      const isSelected = optionId === item.selectedOptionId;
                      const isCorrectOption = Boolean(option?.is_correct);

                      const optionClass = isSelected
                        ? (item.isCorrect
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-rose-300 bg-rose-50 text-rose-700")
                        : (showCorrectAnswers && isCorrectOption
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-700");

                      return (
                        <div
                          key={optionId}
                          className={`rounded-2xl border p-4 transition-colors ${optionClass}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-normal leading-relaxed">{option?.option_text ?? "-"}</p>
                            <div className="flex items-center gap-2">
                              {isSelected && (
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${item.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                  Pilihan kamu
                                </span>
                              )}
                              {showCorrectAnswers && isCorrectOption && (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                  Jawaban benar
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                        Opsi jawaban tidak ditemukan untuk soal ini.
                      </div>
                    )
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Jawaban kamu</p>
                        <p className={`mt-2 text-sm font-medium ${item.isCorrect ? "text-emerald-700" : "text-rose-600"}`}>
                          {item.userAnswerText}
                        </p>
                      </div>

                      {showCorrectAnswers ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Jawaban benar</p>
                          <p className="mt-2 text-sm font-medium text-slate-900">
                            {item.correctAnswerText}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4">
                          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Jawaban benar</p>
                          <p className="mt-2 text-sm font-medium text-slate-400">
                            Disembunyikan sampai nilai kamu di atas 70.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {showCorrectAnswers && !item.isCorrect && (
                  <p className="mt-3 text-sm text-rose-600">
                    {item.feedbackIncorrect}
                  </p>
                )}

                {showCorrectAnswers && item.isCorrect && (
                  <p className="mt-3 text-sm text-emerald-600">
                    {item.feedbackCorrect}
                  </p>
                )}
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Belum ada jawaban yang bisa ditampilkan.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
