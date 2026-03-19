import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/Button";
import Card from "@/Components/Card";
import QuizMetaPanel from "@/Features/quiz/QuizMetaPanel";
import { FaEdit } from "react-icons/fa";
import MultipleChoiceQuestionForm from "@/Components/QuestionForm/MultipleChoiceQuestionForm";

export default function DosenQuizShow({ quiz, questions = [] }) {
	const [filterMaterialId, setFilterMaterialId] = React.useState("all");

	const filteredQuestions = filterMaterialId === "all" 
		? questions 
		: questions.filter(q => String(q.material_id) === String(filterMaterialId));

	return (
		<AppLayout
			title="Detail Kuis"
			label="Detail Kuis"
			backHref={route("dosen.quizzes.index")}
			backLabel="Kembali ke daftar kuis"
		>
			<div className="max-w-5xl mx-auto space-y-6">
				{/* Quiz Info */}
					<div className="w-full p-1">
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-4">
								<div>
									<h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
									<p className="text-xs text-slate-600">Kelas: {quiz.class_name}</p>
								</div>
							</div>
							<Button
								as="a"
								href={route("dosen.quizzes.edit", quiz.id)}
								color="blue"
								variant="outline"
								size="sm"
								leftIcon={<FaEdit className="h-3 w-3" />}
							>
								Edit Kuis
							</Button>
						</div>

						<QuizMetaPanel
							duration={quiz.duration}
							passingScore={quiz.passing_score}
							startTime={quiz.start_at}
							endTime={quiz.end_at}
							description={quiz.description}
							materials={quiz.materials || []}
						/>
					</div>

				<section className="space-y-4 px-2">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
						<h3 className="text-base font-bold text-slate-800">Daftar Soal ({filteredQuestions.length})</h3>
						{quiz.materials && quiz.materials.length > 0 && (
							<select
								value={filterMaterialId}
								onChange={(e) => setFilterMaterialId(e.target.value)}
								className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
							>
								<option value="all">Semua Materi</option>
								{quiz.materials.map(m => (
									<option key={m.id} value={m.id}>{m.material_name}</option>
								))}
							</select>
						)}
					</div>

					{filteredQuestions.length > 0 ? (
						filteredQuestions.map((question, idx) => {
							// Map quiz question fields to MultipleChoiceQuestionForm expected structure
							const mappedQuestion = {
								question_text: question.quiz_text,
								options: (question.options || []).map(opt => ({
									text: opt.option_text,
									is_correct: opt.is_correct,
									id: opt.id
								})),
								image_url: question.image_path ? `/storage/${question.image_path}` : undefined,
								points: question.points,
								feedback_correct: question.feedback_correct,
								feedback_incorrect: question.feedback_incorrect,
							};
							return (
								<div
									key={question.id}
									className="border border-slate-200 bg-white/90 shadow-sm rounded-2xl backdrop-blur py-2"
								>
									<div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
										<div className="flex items-center gap-3">
											<span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
												{idx + 1}
											</span>
											<div>
												<p className="text-[12px] font-semibold text-slate-800">
													Materi: {question.material_name || "Tidak ada materi"}
												</p>
												<p className="text-[11px] text-slate-500">
													Points: {question.points ?? 10}
												</p>
											</div>
										</div>
									</div>
									<MultipleChoiceQuestionForm question={mappedQuestion} questionIndex={idx} readOnly />
								</div>
							);
						})
					) : questions.length > 0 ? (
						<div className="border border-slate-200 bg-white/90 shadow-sm rounded-2xl backdrop-blur py-8">
							<div className="text-center text-slate-500">
								<p className="text-sm">Tidak ada soal untuk materi yang dipilih.</p>
							</div>
						</div>
					) : (
						<div className="border border-slate-200 bg-white/90 shadow-sm rounded-2xl backdrop-blur py-8">
							<div className="text-center text-slate-500">
								<p className="text-sm">Belum ada soal yang dipilih untuk kuis ini.</p>
								<Button
									as="a"
									href={route("dosen.quizzes.edit", quiz.id)}
									color="blue"
									variant="outline"
									size="sm"
									className="mt-4"
								>
									Tambah Soal
								</Button>
							</div>
						</div>
					)}
				</section>
			</div>
		</AppLayout>
	);
}
