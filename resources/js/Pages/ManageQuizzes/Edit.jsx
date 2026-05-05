import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import Card from "@/Components/Card";
import Button from "@/Components/Button";
import Field from "@/Components/Field";
import StatusModal from "@/Components/StatusModal";
import MultipleChoiceQuestionForm from "@/Components/QuestionForm/MultipleChoiceQuestionForm";
import Dropdown from "@/Components/Dropdown";
import CheckboxCard from "@/Components/CheckboxCard";
import {
  appendQuestionImageToFormData,
  normalizeQuestionImage,
  updateQuestionImage,
} from "@/Features/questionImage";
import { parseCsvText, getCsvValue } from "@/Features/questionImport";

function createEmptyQuestion() {
  return {
    id: null,
    material_id: "",
    subtopic_id: "",
    question_text: "",
    points: 10,
    feedbackCorrect: "",
    feedbackIncorrect: "",
    imageFile: null,
    imageUrl: null,
    image_url: null,
    image_path: null,
    remove_image: false,
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
      question_text: q.quiz_text ?? q.question_text ?? base.question_text,
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
		return "Gagal menyimpan kuis karena terjadi kesalahan yang tidak diketahui.";
	}

	const entries = Object.entries(errors);
	const normalized = entries.map(([key, value]) => ({
		key: String(key || "").toLowerCase(),
		message: String(value || "").toLowerCase(),
	}));

const hasKeyOrMessage = (pattern) =>
		normalized.some((item) => pattern.test(item.key) || pattern.test(item.message));

	if (hasKeyOrMessage(/title|judul/)) {
		return "Judul kuis tidak valid atau masih kosong.";
	}

	if (hasKeyOrMessage(/duration|durasi/)) {
		return "Durasi kuis tidak valid.";
	}

	if (hasKeyOrMessage(/passing_score|batas_lulus|batas lulus/)) {
		return "Batas nilai lulus kuis tidak valid.";
	}

	if (hasKeyOrMessage(/quiz_text|question_text|pertanyaan|soal/)) {
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
      material_id: q.material_id ?? "",
      subtopic_id: q.subtopic_id ?? "",
      question_text: q.question_text ?? "",
      points: Number(q.points ?? 0),
      feedbackCorrect: q.feedbackCorrect ?? "",
      feedbackIncorrect: q.feedbackIncorrect ?? "",
      imageUrl: q.imageUrl ?? null,
      image_url: q.image_url ?? null,
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

export default function ManageQuizzesEdit({
	quiz,
	questions: initialQuestions = [],
	materials = [],
	classes = [],
	authUser,
}) {
	const backHandlerRef = React.useRef(null);
	const role = (authUser?.role || "").toLowerCase();
	const isSuperadmin = role === "superadmin";
	const baseRouteName = isSuperadmin ? "superadmin.quizzes" : "dosen.quizzes";

	const registerBackHandler = React.useCallback((handler) => {
		backHandlerRef.current = handler;
	}, []);

	return (
		<AppLayout
			title="Edit Kuis"
			label="Edit Kuis"
			backHref={route(`${baseRouteName}.show`, quiz.id)}
			backLabel="Kembali ke detail kuis"
			onBackClick={(e) => {
				e?.preventDefault?.();
				backHandlerRef.current?.();
			}}
		>
			<QuizEditContent
				quiz={quiz}
				initialQuestions={initialQuestions}
				materials={materials}
				classes={classes}
				authUser={authUser}
				registerBackHandler={registerBackHandler}
			/>
		</AppLayout>
	);
}

function QuizEditContent({
	quiz,
	initialQuestions,
	materials,
	classes = [],
	authUser,
	registerBackHandler,
}) {
	const importFileRef = React.useRef(null);
	const [modalState, setModalState] = React.useState({
		show: false,
		type: "success",
		title: "",
		message: "",
		confirmText: "OK",
		cancelText: "Batal",
		onConfirm: null,
		onCancel: null,
	});

	const initialSnapshot = React.useMemo(
		() => getQuestionsSnapshot(normalizeInitialQuestions(initialQuestions)),
		[initialQuestions],
	);

	const [questions, setQuestions] = React.useState(() =>
		normalizeInitialQuestions(initialQuestions),
	);

	const [formData, setFormData] = React.useState({
		class_ids: quiz.existing_class_ids || [quiz.class_id],
		title: quiz.title || "",
		description: quiz.description || "",
		duration: quiz.duration || 30,
		passing_score: quiz.passing_score || 70,
		start_at: quiz.start_at || "",
		end_at: quiz.end_at || "",
		material_ids: (materials ?? []).map((material) => material.id),
	});

	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState("");
	const [importError, setImportError] = React.useState("");
	const [importSummary, setImportSummary] = React.useState("");

	const isDirty = React.useMemo(
		() => getQuestionsSnapshot(questions) !== initialSnapshot,
		[questions, initialSnapshot],
	);

	const role = (authUser?.role || "").toLowerCase();
	const isSuperadmin = role === "superadmin";
	const baseRouteName = isSuperadmin ? "superadmin.quizzes" : "dosen.quizzes";
	const saveRouteName = isSuperadmin
		? "superadmin.quizzes.questions.save"
		: "dosen.quizzes.questions.save";
	const templateRouteName = isSuperadmin
		? "superadmin.quizzes.template"
		: "dosen.quizzes.template";
	const materialLookup = React.useMemo(() => {
		const map = new Map();
		(materials ?? []).forEach((item) => {
			const key = String(
				item?.material_name ?? item?.name ?? item?.title ?? "",
			)
				.trim()
				.toLowerCase();
			if (key) map.set(key, item);
		});
		return map;
	}, [materials]);
	const csvAliases = React.useMemo(
		() => ({
			material: ["materi", "material"],
			question: ["pertanyaan", "soal", "question", "quiz_text", "question_text"],
			optionA: ["opsi a", "option a", "jawaban a", "a"],
			optionB: ["opsi b", "option b", "jawaban b", "b"],
			optionC: ["opsi c", "option c", "jawaban c", "c"],
			optionD: ["opsi d", "option d", "jawaban d", "d"],
			answer: ["jawaban", "kunci", "answer"],
			points: ["poin", "points", "nilai"],
			feedbackCorrect: ["feedback benar", "feedback_correct"],
			feedbackIncorrect: ["feedback salah", "feedback_incorrect"],
			subtopic: ["subtopik", "sub-topic", "sub_topic", "subtopic"],
		}),
		[],
	);

	const handleBack = React.useCallback(() => {
		if (submitting) return;

		if (isDirty) {
			setModalState({
				show: true,
				type: "confirm",
				title: "Perubahan belum disimpan",
				message:
					"Ada perubahan pada kuis yang belum disimpan. Tetap kembali ke detail?",
				confirmText: "Ya, kembali",
				cancelText: "Lanjut edit",
				onConfirm: () => router.visit(route(`${baseRouteName}.show`, quiz.id)),
				onCancel: () => setModalState((prev) => ({ ...prev, show: false })),
			});
			return;
		}

		if (!initialQuestions || initialQuestions.length === 0) {
			setModalState({
				show: true,
				type: "confirm",
				title: "Kuis Masih Kosong",
				message:
					"Anda belum menyimpan satupun soal untuk kuis ini. Apakah Anda yakin ingin meninggalkan halaman ini?",
				confirmText: "Tinggalkan Halaman",
				cancelText: "Buat Soal Sekarang",
				onConfirm: () => router.visit(route(`${baseRouteName}.show`, quiz.id)),
				onCancel: () => setModalState((prev) => ({ ...prev, show: false })),
			});
			return;
		}

		router.visit(route(`${baseRouteName}.show`, quiz.id));
	}, [
		isDirty,
		submitting,
		quiz.id,
		initialQuestions?.length,
		baseRouteName,
	]);

	React.useEffect(() => {
		registerBackHandler?.(handleBack);
		return () => registerBackHandler?.(null);
	}, [handleBack, registerBackHandler]);

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
				return {
					...q,
					options: q.options.map((opt, j) => ({
						...opt,
						is_correct: j === optIdx,
					})),
				};
			}),
		);
	};

	const handleQuestionImageChange = (questionIndex, payload) => {
	setQuestions((prev) =>
		updateQuestionImage(prev, questionIndex, payload),
	);
	};

	const handleSubmit = (e) => {
		e?.preventDefault();

		setSubmitting(true);
		setError("");

		const formDataPost = new FormData();

		formData.class_ids.forEach((id) => {
			formDataPost.append("class_ids[]", id);
		});
		formDataPost.append("title", formData.title);
		formDataPost.append("description", formData.description || "");
		formDataPost.append("duration", formData.duration);
		formDataPost.append("passing_score", formData.passing_score);
		formDataPost.append("start_at", formData.start_at || "");
		formDataPost.append("end_at", formData.end_at || "");
		(formData.material_ids || []).forEach((id) => {
			formDataPost.append("material_ids[]", id);
		});

		questions.forEach((q, index) => {
			formDataPost.append(`questions[${index}][id]`, q.id ?? "");
			formDataPost.append(
				`questions[${index}][material_id]`,
				q.material_id ?? "",
			);
			formDataPost.append(
				`questions[${index}][subtopic_id]`,
				q.subtopic_id ?? "",
			);
			formDataPost.append(
				`questions[${index}][quiz_text]`,
				q.question_text ?? "",
			);
			formDataPost.append(`questions[${index}][points]`, q.points ?? "");
			formDataPost.append(
				`questions[${index}][feedback_correct]`,
				q.feedbackCorrect ?? "",
			);
			formDataPost.append(
				`questions[${index}][feedback_incorrect]`,
				q.feedbackIncorrect ?? "",
			);

			appendQuestionImageToFormData(formDataPost, q, index);

			q.options.forEach((opt, optIdx) => {
				formDataPost.append(
					`questions[${index}][options][${optIdx}][text]`,
					opt.text ?? "",
				);
				formDataPost.append(
					`questions[${index}][options][${optIdx}][is_correct]`,
					opt.is_correct ? "1" : "0",
				);
			});

		});

		router.post(route(saveRouteName, quiz.id), formDataPost, {
			forceFormData: true,
			onFinish: () => {
				setSubmitting(false);
			},
			onSuccess: () => {
				setModalState({
					show: true,
					type: "success",
					title: "Berhasil",
					message: "Kuis dan soal berhasil disimpan.",
					confirmText: "Kembali ke detail",
					onConfirm: () => router.visit(route(`${baseRouteName}.show`, quiz.id)),
				});
			},
			onError: (errors) => {
				const reason = getErrorReason(errors);
				setError(reason);

				setModalState({
					show: true,
					type: "error",
					title: "Gagal Menyimpan",
					message: `Gagal menyimpan kuis. ${reason}`,
					confirmText: "Tutup",
				});
			},
		});
	};

	const toggleClass = (id) => {
		setFormData((prev) => ({
			...prev,
			class_ids: prev.class_ids.includes(id)
				? prev.class_ids.filter((c) => c !== id)
				: [...prev.class_ids, id],
		}));
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

	const handleImportCsv = async () => {
		setImportError("");
		setImportSummary("");
		const file = importFileRef.current?.files?.[0];
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

		let skipped = 0;
		const imported = [];
		const importErrors = [];

		parsed.rows.forEach((row, index) => {
			const rowNumber = index + 2;
			const questionText = String(
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.question),
			).trim();
			if (!questionText) {
				skipped += 1;
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
				importErrors.push(
					`Baris ${rowNumber}: opsi jawaban minimal 2.`,
				);
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
				importErrors.push(
					`Baris ${rowNumber}: jawaban tidak valid (isi A/B/C/D atau teks opsi).`,
				);
				skipped += 1;
				return;
			}

			const pointsValue = Number.parseInt(
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.points),
				10,
			);
			const materialName = String(
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.material),
			).trim();
			let material = materialLookup.get(materialName.toLowerCase()) ?? null;
			if (!material && !materialName && (materials ?? []).length === 1) {
				material = materials[0];
			}
			if (!material) {
				importErrors.push(
					`Baris ${rowNumber}: materi "${materialName || "(kosong)"}" tidak ditemukan di kuis ini.`,
				);
				skipped += 1;
				return;
			}
			const subtopicName = String(
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.subtopic),
			).trim();
			const subtopicId = material
				? (material.subtopics ?? [])
					.find(
						(item) =>
							String(item?.name ?? item?.subtopic_name ?? item?.sub_topic_name ?? "")
								.trim()
								.toLowerCase() === subtopicName.toLowerCase(),
					)
					?.id ?? null
				: null;
			if (subtopicName && !subtopicId) {
				importErrors.push(
					`Baris ${rowNumber}: subtopik "${subtopicName}" tidak ditemukan di materi "${material.material_name}".`,
				);
				skipped += 1;
				return;
			}
			const feedbackCorrect = String(
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.feedbackCorrect),
			).trim();
			const feedbackIncorrect = String(
				getCsvValue(row, parsed.normalizedHeaders, csvAliases.feedbackIncorrect),
			).trim();

			imported.push({
				...createEmptyQuestion(),
				question_text: questionText,
				material_id: material?.id ?? "",
				subtopic_id: subtopicId ?? "",
				points: Number.isNaN(pointsValue) ? 10 : pointsValue,
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
			if (importErrors.length > 0) {
				const details = importErrors.slice(0, 5).join("\n");
				const extra = importErrors.length > 5
					? `\n+${importErrors.length - 5} baris lainnya`
					: "";
				setImportError(`Tidak ada baris soal valid.\n${details}${extra}`);
				return;
			}
			setImportError("Tidak ada baris soal valid yang bisa diimpor.");
			return;
		}

		if (importErrors.length > 0) {
			const details = importErrors.slice(0, 5).join("\n");
			const extra = importErrors.length > 5
				? `\n+${importErrors.length - 5} baris lainnya`
				: "";
			setImportError(`Beberapa baris gagal diimpor:\n${details}${extra}`);
		}

		setQuestions((prev) => [...prev, ...imported]);
		setImportSummary(
			`Berhasil impor ${imported.length} soal${skipped ? `, ${skipped} baris dilewati.` : "."}`,
		);
	};



	return (
		<div className="mx-auto space-y-6">
			{/* Kuis Meta */}
			<Card className="rounded-3xl border border-slate-200/80 bg-slate-50/65 p-8 shadow-sm">
				<div className="mb-4">
					<h3 className="text-sm font-semibold text-slate-800">Detail Kuis</h3>
				</div>
				<div className="grid gap-4">
					<div className="space-y-3">
						<label className="text-xs font-medium text-slate-700">
						Kelas yang Mengikuti Kuis
						</label>

						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
						{classes.map((cls) => (
							<CheckboxCard
							key={cls.id}
							label={cls.class_name}
							checked={formData.class_ids.includes(cls.id)}
							onClick={() => toggleClass(cls.id)}
							/>
						))}
						</div>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<Field
							as="input"
							label="Judul Kuis"
							size="sm"
							value={formData.title}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
							placeholder="Masukkan judul kuis"
						/>
						<div className="grid grid-cols-2 gap-3">
							<Field
								as="input"
								type="number"
								label="Durasi (Menit)"
								size="sm"
								min="1"
								value={formData.duration}
								onChange={(e) =>
									setFormData({
										...formData,
											duration: Number(e.target.value) || 0,
										})
								}
							/>
							<Field
								as="input"
								type="number"
								label="Batas Lulus (0-100)"
								size="sm"
								min="0"
								max="100"
								value={formData.passing_score}
								onChange={(e) =>
									setFormData({
										...formData,
											passing_score: Number(e.target.value) || 0,
										})
								}
							/>
						</div>
					</div>
					<Field
					as="textarea"
					name="description"
					label="Deskripsi Kuis (Opsional)"
					value={formData.description}
					onChange={(e) =>
						setFormData({
						...formData,
						description: e.target.value,
						})
					}
					placeholder="Tambahkan instruksi kuis"
					/>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<Field
							as="input"
							type="datetime-local"
							label="Tanggal Dimulai"
							size="sm"
							value={formData.start_at}
							onChange={(e) =>
								setFormData({ ...formData, start_at: e.target.value })
							}
						/>
						<Field
							as="input"
							type="datetime-local"
							label="Tanggal Berakhir"
							size="sm"
							value={formData.end_at}
							onChange={(e) =>
								setFormData({ ...formData, end_at: e.target.value })
							}
						/>
					</div>
				</div>
			</Card>

			<Card className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
					<div>
						<p className="text-xs font-semibold text-slate-800">Import Soal (CSV)</p>
						<p className="text-[11px] text-slate-500">
							Soal pilihan ganda saja. Simpan perubahan setelah impor.
						</p>
					</div>
					<a
						href={route(templateRouteName, { quiz: quiz.id })}
						className="text-[11px] font-medium text-blue-600 hover:underline"
						target="_blank"
						rel="noreferrer"
					>
						Download template kuis
					</a>
				</div>
				<div className="px-5 py-4 space-y-3">
					<input
						ref={importFileRef}
						type="file"
						accept=".csv,text/csv"
						className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
					/>
					<div className="flex flex-wrap items-center gap-3">
						<Button
							type="button"
							variant="outline"
							color="blue"
							size="sm"
							onClick={handleImportCsv}
						>
							Import CSV
						</Button>
						<p className="text-[11px] text-slate-400">
							Kolom wajib: Materi, Pertanyaan, Opsi A-D, Jawaban. Materi & subtopik harus sesuai template.
						</p>
					</div>
					{importError && (
						<p className="text-[11px] text-red-500 whitespace-pre-line">{importError}</p>
					)}
					{importSummary && (
						<p className="text-[11px] text-emerald-600">{importSummary}</p>
					)}
				</div>
			</Card>



			{/* Questions */}
			{questions.length === 0 && (
				<div className="p-8 text-center text-sm text-slate-500">
					Belum ada soal untuk kuis ini.
				</div>
			)}

			{questions.map((q, idx) => (
				<Card
					key={q._localId}
					className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur"
				>
					<div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
						<div className="flex items-center gap-3">
							<span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
								{idx + 1}
							</span>
							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
									MULTIPLE CHOICE
								</p>
								<p className="text-[11px] text-slate-400">
									Atur teks, gambar, dan feedback
								</p>
							</div>
						</div>
						<div className="flex items-center gap-4 text-xs text-slate-500">
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
					<MultipleChoiceQuestionForm
					question={q}
					questionIndex={idx}
					onQuestionFieldChange={updateQuestionField}
					onOptionFieldChange={updateOptionField}
					onSetCorrectOption={setCorrectOption}
					onImageChange={handleQuestionImageChange}
					materials={materials}
					onMaterialChange={(qIdx, materialId) =>
						updateQuestionField(qIdx, "material_id", materialId)
					}
					/>
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
					+ Tambah Soal
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

			<StatusModal
				show={modalState.show}
				type={modalState.type}
				title={modalState.title}
				message={modalState.message}
				confirmText={modalState.confirmText}
				cancelText={modalState.cancelText}
				onConfirm={() => {
					if (modalState.onConfirm) modalState.onConfirm();
					setModalState((prev) => ({ ...prev, show: false }));
				}}
				onCancel={() => {
					if (modalState.onCancel) modalState.onCancel();
					setModalState((prev) => ({ ...prev, show: false }));
				}}
				onClose={() => setModalState((prev) => ({ ...prev, show: false }))}
			/>
		</div>
	);
}
