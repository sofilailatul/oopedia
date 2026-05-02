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

function createEmptyQuestion(type = QUESTION_TYPE.MC) {
	return {
		id: null,
		question_text: "",
		subtopic_id: null,
		sub_topic_name: "",
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
			subtopic_id: q.subtopic_id ?? null,
			type: q.type ?? QUESTION_TYPE.MC,
			points: Number(q.points ?? 0),
			feedbackCorrect: q.feedbackCorrect ?? "",
			feedbackIncorrect: q.feedbackIncorrect ?? "",
			outputCode: q.outputCode ?? "",
			imageUrl: q.imageUrl ?? null,
			image_path: q.image_path ?? null,
			remove_image: !!q.remove_image,
			hasImageFile: !!q.imageFile,
			options: (q.options ?? []).map((opt) => ({
				id: opt.id ?? null,
				text: opt.text ?? "",
				is_correct: !!opt.is_correct,
			})),
		})),
	);
}

function mergeDraftWithServerQuestions(draftQuestions = [], serverQuestions = []) {
  if (!Array.isArray(draftQuestions) || draftQuestions.length === 0) {
    return serverQuestions;
  }

  const serverById = new Map(
    (serverQuestions || [])
      .filter((q) => q?.id != null)
      .map((q) => [String(q.id), q]),
  );

  return draftQuestions.map((draftQ, index) => {
    const fromServerById =
      draftQ?.id != null ? serverById.get(String(draftQ.id)) : null;
    const serverQ = fromServerById ?? serverQuestions[index] ?? null;

    const mergedOptions =
      (draftQ?.options ?? []).length > 0
        ? draftQ.options.map((opt, optIdx) => {
            const serverOpt = serverQ?.options?.[optIdx] ?? null;
            return {
              ...(serverOpt || {}),
              ...(opt || {}),
              text:
                opt?.text && String(opt.text).trim() !== ""
                  ? opt.text
                  : serverOpt?.text ??
                    serverOpt?.item_text ??
                    serverOpt?.option_text ??
                    "",
            };
          })
        : (serverQ?.options ?? []);

    return {
      ...(serverQ || {}),
      ...(draftQ || {}),
      options: mergedOptions,
      feedbackCorrect:
        draftQ?.feedbackCorrect ??
        draftQ?.feedback_correct ??
        serverQ?.feedbackCorrect ??
        serverQ?.feedback_correct ??
        "",
      feedbackIncorrect:
        draftQ?.feedbackIncorrect ??
        draftQ?.feedback_incorrect ??
        serverQ?.feedbackIncorrect ??
        serverQ?.feedback_incorrect ??
        "",
    };
  });
}

export default function ManagePracticesEdit({
	practice,
	teacher,
	questions: initialQuestions = [],
	subtopics = [],
	authUser,
}) {
	const backHandlerRef = React.useRef(null);
	const role = (authUser?.role || "").toLowerCase();
	const isSuperadmin = role === "superadmin";
	const backRoute = isSuperadmin ? "superadmin.practices.index" : "dosen.practices.index";

	const registerBackHandler = React.useCallback((handler) => {
		backHandlerRef.current = handler;
	}, []);

	return (
		<AppLayout
			title="Edit Latihan Soal"
			label="Edit Latihan Soal"
			backHref={route(backRoute)}
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
				subtopics={subtopics}
				registerBackHandler={registerBackHandler}
				backRoute={backRoute}
				authUser={authUser}
			/>
		</AppLayout>
	);
}

function PracticeEditContent({
	practice,
	teacher,
	initialQuestions = [],
	subtopics = [],
	registerBackHandler,
	backRoute,
	authUser,
}) {
	const importMcFileRef = React.useRef(null);
	const importDragFileRef = React.useRef(null);
	const STORAGE_VERSION = "v3";
	const STORAGE_KEY = `practice_draft_${practice?.id}_${STORAGE_VERSION}`;
	const normalizedServerQuestions = React.useMemo(
		() => normalizeInitialQuestions(initialQuestions),
		[initialQuestions],
	);

	const initialSnapshot = React.useMemo(
		() => getQuestionsSnapshot(normalizedServerQuestions),
		[normalizedServerQuestions],
	);

	const [questions, setQuestions] = React.useState(() => {
		try {
			const stored = sessionStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				if (Array.isArray(parsed) && parsed.length > 0) {
					return mergeDraftWithServerQuestions(parsed, normalizedServerQuestions);
				}
			}
		} catch (err) {
			console.warn('[Practice Edit] Failed to restore from storage:', err);
		}
		return normalizedServerQuestions;
	});
	const [selectedType, setSelectedType] = React.useState(QUESTION_TYPE.MC);
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState("");
	const [importError, setImportError] = React.useState("");
	const [importSummary, setImportSummary] = React.useState("");
	const popup = usePopup();
	const role = (authUser?.role || "").toLowerCase();
	const isSuperadmin = role === "superadmin";
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
			router.visit(route(backRoute));
			return;
		}

		popup.confirm({
			title: "Perubahan belum disimpan",
			message:
				"Ada perubahan pada latihan soal yang belum disimpan. Tetap kembali ke daftar?",
			confirmText: "Ya, kembali",
			cancelText: "Lanjut edit",
			onConfirm: () => router.visit(route(backRoute)),
		});
	}, [isDirty, popup, submitting, backRoute]);

	React.useEffect(() => {
		registerBackHandler?.(handleBackToIndex);

		return () => {
			registerBackHandler?.(null);
		};
	}, [handleBackToIndex, registerBackHandler]);

	// Save questions to sessionStorage whenever they change
	React.useEffect(() => {
		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
		} catch (err) {
			console.warn('[Practice Edit] Failed to save to storage:', err);
		}
	}, [questions, STORAGE_KEY]);

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

	const handleSubmit = (e) => {
		e?.preventDefault();

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
			formData.append(
				`questions[${index}][feedback_correct]`,
				q.feedbackCorrect ?? "",
			);
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

			if (q.imageFile) {
				formData.append(`questions[${index}][image]`, q.imageFile);
			}

			if (q.remove_image) {
				formData.append(`questions[${index}][remove_image]`, "1");
			}
		});

		const saveRouteName = (authUser?.role || "").toLowerCase() === "superadmin"
			? "superadmin.practices.questions.save"
			: "dosen.practices.questions.save";

		router.post(route(saveRouteName, practice.id), formData, {
			forceFormData: true,
			onSuccess: () => {
				setSubmitting(false);
				try { sessionStorage.removeItem(STORAGE_KEY); } catch (err) {}
				console.log("[Practice Edit] Berhasil menyimpan pertanyaan", {
					practiceId: practice?.id,
					questionCount: questions.length,
				});
				popup.alert({
					title: "Berhasil",
					message: "Perubahan latihan soal berhasil disimpan.",
					confirmText: "Kembali ke daftar",
					onClose: () => router.visit(route(backRoute)),
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
		<div className="mx-auto space-y-6">
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
								Download Template
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
								Download Template
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
					{submitting ? "Menyimpan..." : "Simpan Perubahan"}
				</Button>
			</div>

			{error && <p className="pt-1 text-[11px] text-red-500">{error}</p>}
		</div>
	);
}
