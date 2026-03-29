import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import Card from "@/Components/Card";
import Button from "@/Components/Button";

const LEVEL_LABELS = {
  easy: "Level Easy",
  normal: "Level Normal",
  hard: "Level Hard",
};

export default function DosenStudentGradeDetail({ class: classInfo, student, attemptsByLevel }) {
  return (
    <AppLayout 
    title="Detail Nilai Mahasiswa" 
    label="Detail Nilai Mahasiswa"
	backHref={route("dosen.grades.index")}
	backLabel="Kembali ke daftar kuis"
    >
      <div className="mx-auto max-w-5xl space-y-6 pb-10">
        <HeaderSection classInfo={classInfo} student={student} />
        <AttemptsSection attemptsByLevel={attemptsByLevel} />
      </div>
    </AppLayout>
  );
}

function HeaderSection({ classInfo, student }) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{student?.nama}</h1>
          <p className="text-xs text-slate-500">
            {student?.email}
            <span className="mx-1">•</span>
            Kelas {classInfo?.class_name} ({classInfo?.class_code})
          </p>
        </div>
      </div>
    </Card>
  );
}

function AttemptsSection({ attemptsByLevel }) {
  const levels = ["easy", "normal", "hard"];

  return (
    <div className="space-y-4">
      {levels.map((level) => {
        const attempts = attemptsByLevel?.[level] || [];
        return (
          <Card key={level} className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{LEVEL_LABELS[level] || level}</h2>
                <p className="text-[11px] text-slate-500">
                  Riwayat nilai untuk {LEVEL_LABELS[level] || level.toUpperCase()} pada semua attempt.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {attempts.length} attempt
              </span>
            </div>

            {attempts.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-slate-500">
                Belum ada attempt untuk level ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-1 text-xs">
                  <thead>
                    <tr>
                      <th className="bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Waktu</th>
                      <th className="bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nilai</th>
                      <th className="bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tren</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt, index) => {
                      const prev = index > 0 ? attempts[index - 1] : null;
                      let trendLabel = "-";
                      let trendClass = "text-slate-400";

                      if (prev) {
                        if (attempt.score > prev.score) {
                          trendLabel = "Naik";
                          trendClass = "text-emerald-600";
                        } else if (attempt.score < prev.score) {
                          trendLabel = "Turun";
                          trendClass = "text-red-500";
                        } else {
                          trendLabel = "Tetap";
                          trendClass = "text-slate-500";
                        }
                      }

                      return (
                        <tr key={attempt.id} className="rounded-xl border border-slate-100 bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                          <td className="max-w-[220px] px-3 py-2 text-[11px] text-slate-600">
                            <span className="block truncate" title={attempt.finished_at}>{attempt.finished_at}</span>
                          </td>
                          <td className="px-3 py-2 text-center text-[11px] font-semibold">
                            <span className={attempt.score >= 70 ? "text-emerald-600" : "text-slate-700"}>{attempt.score}</span>
                          </td>
                          <td className="px-3 py-2 text-center text-[11px] font-semibold">
                            <span className={trendClass}>{trendLabel}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
