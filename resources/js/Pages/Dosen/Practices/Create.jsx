import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import Card from "@/Components/Card";
import Button from "@/Components/Button";
import { usePopup } from "@/Components/PopUp/PopUpProvider";
import { QUESTION_TYPE } from "@/Features/practice/constants";
import { difficultyLabel, questionTypeLabel } from "@/Features/practice/labels";
import PracticeMetaPanel from "@/Features/practice/PracticeMetaPanel";
import MultipleChoiceQuestionForm from "@/Components/QuestionForm/MultipleChoiceQuestionForm";
import DragDropQuestionForm from "@/Components/QuestionForm/DragDropQuestionForm";

function logCreateAction(action, detail = {}) {
	console.log("[Latsol Create]", { action, ...detail });
}

function createEmptyQuestion(type = QUESTION_TYPE.MC) {
	return {
		id: null,
		question_text: "",
		points: 10,
		feedbackCorrect: "Jawaban kamu benar.",
		feedbackIncorrect: "",
		outputCode: "",
		imageUrl: null,
		type,
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
	const backHandlerRef = React.useRef(null);

	const registerBackHandler = React.useCallback((handler) => {
		backHandlerRef.current = handler;
	}, []);

	return (
		<AppLayout
			title="Buat Latihan Soal"
			label="Buat Latihan Soal"
			backHref={route("dosen.practices.index")}
			backLabel="Kembali ke Halaman Daftar"
			onBackClick={(e) => {
				e?.preventDefault?.();
				backHandlerRef.current?.();
			}}
		>
			<CreatePracticeContent
				practice={practice}
				teacher={teacher}
				initialQuestions={initialQuestions}
				registerBackHandler={registerBackHandler}
			/>
		</AppLayout>
	);
}

function CreatePracticeContent({
	practice,
	teacher,
	initialQuestions = [],
	registerBackHandler,
}) {
	const [questions, setQuestions] = React.useState(() =>
		normalizeInitialQuestions(initialQuestions),
	);
	const [selectedType, setSelectedType] = React.useState(QUESTION_TYPE.MC);
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState("");
	const popup = usePopup();
	const filteredQuestions = React.useMemo(() => {
		if (!selectedType) return questions;
		return questions.filter((q) => (q.type || QUESTION_TYPE.MC) === selectedType);
	}, [questions, selectedType]);

	const getQuestionIndexByLocalId = React.useCallback(
		(localId) => questions.findIndex((q) => q._localId === localId),
		[questions],
	);

	const hasAnyInput = React.useMemo(() => {
		if ((questions ?? []).length > 1) return true;

		return (questions ?? []).some((q) => {
			const questionText = String(q.question_text ?? "").trim();
			const outputCode = String(q.outputCode ?? "").trim();
			const feedbackIncorrect = String(q.feedbackIncorrect ?? "").trim();
			const feedbackCorrect = String(q.feedbackCorrect ?? "").trim();
			const hasNonDefaultCorrectFeedback =
				feedbackCorrect.length > 0 && feedbackCorrect !== "Jawaban kamu benar.";
			const optionHasText = (q.options ?? []).some(
				(opt) => String(opt.text ?? "").trim().length > 0,
			);
			const hasImage = !!q.imageFile || !!q.imageUrl;
			const isNonDefaultType = (q.type ?? QUESTION_TYPE.MC) !== QUESTION_TYPE.MC;
			const isNonDefaultPoints = Number(q.points ?? 10) !== 10;

			return (
				questionText.length > 0 ||
				outputCode.length > 0 ||
				feedbackIncorrect.length > 0 ||
				hasNonDefaultCorrectFeedback ||
				optionHasText ||
				hasImage ||
				isNonDefaultType ||
				isNonDefaultPoints
			);
		});
	}, [questions]);

	const handleBackToIndex = React.useCallback(() => {
		if (submitting) return;

		if (!hasAnyInput) {
			popup.confirm({
				title: "Form belum diisi",
				message:
					"Anda belum mengisi apa pun pada latihan soal ini. Tetap kembali ke halaman daftar?",
				confirmText: "Ya, kembali",
				cancelText: "Lanjut isi",
				onConfirm: () => router.visit(route("dosen.practices.index")),
			});
			return;
		}

		router.visit(route("dosen.practices.index"));
	}, [hasAnyInput, popup, submitting]);

	React.useEffect(() => {
		registerBackHandler?.(handleBackToIndex);

		return () => {
			registerBackHandler?.(null);
		};
	}, [handleBackToIndex, registerBackHandler]);

	const handleAddQuestion = () => {
		logCreateAction("add_question", { currentCount: questions.length });
		setQuestions((prev) => [...prev, createEmptyQuestion(selectedType)]);
	};

	const handleRemoveQuestion = (idx) => {
		logCreateAction("remove_question", {
			questionIndex: idx,
			currentCount: questions.length,
		});
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

		logCreateAction("submit_create_questions", {
			questionCount: questions.length,
			practiceId: practice?.id,
		});

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
				console.log("[Latsol Create]", {
					action: "submit_result",
					success: true,
					reason: "save_success",
					questionCount: questions.length,
					practiceId: practice?.id,
				});
			},
			onError: (errors) => {
				setSubmitting(false);
				setError(errors?.questions ?? "Gagal menyimpan pertanyaan.");
				console.error("[Latsol Create]", {
					action: "submit_result",
					success: false,
					reason: "save_failed",
					errors,
					questionCount: questions.length,
					practiceId: practice?.id,
				});
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
		<div className=" mx-auto space-y-6">
				<header className="space-y-4">
					<PracticeMetaPanel
						teacherName={teacher?.name ?? "Dosen"}
						materialName={practice?.material?.name ?? "Pilih Materi"}
						levelLabel={difficultyLabel(practice?.difficulty_level) ?? "Pilih Level"}
						enableTypeSelect
						selectedType={selectedType}
						onTypeChange={setSelectedType}
						typeOptions={[
							{ value: QUESTION_TYPE.MC, label: questionTypeLabel(QUESTION_TYPE.MC) },
							{ value: QUESTION_TYPE.DRAG, label: questionTypeLabel(QUESTION_TYPE.DRAG) },
						]}
					/>
				</header>

				{filteredQuestions.length === 0 && (
					<div className="p-8 text-center text-sm text-slate-500">
						Belum ada soal dengan tipe {questionTypeLabel(selectedType)}.
					</div>
				)}

				{filteredQuestions.map((q, visibleIdx) => {
					const idx = getQuestionIndexByLocalId(q._localId);
					if (idx < 0) return null;

					return (
					<Card
						key={q._localId}
						className="border border-slate-200 bg-white/90 shadow-sm rounded-2xl backdrop-blur"
					>
						<div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
							<div className="flex items-center gap-3">
								<span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
									{visibleIdx + 1}
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
					);
				})}

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
	);
}

