import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import Text from "@/Components/text";
import Button from "@/Components/Button";
import Icons from "@/icons";
import BackToListHeader from "@/Components/Shared/BackToListHeader";

function colorByScore(score) {
  if (score < 60) return { bar: "bg-red-500", btn: "red", icon: "!", iconBg: "bg-red-100", iconText: "text-red-500" };
  if (score < 75) return { bar: "bg-orange-500", btn: "yellow", icon: "★", iconBg: "bg-orange-100", iconText: "text-orange-500" };
  return { bar: "bg-blue-500", btn: "blue", icon: "i", iconBg: "bg-blue-100", iconText: "text-blue-500" };
}

export default function Review({ quiz, attempt, questions, recommendations = [] }) {
    return (
        <AppLayout title="Review Kuis" label="Review Kuis">
            <div className="mx-auto space-y-4">
                <BackToListHeader href="/kuis" label="Kembali ke Daftar Kuis" />

                <div className="rounded-2xl border bg-white p-5">
                    <Text variant="title" className="mb-2">{quiz.title}</Text>
                    <Text variant="subtitle">
                        Materi: {quiz.materials.join(", ")}
                    </Text>
                    <Text variant="body" className="mt-3">
                        Skor Kamu: <b>{attempt.total_score}</b>
                    </Text>
                </div>

                {questions.map((q, idx) => (
                    <div key={q.id} className="rounded-2xl border bg-white p-5">
                        <Text variant="titleSection" className="mb-2">
                            {idx + 1}. {q.quiz_text}
                        </Text>

                        <div className="mt-3 space-y-2">
                            {q.options.map((opt) => {
                                const isSelected = opt.id === q.selected_option_id;

                                return (
                                    <Text
                                        key={opt.id}
                                        variant="contentSection"
                                        className={`rounded-xl border px-4 py-2 ${
                                            isSelected
                                                ? q.is_correct
                                                    ? "border-green-400 bg-green-50 font-semibold"
                                                    : "border-red-400 bg-red-50 font-semibold"
                                                : "border-slate-200"
                                        }`}
                                    >
                                        {opt.text}
                                        {isSelected && (q.is_correct ? " ✓" : " ✕")}
                                    </Text>
                                );
                            })}
                        </div>

                        <Text variant="caption" className="mt-3">
                            {!q.answered ? (
                                <span className="text-yellow-600">
                                    Tidak dijawab
                                </span>
                            ) : q.is_correct ? (
                                <span className="text-green-600">
                                    {q.feedback_correct ?? "Jawaban benar"}
                                </span>
                            ) : (
                                <span className="text-red-600">
                                    {q.feedback_incorrect ?? "Jawaban salah"}
                                </span>
                            )}
                        </Text>
                    </div>
                ))}

                {/* Rekomendasi Materi */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                            <Icons.Lightbulb className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <Text variant="title">Rekomendasi Materi</Text>
                            <Text variant="subtitle">Fokus pada topik yang nilainya kurang</Text>
                        </div>
                    </div>

                    {recommendations.length === 0 ? (
                        <Text variant="body" className="mt-6">
                            Mantap! Tidak ada materi rekomendasi 🎉
                        </Text>
                    ) : (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                            {recommendations.map((m) => {
                                const ui = colorByScore(m.earned_score);
                                return (
                                    <div key={m.material_id} className="rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
                                        <div className={`w-10 h-10 rounded-xl ${ui.iconBg} flex items-center justify-center ${ui.iconText} font-bold text-lg`}>
                                            {ui.icon}
                                        </div>
                                        <Text variant="titleSection" className="mt-4">{m.name}</Text>
                                        <Text variant="caption" className="mt-2">Materi yang perlu kamu tingkatkan.</Text>
                                        <div className="mt-auto pt-4">
                                            <Text variant="caption" className="flex items-center justify-between">
                                                <span>Nilai Kamu</span>
                                                <span className="font-semibold">{m.earned_score} dari {m.max_score}</span>
                                            </Text>
                                            <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                                                <div className={`h-2 rounded-full ${ui.bar}`} style={{ width: `${m.percentage}%` }} />
                                            </div>
                                            <Button
                                                variant="solid"
                                                color={ui.btn}
                                                size="sm"
                                                className="mt-4 w-full"
                                                onClick={() => router.visit(route("materials.show", m.material_id))}
                                            >
                                                Mulai
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
