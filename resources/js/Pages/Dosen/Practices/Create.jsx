import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import Card from "@/Components/Card";
import Button from "@/Components/Button";
import { QUESTION_TYPE } from "@/Features/practice/constants";
import { difficultyLabel } from "@/Features/practice/labels";
import PracticeMetaPanel from "@/Features/practice/PracticeMetaPanel";
import MultipleChoiceQuestionForm from "@/Components/QuestionForm/MultipleChoiceQuestionForm";
import DragDropQuestionForm from "@/Components/QuestionForm/DragDropQuestionForm";

function createEmptyQuestion() {
	return {
		id: null,
		question_text: "",
		points: 10,
		feedbackCorrect: "Jawaban kamu benar.",
		feedbackIncorrect: "",
		outputCode: "",
		imageUrl: null,
		type: QUESTION_TYPE.MC,
		options: [
			{ id: null, text: "", is_correct: true },
			{ id: null, text: "", is_correct: false },
			{ id: null, text: "", is_correct: false },
			{ id: null, text: "", is_correct: false },
		],
		_localId: Math.random().toString(36).slice(2),
	};
}

function normalizeInitialQuestions(initial = []) {
	if (!Array.isArray(initial) || initial.length === 0) {
		return [createEmptyQuestion()];
	}

	return initial.map((q) => {
		const base = createEmptyQuestion();
		return {
			...base,
			...q,
			type: q.type ?? base.type,
			feedbackCorrect: q.feedback_correct ?? q.feedbackCorrect ?? base.feedbackCorrect,
			feedbackIncorrect: q.feedback_incorrect ?? q.feedbackIncorrect ?? base.feedbackIncorrect,
			outputCode: q.output_code ?? q.outputCode ?? base.outputCode,
			imageUrl: q.image_url ?? q.imageUrl ?? base.imageUrl,
			options:
				Array.isArray(q.options) && q.options.length
					? q.options.map((opt) => ({
						id: opt.id ?? null,
						text: opt.text ?? "",
						is_correct: !!opt.is_correct,
					}))
					: base.options,
			_localId: Math.random().toString(36).slice(2),
		};
	});
}

