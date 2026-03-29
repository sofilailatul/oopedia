// resources/js/Pages/Mahasiswa/Dashboard.jsx

import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import Icons from '@/icons';
import StatCard from '@/Components/StatCard';
import ActionCard from '@/Components/ActionCard';

// ─── Progress Ring ───────────────────────────────────────────────────────────
function ProgressRing({ value = 0, total = 1, size = 72, stroke = 6, color = '#6366f1' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(value / total, 1) : 0;
  const offset = circ * (1 - pct);

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

// ─── Stat Ring Card ───────────────────────────────────────────────────────────
function StatRingCard({ icon: Icon, iconColor, ringColor, label, value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="relative shrink-0 flex items-center justify-center">
        <ProgressRing value={value} total={total} size={64} stroke={5} color={ringColor} />
        <div className="absolute">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xl font-extrabold text-slate-900 leading-none">
          {value}<span className="text-sm font-medium text-slate-400">/{total}</span>
        </p>
        <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">{label}</p>
        <div className="mt-1.5 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: ringColor }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MahasiswaDashboard({ auth, stats }) {
  const nama = auth.user?.name ?? auth.user?.nama ?? 'Guest';
  const hasClass = auth.user?.class_id !== null;
  const classes = auth?.user?.classes ?? [];
  const className = classes.length > 0 ? classes[0].class_name : null;

  // compute overall progress
  const totalDone = (stats?.materials_completed || 0)
    + (stats?.practices_completed || 0)
    + (stats?.quizzes_completed || 0);
  const totalAll  = (stats?.total_materials || 0)
    + (stats?.total_practices || 0)
    + (stats?.total_quizzes || 0);
  const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';

  return (
    <AppLayout title="Dashboard">
      <div className="w-full mx-auto py-6 space-y-6">

        {/* ── Hero Greeting ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl md:p-8 text-white shadow-lg shadow-indigo-200">
          {/* decorative blobs */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-6 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* left */}
            <div>
              <p className="text-indigo-200 text-sm font-medium mb-1">{greeting} 👋</p>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                {nama}!
              </h1>
              {hasClass && className ? (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
                  <Icons.Class className="w-3.5 h-3.5 text-indigo-200" />
                  <span className="text-xs font-semibold text-white">Kelas {className}</span>
                </div>
              ) : (
                <p className="mt-2 text-indigo-200 text-xs">
                  Belum join kelas — tanya kode kelas ke dosenmu! 🏫
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats Row ──────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
            Learning Progress
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatRingCard
              icon={Icons.Materials}
              iconColor="text-rose-500"
              ringColor="#f43f5e"
              label="Materi Selesai"
              value={stats?.materials_completed || 0}
              total={stats?.total_materials || 0}
            />
            <StatRingCard
              icon={Icons.Practice}
              iconColor="text-emerald-500"
              ringColor="#10b981"
              label="Latihan Selesai"
              value={stats?.practices_completed || 0}
              total={stats?.total_practices || 0}
            />
            <StatRingCard
              icon={Icons.Quiz}
              iconColor="text-violet-500"
              ringColor="#8b5cf6"
              label="Quiz Selesai"
              value={stats?.quizzes_completed || 0}
              total={stats?.total_quizzes || 0}
            />
          </div>
        </div>

        {/* ── Quick Actions ──────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
            Mulai Belajar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ActionCard
              href="/materials"
              icon={Icons.Materials}
              iconBg="bg-rose-50"
              iconColor="text-rose-500"
              title="Belajar Materi"
              description="Pelajari konsep OOP dari dasar"
              rightIcon={Icons.ChevronRight}
            />
            <ActionCard
              href="/practices"
              icon={Icons.Practice}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-500"
              title="Latihan Soal"
              description="Asah kemampuan dengan soal latihan"
              rightIcon={Icons.ChevronRight}
            />
            <ActionCard
              href="/quizzes"
              icon={Icons.Quiz}
              iconBg="bg-violet-50"
              iconColor="text-violet-500"
              title="Ikuti Quiz"
              description="Uji pemahamanmu sekarang"
              rightIcon={Icons.ChevronRight}
            />
          </div>
        </div>

      </div>
    </AppLayout>
  );
}