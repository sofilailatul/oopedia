import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/Button";
import { router } from "@inertiajs/react";
import { difficultyLabel, questionTypeLabel } from "@/Features/practice/labels";

export default function Summary({ practice, attempt, answers, cfg }) {
  const materialName = practice?.material?.material_name ?? "-";
  const levelLabel = difficultyLabel(cfg?.level ?? practice?.difficulty_level);
  const questionType = questionTypeLabel(cfg?.question_type);
  const materialScore = attempt?.total_earned ?? attempt?.final_score ?? 0;
  const finalScore = attempt?.final_score ?? 0;

  return (
    <AppLayout title="Hasil Latihan Soal" label="Hasil Latihan Soal">
      <div className="mx-auto">
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h1 className="text-xl font-bold">Hasil Latihan Soal</h1>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between border rounded-xl px-4 py-3">
              <div className="text-sm text-slate-500">Nama Materi</div>
              <div className="text-sm font-semibold text-slate-900">{materialName}</div>
            </div>
            <div className="flex items-center justify-between border rounded-xl px-4 py-3">
              <div className="text-sm text-slate-500">Level</div>
              <div className="text-sm font-semibold text-slate-900">{levelLabel}</div>
            </div>
            <div className="flex items-center justify-between border rounded-xl px-4 py-3">
              <div className="text-sm text-slate-500">Tipe</div>
              <div className="text-sm font-semibold text-slate-900">{questionType}</div>
            </div>
            <div className="flex items-center justify-between border rounded-xl px-4 py-3">
              <div className="text-sm text-slate-500">Nilai</div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-slate-900">{finalScore}</div>
                <div
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    attempt.is_passed ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  }`}
                >
                  {attempt.is_passed ? "Lulus" : "Belum Lulus"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              color="blue"
              onClick={() => router.visit(route("practices.index"))}
            >
              Kembali ke daftar latihan soal
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
