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
import { parseCsvText, getCsvValue } from "@/Features/questionImport";

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
	const importMcFileRef = React.useRef(null);
	const importDragFileRef = React.useRef(null);
	const [questions, setQuestions] = React.useState(() =>
		normalizeInitialQuestions(initialQuestions),
	);
	const [selectedType, setSelectedType] = React.useState(QUESTION_TYPE.MC);
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState("");
	const [importError, setImportError] = React.useState("");
	const [importSummary, setImportSummary] = React.useState("");
	const popup = usePopup();
	const role = (authUser?.role || "").toLowerCase();
	const isSuperadmin = role === "superadmin";
	const backRoute = isSuperadmin ? "superadmin.practices.index" : "dosen.practices.index";
	const templateRouteName = isSuperadmin
		? "superadmin.practices.template"
		: "dosen.practices.template";
	const subtopicLookup = React.useMemo(() => {
		const map = new Map();
		(subtopics ?? []).forEach((item) => {
			const key = String(item?.name ?? "").trim().toLowerCase();
			if (key) map.set(key, item.id);
		});
		return map;
	}, [subtopics]);
	const csvAliases = React.useMemo(
		() => ({
			question: ["pertanyaan", "soal", "question", "question_text"],
			optionA: ["opsi a", "option a", "jawaban a", "a"],
			optionB: ["opsi b", "option b", "jawaban b", "b"],
			optionC: ["opsi c", "option c", "jawaban c", "c"],
			optionD: ["opsi d", "option d", "jawaban d", "d"],
			answer: ["jawaban", "kunci", "answer"],
			codeSnippet: ["code snippet", "code_snippet", "kode", "kode program"],
			points: ["poin", "points", "nilai"],
			feedbackCorrect: ["feedback benar", "feedback_correct"],
			feedbackIncorrect: ["feedback salah", "feedback_incorrect"],
			subtopic: ["subtopik", "sub-topic", "sub_topic", "subtopic"],
			dragItem1: ["item 1", "item1"],
		}),
		[],
	);
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

	const resolveAnswerIndex = (answerRaw, options) => {
		const normalized = String(answerRaw ?? "").trim().toLowerCase();
		if (!normalized) return null;
		const letterMap = { a: 0, b: 1, c: 2, d: 3 };
		if (normalized in letterMap) return letterMap[normalized];
		if (["1", "2", "3", "4"].includes(normalized)) {
			return Number(normalized) - 1;
		}
		const textIndex = options.findIndex(
			(opt) => String(opt ?? "").trim().toLowerCase() === normalized,
		);
		return textIndex >= 0 ? textIndex : null;
	};

	const handleImportCsv = async (mode) => {
		setImportError("");
		setImportSummary("");
		const file =
			mode === "drag"
				? importDragFileRef.current?.files?.[0]
				: importMcFileRef.current?.files?.[0];
		if (!file) {
			setImportError("Pilih file CSV terlebih dahulu.");
			return;
		}

		const text = await file.text();
		const parsed = parseCsvText(text);
		if (!parsed.normalizedHeaders.length) {
			setImportError("Template CSV tidak terbaca. Pastikan header kolom sudah benar.");
			return;
		}

		const isDragTemplate =
			mode === "drag" ||
			parsed.normalizedHeaders.includes("item 1") ||
			parsed.normalizedHeaders.includes("item1");

		let skipped = 0;
		const imported = [];

		parsed.rows.forEach((row, index) => {
			const questionText = String(
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.question),
			).trim();
			if (!questionText) {
				skipped += 1;
				return;
			}

			if (isDragTemplate) {
				const items = [];
				for (let i = 1; i <= 14; i += 1) {
					const itemValue = String(
						getCsvValue(row, parsed.normalizedHeaders, [`item ${i}`, `item${i}`]),
					).trim();
					if (itemValue) items.push(itemValue);
				}

				if (items.length < 2) {
					skipped += 1;
					return;
				}

				const pointsValue = Number.parseInt(
					getCsvValue(row, parsed.normalizedHeaders, csvAliases.points),
					10,
				);
				const codeSnippet = String(
					getCsvValue(row, parsed.normalizedHeaders, csvAliases.codeSnippet),
				).trim();
				const subtopicName = String(
					getCsvValue(row, parsed.normalizedHeaders, csvAliases.subtopic),
				).trim();
				const subtopicId = subtopicLookup.get(subtopicName.toLowerCase()) ?? null;
				const feedbackCorrect = String(
					getCsvValue(row, parsed.normalizedHeaders, csvAliases.feedbackCorrect),
				).trim();
				const feedbackIncorrect = String(
					getCsvValue(row, parsed.normalizedHeaders, csvAliases.feedbackIncorrect),
				).trim();

				imported.push({
					...createEmptyQuestion(QUESTION_TYPE.DRAG),
					question_text: questionText,
					subtopic_id: subtopicId,
					sub_topic_name: subtopicName,
					points: Number.isNaN(pointsValue) ? 10 : pointsValue,
					outputCode: codeSnippet,
					feedbackCorrect: feedbackCorrect || "Jawaban kamu benar.",
					feedbackIncorrect,
					options: items.map((text) => ({
						id: null,
						text,
						is_correct: false,
					})),
					_localId: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
				});
				return;
			}

			const optionTexts = [
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.optionA),
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.optionB),
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.optionC),
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.optionD),
			]
				.map((value) => String(value ?? "").trim())
				.filter((value) => value.length > 0);

			if (optionTexts.length < 2) {
				skipped += 1;
				return;
			}

			const answerRaw = getCsvValue(
				row,
				parsed.normalizedHeaders,
				csvAliases.answer,
			);
			const answerIndex = resolveAnswerIndex(answerRaw, optionTexts);
			if (answerIndex === null || answerIndex >= optionTexts.length) {
				skipped += 1;
				return;
			}

			const pointsValue = Number.parseInt(
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.points),
				10,
			);
			const codeSnippet = String(
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.codeSnippet),
			).trim();
			const subtopicName = String(
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.subtopic),
			).trim();
			const subtopicId = subtopicLookup.get(subtopicName.toLowerCase()) ?? null;
			const feedbackCorrect = String(
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.feedbackCorrect),
			).trim();
			const feedbackIncorrect = String(
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.feedbackIncorrect),
			).trim();

			imported.push({
				...createEmptyQuestion(QUESTION_TYPE.MC),
				question_text: questionText,
				subtopic_id: subtopicId,
				sub_topic_name: subtopicName,
				points: Number.isNaN(pointsValue) ? 10 : pointsValue,
				outputCode: codeSnippet,
				feedbackCorrect: feedbackCorrect || "Jawaban kamu benar.",
				feedbackIncorrect,
				options: optionTexts.map((text, optIdx) => ({
					id: null,
					text,
					is_correct: optIdx === answerIndex,
				})),
				_localId: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
			});
		});

		if (imported.length === 0) {
			setImportError("Tidak ada baris soal valid yang bisa diimpor.");
			return;
		}

		setQuestions((prev) => [...prev, ...imported]);
		setImportSummary(
			`Berhasil impor ${imported.length} soal${skipped ? `, ${skipped} baris dilewati.` : "."}`,
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

			<Card className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
				<div className="border-b border-slate-100 px-5 py-3">
					<p className="text-xs font-semibold text-slate-800">Import Soal (CSV)</p>
					<p className="text-[11px] text-slate-500">
						Gunakan template yang sesuai untuk Pilihan Ganda atau Drag & Drop.
					</p>
				</div>
				<div className="px-5 py-4 space-y-4">
					<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
						<div>
							<p className="text-xs font-semibold text-slate-700">Pilihan Ganda</p>
							<p className="text-[11px] text-slate-500">
								Kolom wajib: Pertanyaan, Opsi A-D, Jawaban, Subtopik.
							</p>
						</div>
						<input
							ref={importMcFileRef}
							type="file"
							accept=".csv,text/csv"
							className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
						/>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="button"
								variant="outline"
								color="blue"
								size="sm"
								onClick={() => handleImportCsv("mc")}
							>
								Import
							</Button>
							<a
								href={route(templateRouteName, { practice: practice?.id, type: "mc" })}
								className="text-[11px] font-medium text-blue-600 hover:underline"
								target="_blank"
								rel="noreferrer"
							>
								Download template PG
							</a>
						</div>
					</div>

					<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
						<div>
							<p className="text-xs font-semibold text-slate-700">Drag & Drop</p>
							<p className="text-[11px] text-slate-500">
								Kolom wajib: Pertanyaan, Item 1-2, Subtopik.
							</p>
						</div>
						<input
							ref={importDragFileRef}
							type="file"
							accept=".csv,text/csv"
							className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
						/>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="button"
								variant="outline"
								color="blue"
								size="sm"
								onClick={() => handleImportCsv("drag")}
							>
								Import
							</Button>
							<a
								href={route(templateRouteName, { practice: practice?.id, type: "drag" })}
								className="text-[11px] font-medium text-blue-600 hover:underline"
								target="_blank"
								rel="noreferrer"
							>
								Template Drag & Drop
							</a>
						</div>
					</div>

					{importError && (
						<p className="text-[11px] text-red-500">{importError}</p>
					)}
					{importSummary && (
						<p className="text-[11px] text-emerald-600">{importSummary}</p>
					)}
				</div>
			</Card>

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
