import React, { useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import Text from "@/Components/text";
import Icons from "@/icons";

function medalColor(rank) {
  if (rank === 1) return "bg-yellow-400 text-yellow-800";
  if (rank === 2) return "bg-slate-300 text-slate-700";
  if (rank === 3) return "bg-orange-300 text-orange-800";
  return "bg-slate-100 text-slate-600";
}

const DETAIL_COLUMNS = [
  { key: "easy",   label: "Easy",   dot: "bg-emerald-400", text: "text-emerald-600", activeBg: "bg-emerald-50 text-emerald-700", footerText: "text-emerald-700" },
  { key: "normal", label: "Normal", dot: "bg-amber-400",   text: "text-amber-600",   activeBg: "bg-amber-50 text-amber-700",     footerText: "text-amber-700" },
  { key: "hard",   label: "Hard",   dot: "bg-red-400",     text: "text-red-500",     activeBg: "bg-red-50 text-red-700",         footerText: "text-red-600" },
  { key: "quiz",   label: "Kuis",   dot: "bg-blue-400",    text: "text-blue-600",    activeBg: "bg-blue-50 text-blue-700",       footerText: "text-blue-700" },
];

function DetailTable({ materialsData, materialsList }) {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white px-5 py-5  border-b border-slate-100">
      <div className="overflow-x-auto rounded-xl border border-slate-200 ml-10 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <th className="text-left py-3 px-4">
                <Text variant="caption" className="uppercase tracking-wider font-semibold text-slate-700">Materi</Text>
              </th>
              {DETAIL_COLUMNS.map((col) => (
                <th key={col.key} className="text-center py-3 px-3">
                  <Text variant="caption" className={`inline-flex items-center gap-1 uppercase tracking-wider font-semibold ${col.text}`}>
                    <span className={`w-2 h-2 rounded-full ${col.dot}`}></span>{col.label}
                  </Text>
                </th>
              ))}
              <th className="text-center py-3 px-4">
                <Text variant="caption" className="uppercase tracking-wider font-semibold text-slate-700">Total</Text>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materialsData.map((mat) => {
              const material = materialsList.find((m) => m.id === mat.material_id);
              return (
                <tr key={mat.material_id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3 px-4">
                    <Text variant="contentSection" className="font-medium text-slate-800">
                      {material?.name ?? `Materi ${mat.material_id}`}
                    </Text>
                  </td>
                  {DETAIL_COLUMNS.map((col) => (
                    <td key={col.key} className="py-3 px-3 text-center">
                      <Text variant="caption" className={`inline-block min-w-[32px] rounded-md px-2 py-0.5 font-semibold ${mat[col.key] > 0 ? col.activeBg : "text-slate-400"}`}>
                        {mat[col.key]}
                      </Text>
                    </td>
                  ))}
                  <td className="py-3 px-4 text-center">
                    <Text variant="caption" className="inline-block min-w-[40px] rounded-lg bg-slate-800 px-3 py-1 font-bold text-white">
                      {mat.total}
                    </Text>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-t-2 border-slate-200">
              <td className="py-3 px-4">
                <Text variant="titleSection" className="text-slate-900">Grand Total</Text>
              </td>
              {DETAIL_COLUMNS.map((col) => (
                <td key={col.key} className="py-3 px-3 text-center">
                  <Text variant="contentSection" className={`font-bold ${col.footerText}`}>
                    {materialsData.reduce((s, m) => s + m[col.key], 0)}
                  </Text>
                </td>
              ))}
              <td className="py-3 px-4 text-center">
                <Text variant="caption" className="inline-block min-w-[48px] rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-bold text-white shadow-sm">
                  {materialsData.reduce((s, m) => s + m.total, 0)}
                </Text>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function PodiumCard({ entry, rank, isCurrentUser }) {
  const isChampion = rank === 1;
  return (
    <div
      className={[
        "flex flex-col items-center rounded-2xl border p-5 transition",
        isChampion ? "border-yellow-400 bg-yellow-50 shadow-md scale-105" : "border-slate-200 bg-white shadow-sm",
        isCurrentUser ? "ring-2 ring-blue-400" : "",
      ].join(" ")}
      style={{ minWidth: 160 }}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${medalColor(rank)}`}>
        {rank === 1 ? "👑" : rank === 2 ? "🥈" : "🥉"}
      </div>
      <Text variant="titleSection" className="mt-3 text-center">{entry.nama}</Text>
      <Text variant="caption" className="mt-1">
        {isChampion ? "1st place" : `${rank === 2 ? "2nd" : "3rd"} Place`}
      </Text>
      <div className={`mt-3 rounded-xl px-5 py-2 font-bold text-lg ${isChampion ? "bg-yellow-400/20 text-yellow-700" : "bg-slate-100 text-slate-800"}`}>
        {entry.total_score}
        <span className="block text-xs font-normal text-center">nilai</span>
      </div>
    </div>
  );
}

export default function Index({ rankings = [], materials = [], currentUserId, className }) {
  const pageTitle = className ? `Ranking ${className}` : "Ranking";
  const [expandedUser, setExpandedUser] = useState(null);

  const top3 = rankings.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean); 

  const toggleExpand = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  return (
    <AppLayout title={pageTitle} label={pageTitle}>
      <div className="space-y-8">
        {/* Podium Top 3 */}
        {top3.length > 0 && (
          <div>
            <Text as="h2" variant="title" className="text-center text-lg mb-6">{pageTitle}</Text>
            <div className="flex items-end justify-center gap-4">
              {podiumOrder.map((entry) =>
                entry ? (
                  <PodiumCard
                    key={entry.user_id}
                    entry={entry}
                    rank={entry.rank}
                    isCurrentUser={entry.user_id === currentUserId}
                  />
                ) : null
              )}
            </div>
          </div>
        )}

        {/* Full Rankings Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <Text as="h3" variant="title">Full Rankings</Text>
          </div>

          {/* Header */}
          <div className="hidden md:grid md:grid-cols-[60px_1fr_120px_120px_60px] px-5 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
            <div className="text-center">Rank</div>
            <div >nama mahasiswa</div>
            <div className="text-center">Nilai</div>
            <div className="text-center">Detail</div>
            <div></div>
          </div>

          {rankings.length === 0 ? (
            <div className="p-8 text-center">
              <Text variant="body">Belum ada data leaderboard.</Text>
            </div>
          ) : (
            rankings.map((entry) => {
              const isMe = entry.user_id === currentUserId;
              const isExpanded = expandedUser === entry.user_id;

              return (
                <div key={entry.user_id}>
                  {/* Main Row */}
                  <div
                    className={[
                      "grid grid-cols-[60px_1fr_120px_120px_60px] items-center px-5 py-4 border-b border-slate-50 transition cursor-pointer hover:bg-slate-50",
                      isMe ? "bg-yellow-50" : "",
                    ].join(" ")}
                    onClick={() => toggleExpand(entry.user_id)}
                  >
                    <div className="text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${medalColor(entry.rank)}`}>
                        {entry.rank}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        <Icons.User className="w-4 h-4" />
                      </div>
                      <div>
                        <Text variant="body" className={isMe ? "text-blue-600 font-semibold" : "font-medium"}>
                          {entry.nama}
                          {isMe && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                              Kamu
                            </span>
                          )}
                        </Text>
                        <Text variant="caption">{entry.email}</Text>
                      </div>
                    </div>

                    <div className="text-center">
                      <span className={`text-sm font-semibold ${isMe ? "text-blue-600" : "text-slate-900"}`}>
                        {entry.total_score}
                      </span>
                    </div>

                    <div className="text-center">
                      <Text variant="caption" className="text-blue-500 hover:underline">
                        {isExpanded ? "Sembunyikan" : "Lihat Detail"}
                      </Text>
                    </div>

                    <div className="text-center text-slate-400">
                      <span className={`inline-block transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <DetailTable materialsData={entry.materials} materialsList={materials} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
