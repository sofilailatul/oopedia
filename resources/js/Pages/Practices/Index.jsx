import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import Icons from "@/icons";
import { FaQuestionCircle } from "react-icons/fa";

import PracticeCard from "@/Components/Practice/PracticeCard";
import PracticeSidebar from "@/Components/Practice/PracticeSidebar";

import { canStartPractice, getPracticeStatus } from "@/Features/practice/core";
import { useTour } from "@/Hooks/useTour";

export default function Index({ practices = [] }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedPractice, setSelectedPractice] = useState(null);
    const [tab, setTab] = useState("all");

    const { startTour, checkAndStart, addSteps, next, back, cancel, complete } = useTour({
        storageKey: 'oopedia_tour_practices',
    });

    useEffect(() => {
        addSteps([
            {
                id: 'practice-intro',
                title: 'Latihan Soal',
                text: 'Di halaman ini kamu bisa melihat semua latihan soal yang tersedia. Setiap latihan terkait dengan satu materi yang sudah kamu baca.',
                buttons: [
                    { text: 'Lanjut →', action: next },
                ],
            },
            {
                id: 'practice-cards',
                title: 'Cara Mulai Latihan',
                text: 'Klik kartu latihan untuk melihat detailnya, lalu klik tombol Mulai. Kartu yang terkunci (🔒) baru bisa diakses setelah kamu selesai membaca materinya terlebih dahulu.',
                buttons: [
                    {
                        text: 'Lanjut ke Quiz',
                        action: () => { complete(); router.visit(route('quizzes.index')); }
                    },
                ],
            },
        ]);
        // Auto-start pertama kali mahasiswa buka halaman ini
        checkAndStart();
    }, []);

    const getStatus = (practice) => getPracticeStatus(practice);

    const tabs = useMemo(() => {
        const counts = practices.reduce(
            (acc, p) => {
                const status = getStatus(p);
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            },
            { available: 0, in_progress: 0, completed: 0, locked: 0 }
        );

        return [
            { key: "all", label: "Semua", count: practices.length },
            { key: "available", label: "Tersedia", count: counts.available },
            { key: "in_progress", label: "Sedang Dikerjakan", count: counts.in_progress },
            { key: "completed", label: "Selesai", count: counts.completed },
            { key: "locked", label: "Terkunci", count: counts.locked },
        ];
    }, [practices]);

    const filteredPractices = useMemo(() => {
        if (tab === "all") return practices;
        return practices.filter((p) => getStatus(p) === tab);
    }, [practices, tab]);

    const canStart = useMemo(() => {
        return canStartPractice(selectedPractice);
    }, [selectedPractice]);

    const openSidebar = (practice) => {
        if (practice?.is_locked) return;
        setSelectedPractice(practice);
        setSidebarOpen(true);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
        setTimeout(() => setSelectedPractice(null), 300);
    };

    const handleStartPractice = () => {
        if (!selectedPractice?.material_id) return;

        const mode = selectedPractice?.progress?.current_mode;
        if (mode === "passed") {
            router.visit(route("materials.index"));
            return;
        }

        router.post(
            route("practices.attempts.entry", selectedPractice.material_id)
        );
    };

    return (
        <AppLayout title="Daftar Latihan Soal" label="Latihan Soal">
            {/* Wrapper h-full agar tidak ada scroll di level AppShell */}
            <div className="flex flex-col h-full px-4 pb-0 gap-4 overflow-hidden">

                {/* HEADER */}
                <div id="tour-practice-header" className="flex items-center justify-end flex-shrink-0">
                    <button
                        onClick={startTour}
                        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <FaQuestionCircle className="text-indigo-500 h-4 w-4" />
                        Panduan Latihan
                    </button>
                </div>


                {/* DESKTOP — flex-1 mengisi sisa tinggi, tidak ada scroll di luar */}
                <div className="hidden lg:flex flex-1 min-h-0 gap-6 pb-4">
                    {/* Kartu practice — scroll internal */}
                    <main id="tour-practice-list" className="flex-1 min-h-0 overflow-y-auto pr-1">
                        {filteredPractices.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className={`grid gap-4 ${sidebarOpen ? "grid-cols-2" : "grid-cols-3"}`}>
                                {filteredPractices.map((practice) => (
                                    <PracticeCard
                                        key={practice.material_id}
                                        practice={practice}
                                        onClick={() => openSidebar(practice)}
                                    />
                                ))}
                            </div>
                        )}
                    </main>

                    {/* Sidebar — tinggi mengikuti parent, scroll internal di PracticeSidebar */}
                    <aside
                        className={`transition-all duration-500 min-h-0 flex-shrink-0 ${
                            sidebarOpen ? "w-[376px] opacity-100" : "w-0 opacity-0 overflow-hidden"
                        }`}
                    >
                        {selectedPractice && (
                            <div className="w-[376px] h-full">
                                <PracticeSidebar
                                    selectedPractice={selectedPractice}
                                    progress={selectedPractice?.progress ?? null}
                                    onClose={closeSidebar}
                                    onStart={handleStartPractice}
                                    canStart={canStart}
                                />
                            </div>
                        )}
                    </aside>
                </div>

                {/* MOBILE — tetap scroll normal */}
                <div className="lg:hidden flex-1 overflow-y-auto pb-4">
                    <main>
                        {filteredPractices.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {filteredPractices.map((practice) => (
                                    <PracticeCard
                                        key={practice.material_id}
                                        practice={practice}
                                        onClick={() => openSidebar(practice)}
                                    />
                                ))}
                            </div>
                        )}
                    </main>

                    {sidebarOpen && selectedPractice && (
                        <>
                            <div
                                className="fixed inset-0 z-[100] bg-slate-900/40"
                                onClick={closeSidebar}
                            />

                            <aside className="fixed top-0 right-0 z-[110] h-full w-[90%] max-w-[420px] p-4">
                                <div className="h-full">
                                    <PracticeSidebar
                                        selectedPractice={selectedPractice}
                                        progress={selectedPractice?.progress ?? null}
                                        onClose={closeSidebar}
                                        onStart={handleStartPractice}
                                        canStart={canStart}
                                    />
                                </div>
                            </aside>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

/* COMPONENT TAMBAHAN */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Icons.Practice className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-500">
                Belum ada latihan soal
            </p>
            <p className="text-xs text-slate-400 mt-1">
                Coba pilih tab lain atau selesaikan membaca materi terlebih dahulu.
            </p>
        </div>
    );
}