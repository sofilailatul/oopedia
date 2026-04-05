import AppLayout from "@/Layouts/AppLayout";
import { useForm } from "@inertiajs/react";
import { useState } from "react";
import Icons from "@/icons";
import StatCard from "@/Components/StatCard";
import Card from "@/Components/Card";
import Button from "@/Components/Button";

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
            <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 p-6 md:p-8 text-white shadow-lg shadow-indigo-200">
                    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-14 -left-6 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-50 backdrop-blur-sm">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                {today}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-sky-100/90">{greeting} 👋</p>
                                <h1 className="mt-1 text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
                                    Halo, {nama}!
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm md:text-base text-sky-100/90">
                                    Lihat gambaran cepat platform, lalu join kelas untuk mulai belajar dengan tampilan yang lebih simpel dan fresh.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
                                <div className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                                    <span>{Number(stats?.total_materials || 0).toLocaleString("id-ID")} Materi</span>
                                </div>
                                <div className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                                    <span>{Number(stats?.total_practices || 0).toLocaleString("id-ID")} Latihan</span>
                                </div>
                                <div className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                                    <span>{Number(stats?.total_quizzes || 0).toLocaleString("id-ID")} Quiz</span>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm shadow-[0_8px_30px_rgba(15,23,42,0.15)]">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/80">Status</p>
                            <p className="mt-1 text-lg font-bold text-white">Belum join kelas</p>
                            <p className="mt-2 max-w-xs text-sm text-sky-100/85">
                                Masukkan kode kelas dari dosen untuk mulai akses materi, latihan, dan quiz.
                            </p>
                            <Button
                                color="blue"
                                size="lg"
                                onClick={() => setShowJoinModal(true)}
                                leftIcon={<Icons.Add className="w-4 h-4" />}
                                className="mt-4 w-full bg-white text-slate-900 hover:bg-slate-50"
                            >
                                Join Kelas Sekarang
                            </Button>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                        Snapshot Platform
                    </h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <StatCard
                            icon={Icons.Materials}
                            iconBg="bg-sky-50"
                            iconColor="text-sky-600"
                            gradientFrom="from-sky-50"
                            label="Total Materi"
                            value={stats?.total_materials ?? 0}
                        />

                        <StatCard
                            icon={Icons.Practice}
                            iconBg="bg-emerald-50"
                            iconColor="text-emerald-600"
                            gradientFrom="from-emerald-50"
                            label="Total Latihan Soal"
                            value={stats?.total_practices ?? 0}
                        />

                        <StatCard
                            icon={Icons.Lock}
                            iconBg="bg-violet-50"
                            iconColor="text-violet-600"
                            gradientFrom="from-violet-50"
                            label="Total Quiz"
                            value={stats?.total_quizzes ?? 0}
                        />
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                    <Card
                        title="Mulai dari sini"
                        icon={Icons.Info}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                        className="p-6 md:p-7"
                    >
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
                                    <Icons.Class className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-bold text-slate-900">Join kelas</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Masukkan kode kelas yang diberikan dosen.
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                                    <Icons.Materials className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-bold text-slate-900">Akses materi</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Pelajari materi yang sesuai dengan kelas.
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
                                    <Icons.Quiz className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-bold text-slate-900">Coba quiz</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Uji pemahamanmu dengan latihan yang tersedia.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card
                        title="Kenapa harus join?"
                        icon={Icons.Lock}
                        iconBg="bg-violet-50"
                        iconColor="text-violet-600"
                        className="p-6 md:p-7"
                    >
                        <div className="space-y-3 text-sm text-slate-600">
                            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                                <p>Akses dashboard belajar yang rapi dan gampang dipakai dari HP maupun laptop.</p>
                            </div>
                            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                <p>Dapat update materi, latihan, dan quiz yang disiapkan dosen di kelasmu.</p>
                            </div>
                            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-violet-500" />
                                <p>Lebih cepat mulai belajar tanpa perlu cari menu yang rumit.</p>
                            </div>
                        </div>
                    </Card>
                </div>
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
                                    color="blue"
                                    size="md"
                                    className="flex-1 rounded-full"
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
                                    color="blue"
                                    size="md"
                                    className="flex-1 rounded-full bg-slate-900 hover:bg-slate-800"
                                    disabled={processing}
                                >
                                    {processing ? "Loading..." : "Join"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
