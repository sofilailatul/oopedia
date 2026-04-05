import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/Button";
import Card from "@/Components/Card";
import QuizMetaPanel from "@/Features/quiz/QuizMetaPanel";

export default function MahasiswaQuizShow({ quiz }) {
	return (
		<AppLayout
			title="Detail Kuis"
			label="Detail Kuis"
			backHref={route("quizzes.index")}
			backLabel="Kembali ke daftar kuis"
		>
			<div className="mx-auto space-y-6">
				<Card className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-5">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
							<p className="text-xs text-slate-600">
								Pengajar: {quiz.teacher_name}
							</p>
						</div>
						{quiz.status === "done" && (
							<div className="text-right text-xs text-emerald-700">
								<p className="font-semibold">Sudah dikerjakan</p>
								{quiz.score !== null && (
									<p>Nilai terakhir: {quiz.score}</p>
								)}
							</div>
						)}
					</div>

					<QuizMetaPanel
						duration={quiz.duration}
						passingScore={quiz.passing_score}
						startTime={quiz.start_at}
						endTime={quiz.end_at}
						description={quiz.description}
						materials={quiz.materials || []}
					/>
				</Card>

				<Card className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-5">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold text-slate-800">Ringkasan Kuis</h3>
						<span className="text-[11px] text-slate-500">
							Total soal: {quiz.total_questions}
						</span>
					</div>
					<p className="text-xs text-slate-600 mb-4">
						Pastikan kamu sudah membaca semua materi yang terkait dan menyelesaikan latihan
						sebelum mengerjakan kuis ini.
					</p>
					<div className="flex justify-end">
						<Button
							as="a"
							href={route("quizzes.show", quiz.id)}
							color="blue"
							variant="solid"
							size="sm"
						>
							Mulai / Lanjutkan Kuis
						</Button>
					</div>
				</Card>
			</div>
		</AppLayout>
	);
}
