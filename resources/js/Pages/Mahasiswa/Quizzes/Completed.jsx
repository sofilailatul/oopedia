import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/Button";
import Icons from "@/icons";
import { router } from "@inertiajs/react";

function recommendationUi(percentage) {
  if (percentage < 60) return { bar: "bg-rose-500", btn: "red", iconClass: "bg-rose-100 text-rose-600" };
  if (percentage < 75) return { bar: "bg-amber-500", btn: "yellow", iconClass: "bg-amber-100 text-amber-600" };
  return { bar: "bg-emerald-500", btn: "green", iconClass: "bg-emerald-100 text-emerald-600" };
}

export default function Completed({ attempt, materialScores = [], recommendations = [] }) {
  const totalScore = Number(attempt?.total_score ?? 0);
  const finishedAt = attempt?.finished_at ? new Date(attempt.finished_at).toLocaleString("id-ID") : "-";
  const weakCount = recommendations.length;

  return (
    <AppLayout title="Kuis Selesai" label="Kuis Selesai" backHref="/kuis" backLabel="Kembali ke Daftar Kuis">
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 md:p-8 text-white shadow-lg shadow-emerald-200">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-14 -left-6 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-50">
                <Icons.Success className="h-3.5 w-3.5" />
                Quiz Completed
              </div>
              <h1 className="mt-3 text-xl md:text-2xl font-semibold leading-tight">
                Mantap, kamu sudah menyelesaikan kuis
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50/90">
                Lihat performa kamu dan lanjutkan perbaikan pada materi rekomendasi.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/80">Skor Akhir</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{totalScore}</p>
              <p className="mt-2 text-xs text-emerald-100/90">Selesai: {finishedAt}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Materi Diujikan</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{materialScores.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Rekomendasi</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{weakCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Status</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">Selesai</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                <Icons.Progress className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Ringkasan Nilai</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Performa per materi</h3>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {materialScores.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Data nilai per materi belum tersedia.
                </div>
              ) : (
                materialScores.map((m) => {
                  const ui = recommendationUi(Number(m.percentage ?? 0));
                  return (
                    <div key={m.material_id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                        <span className="text-xs font-semibold text-slate-600">
                          {m.earned_score} / {m.max_score}
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-2 rounded-full ${ui.bar}`} style={{ width: `${m.percentage}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{m.percentage}%</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Icons.Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Rekomendasi</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Fokus belajar berikutnya</h3>
              </div>
            </div>

            {recommendations.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                Mantap, tidak ada materi rekomendasi tambahan.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {recommendations.map((m) => {
                  const ui = recommendationUi(Number(m.percentage ?? 0));
                  return (
                    <div key={m.material_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{m.earned_score} / {m.max_score} poin</p>
                        </div>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${ui.iconClass}`}>
                          <Icons.Materials className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-2 rounded-full ${ui.bar}`} style={{ width: `${m.percentage}%` }} />
                      </div>

                      <Button
                        variant="solid"
                        color={ui.btn}
                        size="sm"
                        className="mt-4 w-full"
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

        <div className="flex justify-end">
          <Button
            variant="solid"
            color="gray"
            onClick={() => router.visit(route("quizzes.index"))}
          >
            Kembali ke daftar kuis
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
