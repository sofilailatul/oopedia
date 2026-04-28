import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import Card from "@/Components/Card";

const PRACTICE_LEVEL_GROUPS = [
  {
    level: "easy",
    label: "Easy",
    scoreKey: "easy",
    scoreFallbackKeys: ["easy_score", "practice_easy"],
    remedKey: "remed_easy",
    remedFallbackKeys: ["r_easy", "remedial_easy", "remed_easy_score"],
    weakKey: "weak_easy_subtopics",
    weakFallbackKeys: ["easy_weak_subtopics", "weak_subtopics_easy"],
    dot: "bg-emerald-400",
    scoreBg: "bg-emerald-50 text-emerald-700",
  },
  {
    level: "medium",
    label: "Medium",
    scoreKey: "medium",
    scoreFallbackKeys: ["normal", "medium_score", "practice_medium"],
    remedKey: "remed_medium",
    remedFallbackKeys: [
      "r_medium",
      "remed_normal",
      "remedial_medium",
      "remed_medium_score",
    ],
    weakKey: "weak_medium_subtopics",
    weakFallbackKeys: [
      "weak_normal_subtopics",
      "medium_weak_subtopics",
      "weak_subtopics_medium",
      "weak_subtopics_normal",
    ],
    dot: "bg-amber-400",
    scoreBg: "bg-amber-50 text-amber-700",
  },
  {
    level: "hard",
    label: "Hard",
    scoreKey: "hard",
    scoreFallbackKeys: ["hard_score", "practice_hard"],
    remedKey: "remed_hard",
    remedFallbackKeys: ["r_hard", "remedial_hard", "remed_hard_score"],
    weakKey: "weak_hard_subtopics",
    weakFallbackKeys: ["hard_weak_subtopics", "weak_subtopics_hard"],
    dot: "bg-red-400",
    scoreBg: "bg-red-50 text-red-700",
  },
];

const PRETEST_COLUMN = {
  key: "pretest",
  fallbackKeys: ["pre_test", "pretest_score", "pre_test_score"],
  label: "Pre-test",
  activeBg: "bg-slate-100 text-slate-700",
};

export default function ManageLeaderboardShow({
  class: classInfo,
  student,
  materialStats = [],
  quizStats = [],
  backRouteName = "dosen.grades.index",
}) {
  const backHref = route(backRouteName);

  return (
    <AppLayout
      title="Detail Nilai Mahasiswa"
      label="Detail Nilai Mahasiswa"
      backHref={backHref}
      backLabel="Kembali ke daftar nilai"
    >
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <HeaderSection classInfo={classInfo} student={student} />

        <MaterialSummarySection
          materialStats={materialStats}
          quizStats={quizStats}
        />
      </div>
    </AppLayout>
  );
}

function HeaderSection({ classInfo, student }) {
  return (
    <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-white p-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-[16px] font-bold tracking-tight text-slate-900">
              {student?.nama || "-"}
            </h1>

            <p className="text-xs text-slate-500">
              {student?.email || "-"}
              <span className="mx-1.5">•</span>
              Kelas {classInfo?.class_name || "-"} (
              {classInfo?.class_code || "-"})
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function MaterialSummarySection({ materialStats = [], quizStats = [] }) {
  const hasPractice = Array.isArray(materialStats) && materialStats.length > 0;
  const hasQuiz = Array.isArray(quizStats) && quizStats.length > 0;

  if (!hasPractice && !hasQuiz) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white/95 p-6 text-center text-sm text-slate-500">
        Belum ada nilai latihan atau kuis untuk mahasiswa ini.
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {hasPractice && <AdaptivePracticeTable materialStats={materialStats} />}

      <QuizSummaryTable quizStats={quizStats} />
    </div>
  );
}

function getWeakSubtopicsByLevel(row, group) {
  const keys = [group.weakKey, ...(group.weakFallbackKeys || [])];

  for (const key of keys) {
    const value = row?.[key];
    const parsed = parseWeakSubtopicValue(value);

    if (parsed.length > 0) {
      return parsed;
    }
  }

  const groupedValue =
    row?.weak_subtopics_by_level ??
    row?.weakSubtopicsByLevel ??
    row?.weakness_by_level ??
    null;

  if (groupedValue && typeof groupedValue === "object") {
    const levelValue =
      groupedValue[group.level] ??
      groupedValue[group.label?.toLowerCase()] ??
      groupedValue[group.level === "medium" ? "normal" : group.level];

    return parseWeakSubtopicValue(levelValue);
  }

  return [];
}

function parseWeakSubtopicValue(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;

        return (
          item?.name ??
          item?.subtopic_name ??
          item?.sub_topic_name ??
          item?.title ??
          ""
        );
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "object") {
    const name =
      value.name ??
      value.subtopic_name ??
      value.sub_topic_name ??
      value.title ??
      "";

    return name ? [name] : [];
  }

  return [];
}

