import React, { useMemo, useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link } from "@inertiajs/react";
import Icons from "@/icons";

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig = {
  completed: {
    label: "Selesai",
    badge: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    accent: "border-l-emerald-400",
    dot: "bg-emerald-400",
    actionLabel: "Lihat Materi",
    actionClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    icon: Icons.CheckCircle,
  },
  in_progress: {
    label: "Sedang Dipelajari",
    badge: "bg-indigo-50 text-indigo-600 border border-indigo-200",
    accent: "border-l-indigo-400",
    dot: "bg-indigo-400",
    actionLabel: "Lanjutkan",
    actionClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
    icon: Icons.Play,
  },
  unlocked: {
    label: "Belum Mulai",
    badge: "bg-amber-50 text-amber-600 border border-amber-200",
    accent: "border-l-amber-400",
    dot: "bg-amber-400",
    actionLabel: "Mulai Belajar",
    actionClass: "bg-slate-900 hover:bg-slate-700 text-white",
    icon: Icons.Forward,
  },
  locked: {
    label: "Terkunci",
    badge: "bg-slate-100 text-slate-400 border border-slate-200",
    accent: "border-l-slate-300",
    dot: "bg-slate-300",
    actionLabel: "Terkunci",
    actionClass: "bg-slate-100 text-slate-400 cursor-not-allowed",
    icon: Icons.Lock,
  },
};

// ─── Material Card ────────────────────────────────────────────────────────────
function MaterialCard({ material }) {
  const progress = material.progress ?? "locked";
  const conf = statusConfig[progress] ?? statusConfig.unlocked;
  const isLocked = progress === "locked";
  const StatusIcon = conf.icon;

  return (
    <div
      className={`group relative bg-white rounded-2xl border border-slate-100 border-l-4 ${conf.accent} shadow-sm hover:shadow-md transition-all duration-300 ${isLocked ? "opacity-60" : "hover:-translate-y-0.5"} flex flex-col overflow-hidden`}
    >
      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${conf.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
            {conf.label}
          </span>
          {/* Order number */}
          {material.order && (
            <span className="text-[10px] font-bold text-slate-300">
              #{String(material.order).padStart(2, "0")}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={`text-sm font-bold leading-snug line-clamp-2 ${isLocked ? "text-slate-400" : "text-slate-900"}`}>
          {material.material_name}
        </h3>

        {/* Author */}
        {material.author && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
              <Icons.User className="w-3 h-3 text-slate-400" />
            </div>
            <span className="text-[11px] text-slate-400 font-medium truncate">
              {material.author}
            </span>
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="px-5 pb-5">
        {isLocked ? (
          <div className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold ${conf.actionClass}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {conf.actionLabel}
          </div>
        ) : (
          <Link
            href={`/materi/${material.id}`}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors duration-200 ${conf.actionClass}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {conf.actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MateriIndex({ materials = [] }) {
  const [tab, setTab] = useState("all");

  const tabs = [
    { key: "all", label: "Semua", count: materials.length },
    {
      key: "in_progress",
      label: "Progress",
      count: materials.filter((m) => (m.progress ?? "locked") === "in_progress").length,
    },
    {
      key: "unlocked",
      label: "Belum Mulai",
      count: materials.filter((m) => (m.progress ?? "locked") === "unlocked").length,
    },
    {
      key: "completed",
      label: "Selesai",
      count: materials.filter((m) => (m.progress ?? "locked") === "completed").length,
    },
    {
      key: "locked",
      label: "Terkunci",
      count: materials.filter((m) => (m.progress ?? "locked") === "locked").length,
    },
  ];

  const filtered = useMemo(() => {
    if (tab === "all") return materials;
    return materials.filter((m) => (m.progress ?? "locked") === tab);
  }, [materials, tab]);

  const completed = materials.filter((m) => m.progress === "completed").length;
  const total = materials.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <AppLayout title="Materi" label="Daftar Materi">
      <div className=" mx-auto px-2 space-y-6">

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Daftar Materi
            </h1>
          </div>

          {/* Overall progress chip */}
          <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm w-fit">
            <div className="flex flex-col items-end gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Progress
              </span>
              <div className="flex items-center gap-2">
                <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-extrabold text-slate-900">{pct}%</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-slate-900 leading-none">{completed}</span>
              <span className="text-xs text-slate-400 font-medium">/{total}</span>
            </div>
          </div>
        </div>

        {/* ── Tab Filter ─────────────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                tab === t.key
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700"
              }`}
            >
              {t.label}
              <span
                className={`min-w-[18px] text-center rounded-full px-1 text-[10px] font-bold ${
                  tab === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Materials Grid ──────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Icons.Materials className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-500">Tidak ada materi di sini</p>
            <p className="text-xs text-slate-400 mt-1">Coba pilih tab lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <MaterialCard key={m.id} material={m} />
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
