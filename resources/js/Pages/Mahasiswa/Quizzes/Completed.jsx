import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/Button";
import Icons from "@/icons";
import { router } from "@inertiajs/react";

function recommendationUi(percentage) {
  if (percentage < 60) return { bar: "bg-rose-500", btn: "red", iconClass: "bg-rose-100 text-rose-600 border-rose-200" };
  if (percentage < 75) return { bar: "bg-amber-500", btn: "yellow", iconClass: "bg-amber-100 text-amber-600 border-amber-200" };
  return { bar: "bg-emerald-500", btn: "green", iconClass: "bg-emerald-100 text-emerald-600 border-emerald-200" };
}

export default function Completed({ attempt, materialScores = [], recommendations = [] }) {
  const totalScore = Number(attempt?.total_score ?? 0);
  const finishedAt = attempt?.finished_at
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(attempt.finished_at)).replace(".", ":")
    : "-";
  const weakCount = recommendations.length;

  return (
    <AppLayout title="Kuis Selesai" label="Kuis Selesai" backHref="/kuis" backLabel="Kembali ke Daftar Kuis">
      <div className="relative w-full overflow-hidden pb-4">
        <div className="absolute -right-40 top-0 h-[400px] w-[400px] rounded-full pointer-events-none" />
        <div className="absolute -left-40 top-40 h-[300px] w-[300px] rounded-full pointer-events-none" />

        <div className="relative z-10 mx-auto w-full space-y-4">
          <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-2xl shadow-slate-200/50 backdrop-blur-xl p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600 shadow-sm">
                  <Icons.Success className="h-3 w-3" />
                  Kuis Selesai
                </div>
                <h1 className="mt-2 text-lg md:text-xl font-black tracking-tight text-slate-900">
                  Mantap, kamu sudah menyelesaikan kuis
                </h1>
                <p className="mt-1 max-w-xl text-[12px] font-medium text-slate-500">
                  Lihat performa kamu dan lanjutkan perbaikan pada materi rekomendasi jika diperlukan.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm text-center min-w-[150px]">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Skor Akhir</p>
                <p className={`mt-1 text-3xl font-black tracking-tight ${totalScore >= 70 ? 'text-emerald-500' : 'text-rose-500'}`}>{totalScore}</p>
                <p className="mt-2 text-[10px] font-bold text-slate-400">Selesai: <span className="text-slate-600">{finishedAt}</span></p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-2xl shadow-slate-200/50 backdrop-blur-xl p-5 md:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600">
                  <Icons.Progress className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Ringkasan Nilai</p>
                  <h3 className="text-sm font-black tracking-tight text-slate-900">Performa per materi</h3>
                </div>
              </div>

              <div className="space-y-3">
                {materialScores.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs font-medium text-slate-500">
                    Data nilai per materi belum tersedia.
                  </div>
                ) : (
                  materialScores.map((m) => {
                    const ui = recommendationUi(Number(m.percentage ?? 0));
                    return (
                      <div key={m.material_id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-[11px] font-bold text-slate-800 truncate">{m.name}</p>
                          <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[9px] font-black text-slate-600 border border-slate-100 whitespace-nowrap">
                            {m.earned_score} / {m.max_score} pts
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                             <div className={`h-full rounded-full ${ui.bar} transition-all duration-1000`} style={{ width: `${m.percentage}%` }} />
                           </div>
                           <span className="text-[10px] font-black text-slate-700 w-6 text-right">{m.percentage}%</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-2xl shadow-slate-200/50 backdrop-blur-xl p-5 md:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-500">
                  <Icons.Lightbulb className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Rekomendasi</p>
                  <h3 className="text-sm font-black tracking-tight text-slate-900">Fokus belajar berikutnya</h3>
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
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 truncate">{m.name}</p>
                          </div>
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
              className="!rounded-lg !px-6 !py-2.5 font-black uppercase tracking-widest text-[10px]"
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
