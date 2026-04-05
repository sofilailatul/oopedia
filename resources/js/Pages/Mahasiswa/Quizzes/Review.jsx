import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import Button from "@/Components/Button";
import Icons from "@/icons";

function recommendationUi(percentage) {
    if (percentage < 60) return { bar: "bg-rose-500", btn: "red", iconClass: "bg-rose-100 text-rose-600" };
    if (percentage < 75) return { bar: "bg-amber-500", btn: "yellow", iconClass: "bg-amber-100 text-amber-600" };
    return { bar: "bg-emerald-500", btn: "green", iconClass: "bg-emerald-100 text-emerald-600" };
}

export default function Review({ quiz, attempt, questions = [], recommendations = [] }) {
    const score = Number(attempt?.total_score ?? 0);
    const answeredCount = questions.filter((q) => q.answered).length;
    const correctCount = questions.filter((q) => q.is_correct).length;
    const finishedAt = attempt?.finished_at ? new Date(attempt.finished_at).toLocaleString("id-ID") : "-";

    return (
        <AppLayout
            title="Review Kuis"
            label="Review Kuis"
            backHref="/kuis"
            backLabel="Kembali ke Daftar Kuis"
        >
            <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-6 md:p-8 text-white shadow-lg shadow-blue-200">
                    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-14 -left-6 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/90">Hasil Review</p>
                            <h1 className="mt-2 text-xl md:text-2xl font-semibold leading-tight">{quiz?.title ?? "Kuis"}</h1>
                            <p className="mt-3 max-w-3xl text-sm text-cyan-100/90">
                                Materi: {(quiz?.materials ?? []).join(", ") || "-"}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/80">Skor Akhir</p>
                            <p className="mt-1 text-3xl font-bold tracking-tight">{score}</p>
                            <p className="mt-2 text-xs text-cyan-100/90">Selesai: {finishedAt}</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs text-slate-500">Total Soal</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">{questions.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs text-slate-500">Terjawab</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">{answeredCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs text-slate-500">Jawaban Benar</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">{correctCount}</p>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Jawaban Kuis</p>
                            <h3 className="mt-1 text-lg font-semibold text-slate-900">Detail review setiap soal</h3>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">Soal {idx + 1}</p>
                                        <p className="mt-1 text-sm font-medium leading-relaxed text-slate-900">{q.quiz_text}</p>
                                    </div>
                                    <span
                                        className={`inline-flex w-fit rounded-full px-3 py-1.5 text-[10px] font-semibold ${
                                            q.answered
                                                ? q.is_correct
                                                    ? "bg-emerald-50 text-emerald-600"
                                                    : "bg-rose-50 text-rose-600"
                                                : "bg-amber-50 text-amber-700"
                                        }`}
                                    >
                                        {!q.answered ? "Tidak Dijawab" : q.is_correct ? "Benar" : "Salah"}
                                    </span>
                                </div>

                                <div className="mt-4 space-y-3">
                                    {(q.options ?? []).map((opt) => {
                                        const isSelected = opt.id === q.selected_option_id;
                                        return (
                                            <div
                                                key={opt.id}
                                                className={`rounded-xl border px-4 py-3 text-sm ${
                                                    isSelected
                                                        ? q.is_correct
                                                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                                            : "border-rose-300 bg-rose-50 text-rose-700"
                                                        : "border-slate-200 bg-white text-slate-700"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span>{opt.text}</span>
                                                    {isSelected && (
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                                                                q.is_correct ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                            }`}
                                                        >
                                                            Pilihan kamu
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <p className={`mt-3 text-sm ${q.is_correct ? "text-emerald-600" : "text-rose-600"}`}>
                                    {!q.answered
                                        ? "Soal ini tidak dijawab."
                                        : q.is_correct
                                        ? q.feedback_correct ?? "Jawaban benar."
                                        : q.feedback_incorrect ?? "Jawaban masih belum tepat."}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                            <Icons.Lightbulb className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Rekomendasi</p>
                            <h3 className="mt-1 text-lg font-semibold text-slate-900">Materi yang perlu kamu review ulang</h3>
                        </div>
                    </div>

                    {recommendations.length === 0 ? (
                        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                            Mantap, tidak ada rekomendasi tambahan. Semua materi sudah aman.
                        </div>
                    ) : (
                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                            {recommendations.map((m) => {
                                const ui = recommendationUi(Number(m.percentage ?? 0));
                                return (
                                    <div key={m.material_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${ui.iconClass}`}>
                                            <Icons.Book className="h-5 w-5" />
                                        </div>
                                        <p className="mt-4 text-sm font-semibold text-slate-900">{m.name}</p>
                                        <p className="mt-1 text-xs text-slate-500">Nilai: {m.earned_score} / {m.max_score}</p>

                                        <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div className={`h-2 rounded-full ${ui.bar}`} style={{ width: `${m.percentage}%` }} />
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">{m.percentage}%</p>

                                        <Button
                                            variant="solid"
                                            color={ui.btn}
                                            size="sm"
                                            className="mt-4 w-full"
                                            onClick={() => router.visit(route("materials.show", m.material_id))}
                                        >
                                            Buka Materi
                                        </Button>
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
