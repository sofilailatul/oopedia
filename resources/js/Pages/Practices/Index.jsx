import React, { useMemo, useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import Icons from "@/icons";

import PracticeCard from "@/Components/Practice/PracticeCard";
import PracticeSidebar from "@/Components/Practice/PracticeSidebar";

import { canStartPractice } from "@/Features/practice/helpers";

export default function Index({ practices = [] }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedPractice, setSelectedPractice] = useState(null);

    const [difficulty, setDifficulty] = useState("");
    const [questionType, setQuestionType] = useState("");

    const [tab, setTab] = useState("all");

    const getStatus = (practice) => {
        if (practice?.is_locked) return "locked";
        if (practice?.has_active_attempt) return "in_progress";
        return "available";
    };

    const tabs = useMemo(() => {
        const counts = practices.reduce(
            (acc, p) => {
                const status = getStatus(p);
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            },
            { available: 0, in_progress: 0, locked: 0 }
        );

        return [
            { key: "all", label: "Semua", count: practices.length },
            { key: "available", label: "Tersedia", count: counts.available },
            { key: "in_progress", label: "Sedang Dikerjakan", count: counts.in_progress },
            { key: "locked", label: "Terkunci", count: counts.locked },
        ];
    }, [practices]);

    const filteredPractices = useMemo(() => {
        if (tab === "all") return practices;
        return practices.filter((p) => getStatus(p) === tab);
    }, [practices, tab]);

    const canStart = useMemo(() => {
        return canStartPractice(selectedPractice, difficulty, questionType);
    }, [selectedPractice, difficulty, questionType]);

    const openSidebar = (practice) => {
        if (practice?.is_locked) return; // jangan buka sidebar jika materi belum dibaca

        setSelectedPractice(practice);
        setSidebarOpen(true);

        setDifficulty("");
        setQuestionType("");
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
        setTimeout(() => setSelectedPractice(null), 300); // UI unmount delay

        setDifficulty("");
        setQuestionType("");
    };

    const handleStart = (questionCount) => {
        if (!canStart) return;

        const practiceId = selectedPractice?.levels?.[difficulty];
        if (!practiceId) return;

        router.post(route("practices.attempts.start", practiceId), {
            level: difficulty,
            question_type: questionType,
            question_count: questionCount,
            material_name: selectedPractice?.material_name || "",
        });
    };

    return (
        <AppLayout title="Latihan Soal" label="Latihan Soal">
            <div className="mx-auto px-4 py-4 space-y-6">
                
                {/* ── Page Header ────────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            Daftar Latihan Soal
                        </h1>
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

                {/* DESKTOP LAYOUT */}
                <div className="hidden lg:flex items-start">
                    <main className="flex-1">
                        {filteredPractices?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                    <Icons.Practice className="w-7 h-7 text-slate-300" />
                                </div>
                                <p className="text-sm font-bold text-slate-500">Belum ada latihan soal</p>
                                <p className="text-xs text-slate-400 mt-1">Coba pilih tab lain atau selesaikan membaca materi terlebih dahulu.</p>
                            </div>
                        ) : (
                            <div className={`grid gap-4 transition-all duration-500 ${sidebarOpen ? 'grid-cols-2' : 'grid-cols-3'}`}>
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

                    <aside
                        className={[
                            "transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden",
                            sidebarOpen ? "w-[400px] pl-6 opacity-100" : "w-0 pl-0 opacity-0",
                        ].join(" ")}
                    >
                        <div className="w-[376px]">
                            {selectedPractice && (
                                <div className="animate-in fade-in slide-in-from-right-8 duration-500 h-[calc(100vh-140px)] sticky top-24">
                                    <PracticeSidebar
                                        selectedPractice={selectedPractice}
                                        difficulty={difficulty}
                                        questionType={questionType}
                                        onDifficultyChange={setDifficulty}
                                        onQuestionTypeChange={setQuestionType}
                                        onClose={closeSidebar}
                                        onStart={handleStart}
                                        canStart={canStart}
                                    />
                                </div>
                            )}
                        </div>
                    </aside>
                </div>

                {/* MOBILE/TABLET LAYOUT */}
                <div className="lg:hidden">
                    <main>
                        {filteredPractices?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                    <Icons.Practice className="w-7 h-7 text-slate-300" />
                                </div>
                                <p className="text-sm font-bold text-slate-500">Belum ada latihan soal</p>
                            </div>
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

                    {/* Mobile Sidebar Overlay */}
                    {sidebarOpen && selectedPractice && (
                        <>
                            <div
                                className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                                onClick={closeSidebar}
                            />

                            <aside className="fixed top-0 right-0 z-[110] h-full w-[90%] max-w-[420px] p-4 animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
                                <div className="h-full">
                                    <PracticeSidebar
                                        selectedPractice={selectedPractice}
                                        difficulty={difficulty}
                                        questionType={questionType}
                                        onDifficultyChange={setDifficulty}
                                        onQuestionTypeChange={setQuestionType}
                                        onClose={closeSidebar}
                                        onStart={handleStart}
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
