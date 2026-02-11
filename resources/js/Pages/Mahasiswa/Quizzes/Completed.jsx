import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/Button";
import Icons from "@/icons";
import Text from "@/Components/text";
import { Link } from "@inertiajs/react";
import { router } from "@inertiajs/react";

function colorByScore(score) {
  if (score < 60) return { bar: "bg-red-500", btn: "red", icon: "!", iconBg: "bg-red-100", iconText: "text-red-500" };
  if (score < 75) return { bar: "bg-orange-500", btn: "yellow", icon: "★", iconBg: "bg-orange-100", iconText: "text-orange-500" };
  return { bar: "bg-blue-500", btn: "blue", icon: "i", iconBg: "bg-blue-100", iconText: "text-blue-500" };
}

export default function Completed({ attempt, materialScores = [], recommendations = [] }) {
  return (
    <AppLayout title="Kuis" label="Kuis">
      <div className="mx-auto">
        <Text variant="titleSection">
          <Link href="/kuis" className="flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-slate-700">
            <span>←</span> KUIS {attempt?.title ?? ""}
          </Link>
        </Text>

        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-green-500/15 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-xl font-bold text-slate-900">Quiz Completed!</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/15 flex items-center justify-center shrink-0">
                <Icons.Lightbulb className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900 leading-tight">
                  Nilai<br />Kamu
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <div className="text-6xl font-extrabold text-green-600">
                {attempt?.total_score ?? 0}
              </div>
            </div>

            {/* Nilai per materi */}
            {materialScores.length > 0 && (
              <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nilai per Materi</div>
                {materialScores.map((m) => {
                  const ui = colorByScore(m.earned_score);
                  return (
                    <div key={m.material_id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 font-medium">{m.name}</span>
                        <span className="font-semibold text-slate-900">{m.earned_score} dari {m.max_score}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-2 rounded-full ${ui.bar}`} style={{ width: `${m.percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card Rekomendasi Materi */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                  <Icons.Lightbulb className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900">Rekomendasi Materi</div>
                  <div className="text-sm text-slate-500">Fokus pada topik yang nilainya kurang</div>
                </div>
              </div>
            </div>

            {recommendations.length === 0 ? (
              <div className="mt-6 text-sm text-slate-500">
                Mantap! Tidak ada materi rekomendasi 🎉
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                {recommendations.map((m) => {
                  const ui = colorByScore(m.earned_score);
                  return (
                    <div key={m.material_id} className="rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
                      <div className={`w-10 h-10 rounded-xl ${ui.iconBg} flex items-center justify-center ${ui.iconText} font-bold text-lg`}>
                        {ui.icon}
                      </div>

                      <div className="mt-4 font-bold text-slate-900">{m.name}</div>
                      <div className="mt-2 text-xs text-slate-500">
                        Materi yang perlu kamu tingkatkan.
                      </div>

                      <div className="mt-auto pt-4">
                        <div className="text-xs text-slate-600 flex items-center justify-between">
                          <span>Nilai Kamu</span>
                          <span className="font-semibold">{m.earned_score} dari {m.max_score}</span>
                        </div>

                        <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-2 rounded-full ${ui.bar}`} style={{ width: `${m.percentage}%` }} />
                        </div>

                        <Button
                          variant="solid"
                          color={ui.btn}
                          size="sm"
                          className="mt-4 w-full"
                          onClick={() => router.visit(route("materials.show", m.material_id))}
                        >
                          Mulai
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end">
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
