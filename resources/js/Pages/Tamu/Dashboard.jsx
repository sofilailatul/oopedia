import AppLayout from "@/Layouts/AppLayout";
import { useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Icons from "@/icons";
import StatCard from "@/Components/StatCard";
import Card from "@/Components/Card";
import Button from "@/Components/Button";
import { FaQuestionCircle } from "react-icons/fa";
import { useTour } from "@/Hooks/useTour";

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
    <section id="tour-explainer">


      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 overflow-x-auto">
        <h2 className="mb-4 text-[16px] font-black text-slate-900 tracking-tight">
          Gimana cara belajar di OOpedia?
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

export default function TamuDashboard({ auth, stats }) {
    const [showJoinModal, setShowJoinModal] = useState(false);
    const nama = auth.user?.name ?? auth.user?.nama ?? "Guest";
    const today = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date());

    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "Selamat pagi" : hour < 17 ? "Selamat siang" : "Selamat malam";

    const { data, setData, post, processing, errors, reset } = useForm({
        class_code: "",
    });

    const { startTour, checkAndStart, addSteps, next, back, cancel, complete } = useTour({
        storageKey: 'oopedia_tour_tamu',
    });

    useEffect(() => {
        addSteps([
            {
                id: 'tamu-welcome',
                title: 'Selamat Datang di OOpedia!',
                text: 'Halo! Kamu terdaftar sebagai tamu. Untuk mulai belajar, kamu perlu bergabung ke kelas terlebih dahulu dengan kode dari dosenmu.',
                buttons: [
                    { text: 'Lewati', action: cancel, classes: 'shepherd-button-secondary' },
                    { text: 'Lanjut →', action: next },
                ],
            },
            {
                id: 'tamu-alur',
                title: 'Alur Belajar OOpedia',
                text: 'Setelah join kelas, kamu bisa belajar secara bertahap: Baca Materi → Latihan Soal Adaptif → Quiz. Semua disesuaikan dengan kemampuanmu!',
                buttons: [
                    { text: '← Kembali', action: back, classes: 'shepherd-button-secondary' },
                    { text: 'Lanjut →', action: next },
                ],
            },
            {
                id: 'tamu-join',
                title: 'Yuk Join Kelas!',
                text: 'Klik tombol "Join Kelas" di bawah, lalu masukkan kode kelas yang diberikan oleh dosenmu. Setelah berhasil, dashboard belajarmu akan aktif!',
                buttons: [
                    { text: '← Kembali', action: back, classes: 'shepherd-button-secondary' },
                    { text: 'Nanti saja', action: complete, classes: 'shepherd-button-secondary' },
                    {
                        text: 'Join Kelas Sekarang 🚪',
                        action: () => { complete(); setShowJoinModal(true); }
                    },
                ],
            },
        ]);
        checkAndStart();
    }, []);

    const handleJoinClass = (e) => {
        e.preventDefault();
        post("/classes/join", {
            onSuccess: () => {
                setShowJoinModal(false);
                reset();
            },
        });
    };

    return (
        <AppLayout title="Dashboard Tamu">
            <div className="mx-auto w-full space-y-4 pb-6">
                <div className="flex justify-end mb-2">
                    <button
                        onClick={startTour}
                        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <FaQuestionCircle className="text-indigo-500 h-4 w-4" />
                        Panduan Join Kelas
                    </button>
                </div>
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4 text-slate-900 border border-sky-100 shadow-xl shadow-slate-200/40 transition-all duration-500">
                    {/* Decorative Orbs */}
                    <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-sky-200/20 blur-[80px] pointer-events-none" />
                    <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-blue-200/20 blur-[100px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-sky-100 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600 shadow-sm backdrop-blur-md">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                {today}
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1">{greeting} 👋</p>
                                <h1 className="text-xl md:text-4xl font-black tracking-tight leading-tight text-slate-900">
                                    Halo, {nama}!
                                </h1>
                                <p className="mt-3 max-w-2xl text-[12px] md:text-sm text-slate-500 leading-relaxed font-normal">
                                    Lihat gambaran cepat platform, lalu join kelas untuk mulai belajar dengan tampilan yang lebih simpel dan fresh.
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0 group relative">
                            <div className="absolute inset-0 bg-sky-200/30 blur-2xl rounded-full scale-110 group-hover:scale-125 transition-transform duration-500" />
                            <div className="relative rounded-[2.5rem] border border-sky-100 bg-white/80 p-5 backdrop-blur-xl min-w-[260px] shadow-2xl">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Status</p>
                                <p className="text-lg font-black text-slate-900">Belum join kelas</p>
                                <p className="max-w-[200px] text-[12px] text-slate-500 font-normal leading-relaxed">
                                    Masukkan kode kelas dari dosen untuk akses materi.
                                </p>
                                <Button
                                    color="indigo"
                                    size="sm"
                                    onClick={() => setShowJoinModal(true)}
                                    leftIcon={<Icons.Add className="w-4 h-4" />}
                                    className="mt-3 w-full !rounded-2xl !py-3 text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20"
                                >
                                    Join Sekarang
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <LearningFlowExplainer />
            </div>

            {/* Join Class Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Join Kelas</h3>
                            <button
                                onClick={() => {
                                    setShowJoinModal(false);
                                    reset();
                                }}
                                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                                <Icons.Close className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="mb-5 text-sm text-slate-500">
                            Masukkan kode kelas dari dosen untuk mulai belajar
                        </p>

                        <form onSubmit={handleJoinClass} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Kode Kelas
                                </label>
                                <input
                                    type="text"
                                    value={data.class_code}
                                    onChange={(e) =>
                                        setData(
                                            "class_code",
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-2xl font-black tracking-[0.2em] uppercase text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                    placeholder="ABC123"
                                    maxLength={10}
                                    required
                                />
                                {errors.class_code && (
                                    <p className="mt-2 text-sm text-rose-600">
                                        {errors.class_code}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    color="gray"
                                    size="md"
                                    className="flex-1 !rounded-2xl !py-3.5"
                                    disabled={processing}
                                    onClick={() => {
                                        setShowJoinModal(false);
                                        reset();
                                    }}
                                >
                                    Batal
                                </Button>

                                <Button
                                    type="submit"
                                    variant="solid"
                                    color="indigo"
                                    size="md"
                                    className="flex-1 !rounded-2xl !py-3.5 shadow-lg shadow-indigo-500/20"
                                    disabled={processing}
                                >
                                    {processing ? "Memproses..." : "Join Sekarang"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
