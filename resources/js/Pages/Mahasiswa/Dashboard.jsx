import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import Button from '@/Components/Button';

const Ico = {
  Book: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  ),
  Unlock: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 019.9-1" />
    </svg>
  ),
  ClipList: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  ),
  Layers: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Arrow: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  Lock: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  Trophy: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 01-2-2V5h4M18 9h2a2 2 0 002-2V5h-4" /><path d="M6 9c0 6 6 9 6 9s6-3 6-9V5H6z" /><path d="M12 18v4M8 22h8" />
    </svg>
  ),
  Check: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  Info: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
    </svg>
  ),
  Play: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
    </svg>
  ),
  ChevronRight: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  Star: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Clock: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
  Zap: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
};

const STATUS_META = {
  completed: {
    label: 'Selesai',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: 'bg-emerald-50 text-emerald-600',
    connector: 'bg-emerald-300',
  },
  in_progress: {
    label: 'Sedang Dikerjakan',
    pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    icon: 'bg-indigo-50 text-indigo-600',
    connector: 'bg-indigo-200',
  },
  available: {
    label: 'Tersedia',
    pill: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
    icon: 'bg-amber-50 text-amber-600',
    connector: 'bg-slate-200',
  },
  locked: {
    label: 'Terkunci',
    pill: 'bg-slate-100 text-slate-400 border-slate-200',
    dot: 'bg-slate-300',
    icon: 'bg-slate-100 text-slate-400',
    connector: 'bg-slate-200',
  },
};

function safeStatus(s) {
  return STATUS_META[s] ? s : 'locked';
}