export default function DosenPracticeCreate({ practice, teacher, questions: initialQuestions = [] }) {
	const [questions, setQuestions] = React.useState(() =>
		normalizeInitialQuestions(initialQuestions),
	);
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState("");

	const handleAddQuestion = () => {
		setQuestions((prev) => [...prev, createEmptyQuestion()]);
	};

	const handleRemoveQuestion = (idx) => {
		setQuestions((prev) => {
			if (prev.length === 1) return prev;
			return prev.filter((_, i) => i !== idx);
		});
	};

	const updateQuestionField = (idx, field, value) => {
		setQuestions((prev) =>
			prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)),
		);
	};

	const updateOptionField = (qIdx, optIdx, field, value) => {
		setQuestions((prev) =>
			prev.map((q, i) => {
				if (i !== qIdx) return q;
				const options = q.options.map((opt, j) =>
					j === optIdx ? { ...opt, [field]: value } : opt,
				);
				return { ...q, options };
			}),
		);
	};

	const setCorrectOption = (qIdx, optIdx) => {
		setQuestions((prev) =>
			prev.map((q, i) => {
				if (i !== qIdx) return q;
				const options = q.options.map((opt, j) => ({
					...opt,
					is_correct: j === optIdx,
				}));
				return { ...q, options };
			}),
		);
	};

	const handleAddCodeBlock = (qIdx) => {
		setQuestions((prev) =>
			prev.map((q, i) => {
				if (i !== qIdx) return q;
				return {
					...q,
					options: [...(q.options ?? []), { id: null, text: "", is_correct: false }],
				};
			}),
		);
	};

	const handleRemoveCodeBlock = (qIdx, optIdx) => {
		setQuestions((prev) =>
			prev.map((q, i) => {
				if (i !== qIdx) return q;
				if ((q.options ?? []).length <= 2) return q;
				return {
					...q,
					options: q.options.filter((_, j) => j !== optIdx),
				};
			}),
		);
	};

	const handleSubmit = (e) => {
		e?.preventDefault();

		setSubmitting(true);
		setError("");

		const formData = new FormData();
		questions.forEach((q, index) => {
			formData.append(`questions[${index}][id]`, q.id ?? "");
			formData.append(`questions[${index}][type]`, q.type ?? QUESTION_TYPE.MC);
			formData.append(`questions[${index}][question_text]`, q.question_text ?? "");
			formData.append(`questions[${index}][points]`, q.points ?? "");
			formData.append(`questions[${index}][output_code]`, q.outputCode ?? "");
			formData.append(`questions[${index}][feedback_correct]`, q.feedbackCorrect ?? "");
			formData.append(`questions[${index}][feedback_incorrect]`, q.feedbackIncorrect ?? "");

			q.options.forEach((opt, optIdx) => {
				formData.append(
					`questions[${index}][options][${optIdx}][text]`,
					opt.text ?? "",
				);
				formData.append(
					`questions[${index}][options][${optIdx}][is_correct]`,
					opt.is_correct ? "1" : "0",
				);
			});

			if (q.imageFile) {
				formData.append(`questions[${index}][image]`, q.imageFile);
			}
		});

		router.post(route("dosen.practices.questions.save", practice.id), formData, {
			forceFormData: true,
			onSuccess: () => {
				setSubmitting(false);
			},
			onError: (errors) => {
				setSubmitting(false);
				setError(errors?.questions ?? "Gagal menyimpan pertanyaan.");
			},
		});
	};

	const handleImageUpload = (qIdx, file) => {
		setQuestions((prev) =>
			prev.map((q, i) =>
				i === qIdx
					? {
						...q,
						imageFile: file || null,
						imageUrl: file ? URL.createObjectURL(file) : q.imageUrl ?? null,
					}
					: q,
				),
		);
	};

	return (
		<AppLayout
			title="Buat Latihan Soal"
			label="Buat Latihan Soal"
			backHref={route("dosen.practices.index")}
			backLabel="Kembali ke Halaman Daftar"
		>
			<div className="max-w-5xl mx-auto space-y-6">
				<header className="space-y-4">
					<PracticeMetaPanel
						teacherName={teacher?.name ?? "Dosen"}
						materialName={practice?.material?.name ?? "Pilih Materi"}
						levelLabel={difficultyLabel(practice?.difficulty_level) ?? "Pilih Level"}
						typeLabel="Multiple Choice"
					/>
				</header>

				{questions.map((q, idx) => (
					<Card
						key={q._localId}
						className="border border-slate-200 bg-white/90 shadow-sm rounded-2xl backdrop-blur"
					>
						<div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
							<div className="flex items-center gap-3">
								<span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
									{idx + 1}
								</span>
								<div>
									<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
										{q.type === QUESTION_TYPE.DRAG ? "Soal Drag & Drop" : "Soal Pilihan Ganda"}
									</p>
									<p className="text-[11px] text-slate-400">
										Atur teks, gambar, dan feedback
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3 text-xs text-slate-500">
								<div className="flex items-center gap-2">
									<span>Points</span>
									<input
										type="number"
										min="1"
										max="100"
										value={q.points}
										onChange={(e) =>
											updateQuestionField(idx, "points", Number(e.target.value) || 0)
										}
										className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
									/>
								</div>
								<button
									type="button"
									onClick={() => handleRemoveQuestion(idx)}
									className="text-[11px] text-red-500 hover:text-red-600"
								>
									Hapus
								</button>
							</div>
						</div>

						{q.type === QUESTION_TYPE.DRAG ? (
							<DragDropQuestionForm
								question={q}
								questionIndex={idx}
								onQuestionFieldChange={updateQuestionField}
								onOptionFieldChange={updateOptionField}
								onAddCodeBlock={handleAddCodeBlock}
								onRemoveCodeBlock={handleRemoveCodeBlock}
								onImageChange={handleImageUpload}
							/>
						) : (
							<MultipleChoiceQuestionForm
								question={q}
								questionIndex={idx}
								onQuestionFieldChange={updateQuestionField}
								onOptionFieldChange={updateOptionField}
								onSetCorrectOption={setCorrectOption}
								onImageChange={handleImageUpload}
							/>
						)}
					</Card>
				))}

				<div className="flex items-center justify-between pt-2">
					<Button
						type="button"
						variant="outline"
						color="blue"
						size="sm"
						onClick={handleAddQuestion}
					>
						+ Tambah Pertanyaan
					</Button>
					<Button
						type="button"
						variant="solid"
						color="green"
						size="sm"
						disabled={submitting}
						onClick={handleSubmit}
					>
						{submitting ? "Menyimpan..." : "Simpan"}
					</Button>
				</div>

				{error && (
					<p className="text-[11px] text-red-500 pt-1">{error}</p>
				)}
			</div>
		</AppLayout>
	);
}