function AdaptivePracticeTable({ materialStats }) {
  return (
    <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="rounded-2xl flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-slate-900">
            Rekap Latihan Adaptif per Materi
          </h2>
          <p className="text-[11px] text-slate-500">
            R-Easy, R-Medium, dan R-Hard adalah nilai remedial. Subtopik lemah
            ditampilkan per level.
          </p>
        </div>
      </div>

      <div className="p-2">
        <div className="overflow-x-auto">
          <table className="min-w-[1380px] text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="sticky left-0 z-10 bg-white px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Materi
                </th>

                <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Pre-test
                </th>

                {PRACTICE_LEVEL_GROUPS.map((group) => (
                  <React.Fragment key={group.level}>
                    <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${group.dot}`} />
                        {group.label}
                      </span>
                    </th>

                    <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      R-{group.label}
                    </th>

                    <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Subtopik Lemah {group.label}
                    </th>
                  </React.Fragment>
                ))}

                <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {materialStats.map((row) => {
                const status = getStatus(row);

                return (
                  <tr
                    key={row.material_id}
                    className="group hover:bg-slate-50/80"
                  >
                    <td className="sticky left-0 z-10 max-w-[260px] bg-white px-3 py-3 text-[11px] font-medium text-slate-800 group-hover:bg-slate-50">
                      <span className="block truncate" title={row.material_name}>
                        {row.material_name || "-"}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <ScoreBadge
                        value={getScore(
                          row,
                          PRETEST_COLUMN.key,
                          PRETEST_COLUMN.fallbackKeys,
                        )}
                        activeClassName={PRETEST_COLUMN.activeBg}
                      />
                    </td>

                    {PRACTICE_LEVEL_GROUPS.map((group) => (
                      <React.Fragment key={group.level}>
                        <td className="px-3 py-3 text-center">
                          <ScoreBadge
                            value={getScore(
                              row,
                              group.scoreKey,
                              group.scoreFallbackKeys,
                            )}
                            activeClassName={group.scoreBg}
                          />
                        </td>

                        <td className="px-3 py-3 text-center">
                          <ScoreBadge
                            value={getScore(
                              row,
                              group.remedKey,
                              group.remedFallbackKeys,
                            )}
                            activeClassName={group.scoreBg}
                          />
                        </td>

                        <td className="min-w-[160px] px-3 py-3">
                          <WeakSubtopicBadges
                            items={getWeakSubtopicsByLevel(row, group)}
                          />
                        </td>
                      </React.Fragment>
                    ))}

                    <td className="px-3 py-3 text-center">
                      <StatusBadge status={status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

function QuizSummaryTable({ quizStats = [] }) {
  const quizGrandTotal = quizStats.reduce((sum, quiz) => {
    const materials = quiz.materials || [];

    const totalScore =
      quiz.total_score ??
      quiz.totalScore ??
      materials.reduce((materialSum, material) => {
        return materialSum + Number(material.score || material.quiz_score || 0);
      }, 0);

    return sum + Number(totalScore || 0);
  }, 0);

  if (!quizStats || quizStats.length === 0) {
    return (
      <Card className="rounded-3xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-500 shadow-sm">
        Belum ada nilai quiz untuk mahasiswa ini.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Rekap Nilai Quiz
          </h2>
          <p className="text-[11px] text-slate-500">
            Nilai quiz ditampilkan berdasarkan judul quiz, materi yang diujikan,
            dan skor per materi.
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
          Total Quiz: {quizGrandTotal}
        </span>
      </div>

      <div className="p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Judul Quiz
                </th>

                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Materi & Nilai
                </th>

                <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Total Nilai
                </th>

                <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {quizStats.map((quiz) => {
                const materials = quiz.materials || [];

                const totalScore =
                  quiz.total_score ??
                  quiz.totalScore ??
                  materials.reduce((sum, material) => {
                    return (
                      sum + Number(material.score || material.quiz_score || 0)
                    );
                  }, 0);

                const hasScore = Number(totalScore || 0) > 0;

                return (
                  <tr
                    key={quiz.quiz_id ?? quiz.id}
                    className="hover:bg-blue-50/30"
                  >
                    <td className="max-w-[240px] px-3 py-4 align-top">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {quiz.quiz_title ?? quiz.title ?? "-"}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {materials.length} materi
                        </p>
                      </div>
                    </td>

                    <td className="px-3 py-4 align-top">
                      {materials.length === 0 ? (
                        <span className="text-[11px] text-slate-400">
                          Belum ada materi
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {materials.map((material) => {
                            const score = Number(
                              material.score ?? material.quiz_score ?? 0,
                            );

                            return (
                              <div
                                key={material.material_id ?? material.id}
                                className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2"
                              >
                                <span
                                  className="max-w-[180px] truncate text-[11px] font-medium text-blue-800"
                                  title={material.material_name ?? material.name}
                                >
                                  {material.material_name ?? material.name ?? "-"}
                                </span>

                                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-blue-700 shadow-sm">
                                  {score}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-4 text-center align-top">
                      <span
                        className={[
                          "inline-flex min-w-[58px] justify-center rounded-xl px-3 py-1 text-xs font-bold",
                          hasScore
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-400",
                        ].join(" ")}
                      >
                        {Number(totalScore || 0)}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-center align-top">
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
                          hasScore
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500",
                        ].join(" ")}
                      >
                        {hasScore ? "Sudah dinilai" : "Belum ada nilai"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end border-t border-dashed border-slate-200 pt-3 text-xs text-slate-500">
          <span>
            <span className="font-semibold text-slate-700">
              Total nilai semua quiz:
            </span>{" "}
            {quizGrandTotal}
          </span>
        </div>
      </div>
    </Card>
  );
}

function ScoreBadge({ value, activeClassName }) {
  const score = Number(value || 0);
  const hasScore = score > 0;

  return (
    <span
      className={[
        "inline-flex min-w-[48px] justify-center rounded-xl px-2.5 py-1 text-xs font-semibold",
        hasScore ? activeClassName : "bg-slate-100 text-slate-400",
      ].join(" ")}
    >
      {hasScore ? score : "-"}
    </span>
  );
}

function WeakSubtopicBadges({ items }) {
  if (!items || items.length === 0) {
    return <span className="text-[11px] text-slate-400">-</span>;
  }

  const visibleItems = items.slice(0, 2);
  const remainingCount = items.length - visibleItems.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleItems.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="inline-flex rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[10px] font-medium text-rose-700"
        >
          {item}
        </span>
      ))}

      {remainingCount > 0 && (
        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();

  let className = "bg-slate-100 text-slate-600";
  let label = status || "Belum mulai";

  if (
    normalized.includes("lulus") ||
    normalized.includes("selesai") ||
    normalized.includes("completed")
  ) {
    className = "bg-emerald-50 text-emerald-700";
  } else if (normalized.includes("remed")) {
    className = "bg-amber-50 text-amber-700";
  } else if (
    normalized.includes("baca") ||
    normalized.includes("review") ||
    normalized.includes("perlu")
  ) {
    className = "bg-rose-50 text-rose-700";
  } else if (normalized.includes("easy")) {
    className = "bg-emerald-50 text-emerald-700";
  } else if (
    normalized.includes("medium") ||
    normalized.includes("normal")
  ) {
    className = "bg-amber-50 text-amber-700";
  } else if (normalized.includes("hard")) {
    className = "bg-red-50 text-red-700";
  }

  return (
    <span
      className={[
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold",
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function getScore(row, key, fallbackKeys = []) {
  const keys = [key, ...fallbackKeys];

  for (const currentKey of keys) {
    const value = row?.[currentKey];

    if (value !== undefined && value !== null && value !== "") {
      return Number(value) || 0;
    }
  }

  return 0;
}

function getWeakSubtopics(row) {
  const value =
    row?.weak_subtopics ??
    row?.weakSubtopics ??
    row?.weak_subtopic_names ??
    row?.weak_subtopic ??
    row?.weakSubtopic ??
    row?.weakness_subtopics ??
    row?.subtopic_weakness ??
    null;

  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;

        return (
          item?.name ??
          item?.subtopic_name ??
          item?.sub_topic_name ??
          item?.title ??
          ""
        );
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "object") {
    const name =
      value.name ??
      value.subtopic_name ??
      value.sub_topic_name ??
      value.title ??
      "";

    return name ? [name] : [];
  }

  return [];
}

function getStatus(row) {
  return (
    row?.status_label ??
    row?.status ??
    row?.practice_status ??
    row?.adaptive_status ??
    "Belum mulai"
  );
}