import React from 'react';
import Icons from '@/icons';

const PASSING_SCORE = 60;

const config = {
  completed: {
    label: "Selesai",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-300",
    accent: "border-l-emerald-500",
    dot: "bg-emerald-500",
    actionLabel: "Selesai",
    actionClass: "bg-emerald-500 text-white",
    icon: Icons.Success,
  },
  in_progress: {
    label: "Sedang Dikerjakan",
    badge: "bg-indigo-50 text-indigo-600 border border-indigo-200",
    accent: "border-l-indigo-400",
    dot: "bg-indigo-400",
    actionLabel: "Lanjutkan Latihan",
    actionClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
    icon: Icons.Play,
  },
  available: {
    label: "Tersedia",
    badge: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    accent: "border-l-emerald-400",
    dot: "bg-emerald-400",
    actionLabel: "Mulai Latihan",
    actionClass: "bg-slate-900 hover:bg-slate-700 text-white",
    icon: Icons.Forward,
  },
  locked: {
    label: "Terkunci",
    badge: "bg-slate-100 text-slate-400 border border-slate-200",
    accent: "border-l-slate-300",
    dot: "bg-slate-300",
    actionLabel: "Baca materi dulu",
    actionClass: "bg-slate-100 text-slate-400 cursor-not-allowed",
    icon: Icons.Lock,
  }
};

export default function PracticeCard({ practice, onClick }) {
  const isLocked = practice?.is_locked;
  const hasActiveAttempt = Boolean(practice?.has_active_attempt);
  const easy = Number(practice?.scores?.easy ?? -1);
  const normal = Number(practice?.scores?.normal ?? -1);
  const hard = Number(practice?.scores?.hard ?? -1);
  const isCompleted = easy > PASSING_SCORE && normal > PASSING_SCORE && hard > PASSING_SCORE;

  const conf = isLocked
    ? config.locked
    : isCompleted
      ? config.completed
    : hasActiveAttempt
      ? config.in_progress
      : config.available;
  const StatusIcon = conf.icon;

  return (
    <div
      onClick={() => {
        if (!isLocked) onClick(practice);
      }}
      className={`group relative bg-white rounded-2xl border border-slate-100 border-l-4 ${conf.accent} shadow-sm transition-all duration-300 flex flex-col overflow-hidden ${
        isLocked ? "opacity-60 cursor-not-allowed" : "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      }`}
    >
      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${conf.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} ${hasActiveAttempt && !isLocked ? 'animate-pulse' : ''}`} />
            {conf.label}
          </span>
        </div>

        {/* Title */}
        <h3 className={`text-sm font-bold leading-snug line-clamp-2 ${isLocked ? 'text-slate-400' : 'text-slate-900'}`}>
          {practice.material_name}
        </h3>

        {/* Description */}
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
          Latihan soal adaptif untuk pemahaman materi ini.
        </p>
      </div>

      {/* Action footer */}
      <div className="px-5 pb-5 mt-auto">
        <div className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors duration-200 ${conf.actionClass}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {conf.actionLabel}
        </div>
      </div>
    </div>
  );
}