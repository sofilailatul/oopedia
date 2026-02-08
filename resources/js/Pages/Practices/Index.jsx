import React, { useMemo, useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";

import PracticeCard from "@/Components/Practice/PracticeCard";
import PracticeSidebar from "@/Components/Practice/PracticeSidebar";

import { canStartPractice } from "@/Features/practice/helpers";

export default function Index({ practices = [] }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedPractice, setSelectedPractice] = useState(null);

    const [difficulty, setDifficulty] = useState("");
    const [questionType, setQuestionType] = useState("");

    const canStart = useMemo(() => {
        return canStartPractice(selectedPractice, difficulty, questionType);
    }, [selectedPractice, difficulty, questionType]);

    const openSidebar = (practice) => {
        setSelectedPractice(practice);
        setSidebarOpen(true);

        setDifficulty("");
        setQuestionType("");
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
        setSelectedPractice(null);

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
        <AppLayout title="Latihan Soal" label="Latihan Soal" fullHeight={false}>
            <div className="space-y-6 min-h-[582px]">
                {/* DESKTOP */}
                <div className="hidden lg:flex items-start">
                    <main className="flex-1">
                        <div className="grid grid-cols-3 gap-6">
                            {practices.map((practice) => (
                                <PracticeCard
                                    key={practice.material_id}
                                    practice={practice}
                                    onClick={() => openSidebar(practice)}
                                />
                            ))}
                        </div>
                    </main>

                    <aside
                        className={[
                            "transition-all duration-300 ease-in-out overflow-hidden",
                            sidebarOpen ? "w-[370px] pl-4" : "w-0 pl-0",
                        ].join(" ")}
                    >
                        <div className="w-full">
                            {sidebarOpen && (
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
                            )}
                        </div>
                    </aside>
                </div>

                {/* MOBILE/TABLET */}
                <div className="lg:hidden">
                    <main>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {practices.map((practice) => (
                                <PracticeCard
                                    key={practice.material_id}
                                    practice={practice}
                                    onClick={() => openSidebar(practice)}
                                />
                            ))}
                        </div>
                    </main>

                    {sidebarOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40 bg-black/30"
                                onClick={closeSidebar}
                            />

                            <aside className="fixed top-0 right-0 z-50 h-full w-[92%] max-w-[420px] p-4">
                                <div className="h-full overflow-y-auto">
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
