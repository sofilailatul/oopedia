import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import Button from "@/Components/Button";
import Icons from "@/icons";

function recommendationUi(percentage) {
  if (percentage < 60) return { bar: "bg-rose-500", btn: "red", iconClass: "bg-rose-100 text-rose-600 border-rose-200" };
  if (percentage < 75) return { bar: "bg-amber-500", btn: "yellow", iconClass: "bg-amber-100 text-amber-600 border-amber-200" };
  return { bar: "bg-emerald-500", btn: "green", iconClass: "bg-emerald-100 text-emerald-600 border-emerald-200" };
}

export default function Review({
  quiz,
  attempt,
  questions = [],
  recommendations = [],
}) {
  const score = Number(attempt?.total_score ?? 0);
  const answeredCount = questions.filter((q) => q.answered).length;
  const correctCount = questions.filter((q) => q.is_correct).length;
  const finishedAt = attempt?.finished_at
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(attempt.finished_at)).replace(".", ":")
    : "-";

  return (
    <AppLayout title="Review Kuis" label="Review Kuis" backHref="/kuis" backLabel="Kembali ke Daftar Kuis">
      <div className="relative w-full overflow-hidden pb-4">
        <div className="absolute -right-40 top-0 h-[400px] w-[400px] rounded-full pointer-events-none" />
        <div className="absolute -left-40 top-40 h-[300px] w-[300px] rounded-full pointer-events-none" />

        <div className="relative z-10 mx-auto w-full space-y-4">
          
          <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-2xl shadow-slate-200/50 backdrop-blur-xl p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-indigo-600 shadow-sm">
                  <Icons.Materials className="h-3 w-3" />
                  Review Kuis
                </div>
                <h1 className="mt-2 text-lg md:text-xl font-black tracking-tight text-slate-900">
                  {quiz?.title ?? "Kuis"}
                </h1>
                <p className="mt-1 max-w-xl text-[12px] font-medium text-slate-500">
                  Materi: {(quiz?.materials ?? []).join(", ") || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm text-center min-w-[150px]">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Skor Akhir</p>
                <p className={`mt-1 text-3xl font-black tracking-tight ${score >= 70 ? 'text-emerald-500' : 'text-rose-500'}`}>{score}</p>
                <p className="mt-2 text-[10px] font-bold text-slate-400">Selesai: <span className="text-slate-600">{finishedAt}</span></p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-xl shadow-slate-200/40 backdrop-blur-xl p-4 flex items-center gap-3">
               <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-500">
                  <Icons.Materials className="h-4 w-4" />
               </div>
               <div>
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Soal</p>
                 <p className="mt-0.5 text-lg font-black text-slate-800">{questions.length}</p>
               </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-xl shadow-slate-200/40 backdrop-blur-xl p-4 flex items-center gap-3">
               <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-500">
                  <Icons.Progress className="h-4 w-4" />
               </div>
               <div>
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Terjawab</p>
                 <p className="mt-0.5 text-lg font-black text-slate-800">{answeredCount}</p>
               </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-xl shadow-slate-200/40 backdrop-blur-xl p-4 flex items-center gap-3">
               <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-500">
                  <Icons.Success className="h-4 w-4" />
               </div>
               <div>
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Jawaban Benar</p>
                 <p className="mt-0.5 text-lg font-black text-emerald-600">{correctCount}</p>
               </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
             <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-2xl shadow-slate-200/50 backdrop-blur-xl p-5 md:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600">
                    <Icons.Materials className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Jawaban Kuis</p>
                    <h3 className="text-sm font-black tracking-tight text-slate-900">Detail review setiap soal</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Soal {idx + 1}</p>
                          <p className="mt-1 text-[13px] font-bold leading-relaxed text-slate-800">{q.quiz_text}</p>
                        </div>
                        <span className={`shrink-0 inline-flex rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${
                            q.answered
                              ? q.is_correct
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-rose-50 text-rose-600 border-rose-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                          }`}
                        >
                          {!q.answered ? "Tak Dijawab" : q.is_correct ? "Benar" : "Salah"}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {(q.options ?? []).map((opt) => {
                          const isSelected = opt.id === q.selected_option_id;
                          const isActualCorrect = opt.is_correct === 1 || opt.is_correct === true;

                          return (
                            <div
                              key={opt.id}
                              className={`rounded-lg border px-3 py-2.5 text-[11px] font-bold flex items-center justify-between gap-3 ${
                                isSelected
                                  ? q.is_correct
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm"
                                    : "border-rose-300 bg-rose-50 text-rose-700 shadow-sm"
                                  : isActualCorrect
                                    ? "border-emerald-300 bg-emerald-50/50 text-emerald-700 border-dashed"
                                    : "border-slate-100 bg-slate-50/50 text-slate-600"
                              }`}
                            >
                              <span>{opt.text}</span>
                              <div className="flex gap-2">
                                {isActualCorrect && !isSelected && (
                                  <span className="shrink-0 rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">
                                    Jawaban Benar
                                  </span>
                                )}
                                {isSelected && (
                                  <span className={`shrink-0 rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-widest ${
                                      q.is_correct ? "bg-emerald-200/50 text-emerald-700" : "bg-rose-200/50 text-rose-700"
                                    }`}
                                  >
                                    Pilihan kamu
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className={`mt-4 flex items-start gap-3 rounded-xl p-3.5 border shadow-sm ${
                        q.is_correct ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
                      }`}>
                        <div className="shrink-0 mt-0.5">
                          {q.is_correct ? <Icons.Success className="h-4 w-4 text-emerald-500" /> : <Icons.Lightbulb className="h-4 w-4 text-rose-500" />}
                        </div>
                        <div>
                          <p className={`uppercase tracking-[0.2em] text-[8px] font-black mb-1 ${
                            q.is_correct ? "text-emerald-600/70" : "text-rose-600/70"
                          }`}>
                            Feedback
                          </p>
                          <p className={`text-[12px] font-bold leading-relaxed ${
                            q.is_correct ? "text-emerald-700" : "text-rose-700"
                          }`}>
                            {!q.answered
                              ? "Soal ini tidak dijawab."
                              : q.is_correct
                                ? (q.feedback_correct ?? "Jawaban kamu tepat.")
                                : (q.feedback_incorrect ?? "Jawaban kamu masih belum tepat.")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-2xl shadow-slate-200/50 backdrop-blur-xl p-5 md:p-6 self-start">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-500">
                    <Icons.Lightbulb className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Rekomendasi</p>
                    <h3 className="text-sm font-black tracking-tight text-slate-900">Materi untuk direview</h3>
                  </div>
                </div>

                {recommendations.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs font-medium text-slate-500">
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 mb-2">
                      <Icons.Success className="h-4 w-4" />
                    </div>
                    Mantap, tidak ada materi rekomendasi tambahan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recommendations.map((m) => {
                      const ui = recommendationUi(Number(m.percentage ?? 0));
                      return (
                        <div key={m.material_id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-800 truncate">{m.name}</p>
                              <p className="mt-0.5 text-[9px] font-bold text-slate-500">{m.earned_score} / {m.max_score} poin</p>
                            </div>
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${ui.iconClass}`}>
                              <Icons.Materials className="h-3.5 w-3.5" />
                            </div>
                          </div>

                          <div className="mt-2.5 mb-2.5 flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                            <div className={`h-full rounded-full ${ui.bar} transition-all duration-1000`} style={{ width: `${m.percentage}%` }} />
                          </div>

                          <Button
                            variant="solid"
                            color={ui.btn}
                            size="sm"
                            className="w-full !rounded-lg !py-1.5 font-black uppercase tracking-widest text-[9px] shadow-sm"
                            onClick={() => router.visit(route("materials.show", m.material_id))}
                          >
                            Buka Materi
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
             </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="solid"
              color="gray"
              size="sm"
              className="shadow-md shadow-slate-200/50 font-black uppercase tracking-widest"
              onClick={() => router.visit(route("quizzes.index"))}
            >
              Kembali ke Daftar Kuis
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
