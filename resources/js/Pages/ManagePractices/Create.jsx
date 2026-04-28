import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import Card from "@/Components/Card";
import Button from "@/Components/Button";
import { usePopup } from "@/Components/PopUp/PopUpProvider";
import { QUESTION_TYPE, levelLabel as difficultyLabel, questionTypeLabel } from "@/Features/practice/core";
import PracticeMetaPanel from "@/Features/practice/PracticeMetaPanel";
import MultipleChoiceQuestionForm from "@/Components/QuestionForm/MultipleChoiceQuestionForm";
import DragDropQuestionForm from "@/Components/QuestionForm/DragDropQuestionForm";
import {
  appendQuestionImageToFormData,
  normalizeQuestionImage,
  updateQuestionImage,
} from "@/Features/questionImage";

function logCreateAction(action, detail = {}) {
	console.log("[Latsol Create]", { action, ...detail });
}

function createEmptyQuestion(type = QUESTION_TYPE.MC) {
	return {
		id: null,
		question_text: "",
		subtopic_id: null,
		sub_topic_name: "",
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
      material_id: q.material_id ?? base.material_id,
      subtopic_id: q.subtopic_id ?? q.sub_topic_id ?? base.subtopic_id,
      outputCode: q.code_snippet ?? q.output_code ?? q.outputCode ?? base.outputCode,
      question_text: q.question_text ?? q.practice_text ?? base.question_text,
      feedbackCorrect:
        q.feedback_correct ?? q.feedbackCorrect ?? base.feedbackCorrect,
      feedbackIncorrect:
        q.feedback_incorrect ??
        q.feedbackIncorrect ??
        base.feedbackIncorrect,
      ...normalizeQuestionImage(q, base),
      options:
        Array.isArray(q.options) && q.options.length
          ? q.options.map((opt) => ({
              id: opt.id ?? null,
              text: opt.option_text ?? opt.text ?? "",
              is_correct: !!opt.is_correct,
            }))
          : base.options,
      _localId: Math.random().toString(36).slice(2),
    };
  });
}

export default function ManagePracticesCreate({ practice, teacher, questions: initialQuestions = [], subtopics = [], authUser }) {
	const backHandlerRef = React.useRef(null);
	const role = (authUser?.role || "").toLowerCase();
	const isSuperadmin = role === "superadmin";

	const registerBackHandler = React.useCallback((handler) => {
		backHandlerRef.current = handler;
	}, []);

	const backRoute = isSuperadmin ? "superadmin.practices.index" : "dosen.practices.index";

	return (
		<AppLayout
			title="Buat Latihan Soal"
			label="Buat Latihan Soal"
			backHref={route(backRoute)}
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
				subtopics={subtopics}
				registerBackHandler={registerBackHandler}
				authUser={authUser}
			/>
		</AppLayout>
	);
}

function CreatePracticeContent({
	practice,
	teacher,
	initialQuestions = [],
	subtopics = [],
	registerBackHandler,
	authUser,
}) {
	const [questions, setQuestions] = React.useState(() =>
		normalizeInitialQuestions(initialQuestions),
	);
	const [selectedType, setSelectedType] = React.useState(QUESTION_TYPE.MC);
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState("");
	const popup = usePopup();
	const role = (authUser?.role || "").toLowerCase();
	const isSuperadmin = role === "superadmin";
	const backRoute = isSuperadmin ? "superadmin.practices.index" : "dosen.practices.index";
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
			const subTopic = q.subtopic_id ?? null;
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
				subTopic !== null ||
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
				onConfirm: () => router.visit(route(backRoute)),
			});
			return;
		}

		router.visit(route(backRoute));
	}, [hasAnyInput, popup, submitting, backRoute]);

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
			formData.append(`questions[${index}][subtopic_id]`, q.subtopic_id ?? "");
			formData.append(`questions[${index}][points]`, q.points ?? "");
			formData.append(`questions[${index}][code_snippet]`, q.outputCode ?? "");
			formData.append(`questions[${index}][feedback_correct]`, q.feedbackCorrect ?? "");
			formData.append(
				`questions[${index}][feedback_incorrect]`,
				q.feedbackIncorrect ?? "",
			);

			appendQuestionImageToFormData(formData, q, index);	

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
		});

		const saveRouteName = (authUser?.role || "").toLowerCase() === "superadmin"
			? "superadmin.practices.questions.save"
			: "dosen.practices.questions.save";

		router.post(route(saveRouteName, practice.id), formData, {
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

	const handleQuestionImageChange = (questionIndex, payload) => {
	setQuestions((prev) =>
		updateQuestionImage(prev, questionIndex, payload),
	);
	};

	return (
		<div className=" mx-auto space-y-6">
			<header className="space-y-4">
				<PracticeMetaPanel
					teacherName={teacher?.name ?? "Dosen"}
					materialName={practice?.material?.name ?? "Pilih Materi"}
					levelLabel={difficultyLabel(practice?.level) ?? "Pilih Level"}
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
										{q.type === QUESTION_TYPE.DRAG
												? "Soal Drag & Drop"
												: "Soal Pilihan Ganda"}
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
							subtopicOptions={subtopics}
							onQuestionFieldChange={updateQuestionField}
							onOptionFieldChange={updateOptionField}
							onAddCodeBlock={handleAddCodeBlock}
							onRemoveCodeBlock={handleRemoveCodeBlock}
							onImageChange={handleQuestionImageChange}
							/>
						) : (
							<MultipleChoiceQuestionForm
								question={q}
								questionIndex={idx}
								subtopicOptions={subtopics}
								onQuestionFieldChange={updateQuestionField}
								onOptionFieldChange={updateOptionField}
								onSetCorrectOption={setCorrectOption}
								onImageChange={handleQuestionImageChange}
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

			{error && <p className="text-[11px] text-red-500 pt-1">{error}</p>}
		</div>
	);
}
