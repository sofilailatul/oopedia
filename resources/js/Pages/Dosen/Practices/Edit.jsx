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

function createEmptyQuestion(type = QUESTION_TYPE.MC) {
	return {
		id: null,
		question_text: "",
		points: 10,
		feedbackCorrect: "",
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
			feedbackCorrect:
				q.feedback_correct ?? q.feedbackCorrect ?? base.feedbackCorrect,
			feedbackIncorrect:
				q.feedback_incorrect ?? q.feedbackIncorrect ?? base.feedbackIncorrect,
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

function getErrorReason(errors) {
	if (!errors || typeof errors !== "object") {
		return "Gagal menyimpan pertanyaan karena terjadi kesalahan yang tidak diketahui.";
	}

	const entries = Object.entries(errors);
	const normalized = entries.map(([key, value]) => ({
		key: String(key || "").toLowerCase(),
		message: String(value || "").toLowerCase(),
	}));

	const hasKeyOrMessage = (pattern) =>
		normalized.some((item) => pattern.test(item.key) || pattern.test(item.message));

	if (hasKeyOrMessage(/question_text|pertanyaan|soal/)) {
		return "Teks soal belum lengkap, tolong cek kembali.";
	}

	if (hasKeyOrMessage(/options|option_text|jawaban/)) {
		return "Kalimat Jawaban belum lengkap, tolong cek kembali.";
	}

	if (hasKeyOrMessage(/is_correct|benar|correct/)) {
		return "Pilih satu jawaban yang benar untuk setiap soal.";
	}

	if (hasKeyOrMessage(/points|min|max|nilai|poin/)) {
		return "Nilai poin soal tidak valid. Pastikan poin berada pada rentang yang diizinkan.";
	}

	if (hasKeyOrMessage(/image|gambar|file/)) {
		return "File gambar tidak valid. Pastikan format dan ukuran file sudah sesuai.";
	}

	if (hasKeyOrMessage(/feedback/)) {
		return "Kolom feedback belum valid. Silakan periksa kembali feedback jawaban benar dan salah.";
	}

	const firstValue = Object.values(errors).find(
		(value) => typeof value === "string" && value.trim().length > 0,
	);

	if (firstValue) {
		return firstValue;
	}

	return "Validasi gagal. Periksa kembali isi soal dan jawaban Anda.";
}

function getQuestionsSnapshot(items = []) {
	return JSON.stringify(
		(items ?? []).map((q) => ({
			id: q.id ?? null,
			question_text: q.question_text ?? "",
			type: q.type ?? QUESTION_TYPE.MC,
			points: Number(q.points ?? 0),
			feedbackCorrect: q.feedbackCorrect ?? "",
			feedbackIncorrect: q.feedbackIncorrect ?? "",
			outputCode: q.outputCode ?? "",
			imageUrl: q.imageUrl ?? null,
			hasImageFile: !!q.imageFile,
			options: (q.options ?? []).map((opt) => ({
				id: opt.id ?? null,
				text: opt.text ?? "",
				is_correct: !!opt.is_correct,
			})),
		})),
	);
}

export default function DosenPracticeEdit({
	practice,
	teacher,
	questions: initialQuestions = [],
}) {
	const backHandlerRef = React.useRef(null);

	const registerBackHandler = React.useCallback((handler) => {
		backHandlerRef.current = handler;
	}, []);

	return (
		<AppLayout
			title="Edit Latihan Soal"
			label="Edit Latihan Soal"
			backHref={route("dosen.practices.index")}
			backLabel="Kembali ke Halaman Daftar"
			onBackClick={(e) => {
				e?.preventDefault?.();
				backHandlerRef.current?.();
			}}
		>
			<PracticeEditContent
				practice={practice}
				teacher={teacher}
				initialQuestions={initialQuestions}
				registerBackHandler={registerBackHandler}
			/>
		</AppLayout>
	);
}

function PracticeEditContent({
	practice,
	teacher,
	initialQuestions = [],
	registerBackHandler,
}) {
	const initialSnapshot = React.useMemo(
		() => getQuestionsSnapshot(normalizeInitialQuestions(initialQuestions)),
		[initialQuestions],
	);
	const [questions, setQuestions] = React.useState(() =>
		normalizeInitialQuestions(initialQuestions),
	);
	const [selectedType, setSelectedType] = React.useState(QUESTION_TYPE.MC);
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState("");
	const popup = usePopup();
	const isDirty = React.useMemo(
		() => getQuestionsSnapshot(questions) !== initialSnapshot,
		[questions, initialSnapshot],
	);
	const filteredQuestions = React.useMemo(() => {
		if (!selectedType) return questions;
		return questions.filter((q) => {
			const qType = q.type || QUESTION_TYPE.MC;
			return qType === selectedType;
		});
	}, [questions, selectedType]);

	const getQuestionIndexByLocalId = React.useCallback(
		(localId) => questions.findIndex((q) => q._localId === localId),
		[questions],
	);

	const handleBackToIndex = React.useCallback(() => {
		if (submitting) return;

		if (!isDirty) {
			router.visit(route("dosen.practices.index"));
			return;
		}

		popup.confirm({
			title: "Perubahan belum disimpan",
			message:
				"Ada perubahan pada latihan soal yang belum disimpan. Tetap kembali ke daftar?",
			confirmText: "Ya, kembali",
			cancelText: "Lanjut edit",
			onConfirm: () => router.visit(route("dosen.practices.index")),
		});
	}, [isDirty, popup, submitting]);

	React.useEffect(() => {
		registerBackHandler?.(handleBackToIndex);

		return () => {
			registerBackHandler?.(null);
		};
	}, [handleBackToIndex, registerBackHandler]);

	const handleAddQuestion = () => {
		setQuestions((prev) => [...prev, createEmptyQuestion(selectedType)]);
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
			formData.append(
				`questions[${index}][feedback_correct]`,
				q.feedbackCorrect ?? "",
			);
			formData.append(
				`questions[${index}][feedback_incorrect]`,
				q.feedbackIncorrect ?? "",
			);

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
				console.log("[Practice Edit] Berhasil menyimpan pertanyaan", {
					practiceId: practice?.id,
					questionCount: questions.length,
				});
				popup.alert({
					title: "Berhasil",
					message: "Perubahan latihan soal berhasil disimpan.",
					confirmText: "Kembali ke daftar",
					onClose: () => router.visit(route("dosen.practices.index")),
				});
			},
			onError: (errors) => {
				setSubmitting(false);
				const reason = getErrorReason(errors);
				setError(reason);

				console.error("[Practice Edit] Gagal menyimpan pertanyaan", {
					reason,
					errors,
					practiceId: practice?.id,
				});

				popup.alert({
					title: "Gagal",
					message: `Gagal menyimpan pertanyaan. Alasan: ${reason}`,
					confirmText: "Tutup",
				});
			},
		});
	};

	return (
		<div className="mx-auto max-w-5xl space-y-6">
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
					<div className=" p-8 text-center text-sm text-slate-500">
						Belum ada soal dengan tipe {questionTypeLabel(selectedType)}.
					</div>
				)}

				{filteredQuestions.map((q, visibleIdx) => {
					const idx = getQuestionIndexByLocalId(q._localId);
					if (idx < 0) return null;

					return (
					<Card
						key={q._localId}
						className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur"
					>
						<div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
							<div className="flex items-center gap-3">
								<span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
									{visibleIdx + 1}
								</span>
								<div>
									<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
										{questionTypeLabel(q.type || QUESTION_TYPE.MC)}
									</p>
									<p className="text-[11px] text-slate-400">
										{(q.type || QUESTION_TYPE.MC) === QUESTION_TYPE.DRAG
											? "Atur teks, item, dan feedback drag-drop"
											: "Atur teks, gambar, dan feedback"}
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
											updateQuestionField(
												idx,
												"points",
												Number(e.target.value) || 0,
											)
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

						{(q.type || QUESTION_TYPE.MC) === QUESTION_TYPE.DRAG ? (
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
						{submitting ? "Menyimpan..." : "Simpan Perubahan"}
					</Button>
				</div>

			{error && <p className="pt-1 text-[11px] text-red-500">{error}</p>}
		</div>
	);
}