function getMeta(s) {
  return STATUS_META[safeStatus(s)];
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function percentFromStats(stats = {}) {
  const done =
    Number(stats.materials_completed ?? 0) +
    Number(stats.practices_completed ?? 0) +
    Number(stats.quizzes_completed ?? 0);
  const total =
    Number(stats.total_materials ?? 0) +
    Number(stats.total_practices ?? 0) +
    Number(stats.total_quizzes ?? 0);
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function fallbackLearningPath(stats = {}, hasClass = true) {
  return {
    has_class: hasClass,
    current_material: null,
    next_material: null,
    quiz: null,
    overall_progress: percentFromStats(stats),
    next_action: {
      key: hasClass ? 'read_material' : 'join_class',
      label: hasClass ? 'Mulai Baca Materi' : 'Kelas belum terhubung',
      title: hasClass ? 'Mulai dari membaca materi' : 'Hubungkan kelas untuk mulai belajar',
      description: hasClass
        ? 'Mulai dari membaca materi agar memahami konsep dasar terlebih dahulu.'
        : 'Dashboard belajar akan aktif setelah akunmu tergabung ke kelas.',
      href: '/materi',
      method: 'get',
      disabled: !hasClass,
    },
    summary: {
      active_material_name: '-',
      read_status: hasClass ? 'available' : 'locked',
      practice_gate_status: 'locked',
      pretest_status: 'locked',
      level_practice_status: 'locked',
      next_material_status: 'locked',
      quiz_status: 'locked',
    },
  };
}

function StatusPill({ status }) {
  const meta = getMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function CtaButton({ action, variant = 'dark', block = false }) {
  const disabled = Boolean(action?.disabled);
  const method = action?.method ?? 'get';

  const commonProps = {
    color: 'yellow',
    variant: 'solid',
    size: 'md',
    className: block ? 'w-full' : '',
    leftIcon: disabled ? <Ico.Lock className="w-4 h-4" /> : <Ico.Play className="w-4 h-4" />,
    rightIcon: !disabled ? <Ico.ChevronRight className="w-4 h-4" /> : null,
  };

  if (disabled) {
    return (
      <Button type="button" disabled {...commonProps}>
        {action?.label ?? 'Belum tersedia'}
      </Button>
    );
  }

  return (
    <Button
      as={Link}
      href={action?.href ?? '/materi'}
      method={method}
      {...commonProps}
    >
      {action?.label ?? 'Mulai Belajar'}
    </Button>
  );
}

function StatChip({ children, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] ml-1 font-bold border ${colors[color] ?? colors.indigo}`}>
      {children}
    </span>
  );
}

function DashboardHero({ name, learningPath, stats }) {
  const action = learningPath.next_action;
  const material = learningPath.current_material;

  return (
    <div className="grid grid-cols-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* LEFT = 2 kolom */}
      <div className="p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
          Halo, {name} 👋
        </p>
        <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
          Lanjut belajar yuk hari ini!
        </h1>
        <p className="mt-3 text-[12px] text-slate-500 leading-relaxed max-w-lg">
          Kamu lagi di materi{' '}
          <StatChip color="indigo">
            <Ico.Book className="w-3.5 h-3.5" />
            {material?.name ?? 'Pilih materi'}
          </StatChip>
        </p>
      </div>

      {/* RIGHT = 1 kolom */}
      <div className=" bg-slate-700 p-4 justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-1">
            Langkah berikutnya
          </p>
          <h2 className="text-[16px] font-black text-white leading-snug">
            {action?.title ?? 'Mulai belajar'}
          </h2>
          <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
            {action?.description}
          </p>
        </div>
        <div className="mt-3">
          <CtaButton action={action} />
        </div>
      </div>
    </div>
  );
}

const EXPLAINER_STEPS = [
  {
    num: '01',
    title: 'Baca Materi',
    desc: 'Materi harus selesai dibaca sebelum latihan terbuka.',
    bg: 'bg-indigo-50',
    title_color: 'text-indigo-900',
    desc_color: 'text-indigo-700',
    badge_bg: 'bg-indigo-100 text-indigo-700',
    Icon: Ico.Book,
    icon_color: 'text-indigo-500',
  },
  {
    num: '02',
    title: 'Practice Terbuka',
    desc: 'Setelah baca, pretest + latihan soal langsung bisa diakses.',
    bg: 'bg-emerald-50',
    title_color: 'text-emerald-900',
    desc_color: 'text-emerald-700',
    badge_bg: 'bg-emerald-100 text-emerald-700',
    Icon: Ico.Unlock,
    icon_color: 'text-emerald-500',
  },
  {
    num: '03',
    title: 'Kerjakan Pretest',
    desc: 'Pretest nentuin level latihanmu — easy, medium, atau hard.',
    bg: 'bg-orange-50',
    title_color: 'text-orange-900',
    desc_color: 'text-orange-700',
    badge_bg: 'bg-orange-100 text-orange-700',
    Icon: Ico.ClipList,
    icon_color: 'text-orange-500',
  },
  {
    num: '04',
    title: 'Latihan Sesuai Level',
    desc: 'Soal disesuaikan dari pretest. Tuntas = materi next unlock!',
    bg: 'bg-purple-50',
    title_color: 'text-purple-900',
    desc_color: 'text-purple-700',
    badge_bg: 'bg-purple-100 text-purple-700',
    Icon: Ico.Layers,
    icon_color: 'text-purple-500',
  },
  {
    num: '05',
    title: 'Materi Berikutnya',
    desc: 'Kalau latihan udah tuntas, materi selanjutnya langsung terbuka.',
    bg: 'bg-teal-50',
    title_color: 'text-teal-900',
    desc_color: 'text-teal-700',
    badge_bg: 'bg-teal-100 text-teal-700',
    Icon: Ico.Arrow,
    icon_color: 'text-teal-500',
  },
  {
    num: '06',
    title: 'Quiz Terbuka!',
    desc: 'Quiz unlock kalau SEMUA materi terkait sudah baca + latihan selesai.',
    bg: 'bg-rose-50',
    title_color: 'text-rose-900',
    desc_color: 'text-rose-700',
    badge_bg: 'bg-rose-100 text-rose-700',
    Icon: Ico.Trophy,
    icon_color: 'text-rose-500',
  },
];

function LearningFlowExplainer() {
  return (
    <section>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 overflow-x-auto">
        <h2 className="mb-1.5 text-[16px] font-black text-slate-900 tracking-tight">
          Gimana cara belajar di Oopedia?
        </h2>
        <div className="grid grid-cols-6 gap-3">
          {EXPLAINER_STEPS.map((step, i) => {
            const Icon = step.Icon;
            return (
              <div key={step.num} className="flex items-center gap-2">
                <div className={`${step.bg} rounded-2xl p-3 relative h-full`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon className={`w-4 h-4 ${step.icon_color}`} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${step.desc_color}`}>
                      {step.num}
                    </span>
                  </div>
                  <p className={`text-[12px] font-black leading-tight ${step.title_color} mb-1`}>
                    {step.title}
                  </p>
                  <p className={`text-[10px] leading-relaxed ${step.desc_color}`}>
                    {step.desc}
                  </p>
                </div>
                {i < EXPLAINER_STEPS.length - 1 && (
                  <Ico.ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function QuizUnlockStatus({ learningPath }) {
  const quiz = learningPath.quiz;

  if (!quiz) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0">
            <Ico.Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Quiz belum tersedia</p>
            <p className="mt-1 text-[12px] text-slate-500 leading-relaxed">
              Quiz akan muncul setelah dosen menambahkannya untuk kelasmu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const missing = quiz.missing_requirements ?? [];
  const isLocked = quiz.status === 'locked';

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Ico.Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">{quiz.title}</p>
            <p className="mt-1 text-[12px] text-slate-500 leading-relaxed">
              Quiz hanya terbuka jika semua materi terkait sudah selesai.
            </p>
          </div>
        </div>
        <StatusPill status={quiz.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Materi terkait
          </p>
          <p className="mt-1 text-xl font-black text-slate-900">
            {quiz.required_material_count ?? 0}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Passing score
          </p>
          <p className="mt-1 text-xl font-black text-slate-900">
            {quiz.passing_score ?? '-'}
          </p>
        </div>
      </div>

      {isLocked && missing.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Masih perlu diselesaikan:
          </p>
          <div className="space-y-2">
            {missing.slice(0, 3).map((item) => (
              <div
                key={`${item.material_id}-${item.reason}`}
                className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2"
              >
                <p className="text-[12px] font-bold text-slate-800">{item.name}</p>
                <p className="mt-0.5 text-[11px] text-amber-700">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LockedReasonCard({ learningPath }) {
  const action = learningPath.next_action ?? {};
  const quiz = learningPath.quiz;
  const missing = quiz?.missing_requirements ?? [];

  if (
    action.key !== 'waiting_practice' &&
    action.key !== 'quiz_locked' &&
    missing.length === 0
  ) return null;

  const isWaitingPractice = action.key === 'waiting_practice';

  return (
    <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white text-amber-600 flex items-center justify-center flex-shrink-0">
          <Ico.Info className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-black text-amber-900">
            {isWaitingPractice
              ? 'Kenapa latihan belum terlihat?'
              : 'Kenapa quiz masih terkunci?'}
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-amber-800">
            {isWaitingPractice
              ? 'Latihan soal akan terbuka setelah progress baca materi tersimpan dan soal untuk materi ini tersedia.'
              : 'Quiz akan terbuka setelah semua materi terkait selesai dibaca dan latihan soalnya tuntas.'}
          </p>
          {missing.length > 0 && (
            <div className="mt-3 space-y-2">
              {missing.slice(0, 3).map((item) => (
                <div
                  key={`${item.material_id}-${item.reason}`}
                  className="rounded-xl border border-amber-100 bg-white px-3 py-2"
                >
                  <p className="text-[12px] font-bold text-slate-800">{item.name}</p>
                  <p className="mt-0.5 text-[11px] text-amber-700">{item.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NoClassBanner() {
  return (
    <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5 flex items-start gap-3">
      <div className="w-10 h-10 rounded-2xl bg-white text-indigo-600 flex items-center justify-center flex-shrink-0">
        <Ico.Info className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-sm font-black text-indigo-900">
          Kamu belum terhubung ke kelas
        </h2>
        <p className="mt-1 text-[12px] leading-relaxed text-indigo-700">
          Dashboard belajar akan aktif setelah akunmu tergabung ke kelas. Hubungi dosen atau admin untuk mendapatkan akses kelas.
        </p>
      </div>
    </div>
  );
}

export default function MahasiswaDashboard({
  auth,
  stats,
  hasClass = true,
  learningPath,
}) {
  const user = auth?.user ?? {};
  const name = user.name ?? user.nama ?? 'Mahasiswa';
  const path = learningPath ?? fallbackLearningPath(stats, hasClass);

  return (
    <AppLayout title="Dashboard" label="Dashboard">
      <main className="mx-auto space-y-5">

        {/* no class warning */}
        {!hasClass && <NoClassBanner />}

        {/* hero */}
        <DashboardHero name={name} learningPath={path} stats={stats} />

        {/* alur belajar explainer — always visible */}
        <LearningFlowExplainer />

        {/* bottom grid: progress detail + quiz + locked reason */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-5">
          <div className="space-y-5">
            <QuizUnlockStatus learningPath={path} />
            <LockedReasonCard learningPath={path} />
          </div>
        </div>
      </main>
    </AppLayout>
  );
}