import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import Card from "@/Components/Card";
import Button from "@/Components/Button";
import Field from "@/Components/Field";
import StatusModal from "@/Components/StatusModal";
import MultipleChoiceQuestionForm from "@/Components/QuestionForm/MultipleChoiceQuestionForm";
import Dropdown from "@/Components/Dropdown";

function createEmptyQuestion() {
	return {
		id: null,
		material_id: "",
		question_text: "",
		points: 10,
		feedbackCorrect: "",
		feedbackIncorrect: "",
		imageUrl: null,
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
			question_text: q.quiz_text ?? q.question_text ?? base.question_text,
			feedbackCorrect: q.feedback_correct ?? q.feedbackCorrect ?? base.feedbackCorrect,
			feedbackIncorrect:
				q.feedback_incorrect ?? q.feedbackIncorrect ?? base.feedbackIncorrect,
			imageUrl: q.image_url ?? q.image_path ?? q.imageUrl ?? base.imageUrl,
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
			question_text: q.question_text ?? "",
			points: Number(q.points ?? 0),
			feedbackCorrect: q.feedbackCorrect ?? "",
			feedbackIncorrect: q.feedbackIncorrect ?? "",
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
		class_id: quiz.class_id || "",
		title: quiz.title || "",
		description: quiz.description || "",
		duration: quiz.duration || 30,
		passing_score: quiz.passing_score || 70,
		start_at: quiz.start_at || "",
		end_at: quiz.end_at || "",
	});

	const [submitting, setSubmitting] = React.useState(false);
	const [duplicating, setDuplicating] = React.useState(false);
	const [error, setError] = React.useState("");

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

	const handleImageUpload = (qIdx, file) => {
		setQuestions((prev) =>
			prev.map((q, i) =>
				i === qIdx
					? {
							...q,
							imageFile: file || null,
							imageUrl: file
								? URL.createObjectURL(file)
								: q.imageUrl ?? null,
						}
					: q,
				),
		);
	};

	const handleSubmit = (e) => {
		e?.preventDefault();

		setSubmitting(true);
		setError("");

		const formDataPost = new FormData();

		formDataPost.append("class_id", formData.class_id || "");
		formDataPost.append("title", formData.title);
		formDataPost.append("description", formData.description || "");
		formDataPost.append("duration", formData.duration);
		formDataPost.append("passing_score", formData.passing_score);
		formDataPost.append("start_at", formData.start_at || "");
		formDataPost.append("end_at", formData.end_at || "");

		questions.forEach((q, index) => {
			formDataPost.append(`questions[${index}][id]`, q.id ?? "");
			formDataPost.append(
				`questions[${index}][material_id]`,
				q.material_id ?? "",
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

			if (q.imageFile) {
				formDataPost.append(`questions[${index}][image]`, q.imageFile);
			}
		});

		router.post(route(saveRouteName, quiz.id), formDataPost, {
			forceFormData: true,
			onSuccess: () => {
				setSubmitting(false);
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
				setSubmitting(false);
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

	const handleDuplicate = () => {
		// Pilih kelas lain selain kelas utama kuis saat ini
		const availableClassIds = classes
			.filter((c) => c.id !== formData.class_id)
			.map((c) => c.id);

		if (!availableClassIds.length) {
			setModalState({
				show: true,
				type: "error",
				title: "Tidak Ada Kelas Lain",
				message:
					"Tidak ada kelas lain yang tersedia untuk duplikasi. Tambah kelas baru terlebih dahulu.",
				confirmText: "Tutup",
			});
			return;
		}

		const classIds = window.prompt(
			"Masukkan ID kelas tujuan, pisahkan dengan koma (contoh: 2,3).\n\n" +
				"Kelas yang sekarang: " +
				(classes.find((c) => c.id === formData.class_id)?.class_name || "(belum dipilih)"),
		);

		if (!classIds) return;

		const parsed = String(classIds)
			.split(",")
			.map((v) => Number(v.trim()))
			.filter((v) => Number.isInteger(v) && v > 0);

		if (!parsed.length) {
			setModalState({
				show: true,
				type: "error",
				title: "Input Tidak Valid",
				message: "Format ID kelas tidak valid.",
				confirmText: "Tutup",
			});
			return;
		}

		setDuplicating(true);

		const role = (authUser?.role || "").toLowerCase();
		const isSuperadmin = role === "superadmin";
		const baseRouteName = isSuperadmin ? "superadmin.quizzes" : "dosen.quizzes";

		router.post(
			route(`${baseRouteName}.duplicate`, quiz.id),
			{ class_ids: parsed },
			{
				onFinish: () => setDuplicating(false),
				onSuccess: () => {
					setModalState({
						show: true,
						type: "success",
						title: "Berhasil Diduplikasi",
						message:
							"Kuis berhasil diduplikasi ke kelas yang dipilih. Cek halaman daftar kuis untuk melihat hasilnya.",
						confirmText: "Tutup",
					});
				},
				onError: (errors) => {
					const reason = getErrorReason(errors);
					setModalState({
						show: true,
						type: "error",
						title: "Gagal Duplikasi",
						message: `Gagal menduplikasi kuis. ${reason}`,
						confirmText: "Tutup",
					});
				},
			},
		);
	};

	return (
		<div className="mx-auto space-y-6">
			<header className="space-y-4 px-2">
				<div className="flex items-center gap-4">
					<div>
						<h1 className="text-xl font-bold text-slate-900">
							{formData.title || quiz.title}
						</h1>
						<p className="text-xs text-slate-600">
							Kelas: {classes.find((c) => c.id === formData.class_id)?.class_name || quiz.class_name}
						</p>
					</div>
				</div>
			</header>

			{/* Kuis Meta */}
			<Card className="rounded-3xl border border-slate-200/80 bg-slate-50/65 p-5 shadow-sm">
				<div className="mb-4">
					<h3 className="text-sm font-semibold text-slate-800">Pengaturan Kuis</h3>
					<p className="text-[11px] text-slate-500">
						Ubah detail utama kuis Anda.
					</p>
				</div>
				<div className="grid gap-4">
					<div className="space-y-1">
						<label className="text-xs font-medium text-slate-700">
							Kelas yang Bisa Mengikuti
						</label>
						<select
							value={formData.class_id}
							onChange={(e) =>
								setFormData({
									...formData,
									class_id: Number(e.target.value) || "",
								})
							}
							className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Pilih kelas</option>
							{classes.map((cls) => (
								<option key={cls.id} value={cls.id}>
									{cls.class_name}
								</option>
							))}
						</select>
						<p className="mt-1 text-[10px] text-slate-400">
							Mahasiswa di kelas ini yang akan melihat dan mengerjakan kuis.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<Field
							as="input"
							label="Judul Kuis"
							value={formData.title}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
							placeholder="Masukkan judul kuis"
						/>
						<div className="grid grid-cols-2 gap-3">
							<Field
								as="input"
								type="number"
								label="Durasi (Menit)"
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
						label="Deskripsi Kuis (Opsional)"
						rows={3}
						value={formData.description}
						onChange={(e) =>
							setFormData({ ...formData, description: e.target.value })
						}
						placeholder="Tambahkan instruksi kuis atau capaian belajar jika perlu..."
					/>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<Field
							as="input"
							type="datetime-local"
							label="Mulai (Opsional)"
							value={formData.start_at}
							onChange={(e) =>
								setFormData({ ...formData, start_at: e.target.value })
							}
						/>
						<Field
							as="input"
							type="datetime-local"
							label="Selesai (Opsional)"
							value={formData.end_at}
							onChange={(e) =>
								setFormData({ ...formData, end_at: e.target.value })
							}
						/>
					</div>
				</div>
			</Card>

			<Card className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-5 shadow-sm">
				<div className="mb-3 flex items-center justify-between gap-3">
					<div>
						<h3 className="text-sm font-semibold text-slate-800">
							Duplikasikan Kuis ke Kelas Lain
						</h3>
						<p className="text-[11px] text-slate-500">
							Salin kuis beserta soal-soalnya ke kelas lain tanpa mengubah kuis ini.
						</p>
					</div>
				</div>
				<div className="text-[11px] text-slate-500">
					<p>
						Ketik ID kelas tujuan saat diminta. Kamu bisa memasukkan lebih dari satu ID
						dengan koma, misalnya: <span className="font-mono">2,3,5</span>.
					</p>
					<p className="mt-1">
						Untuk melihat ID kelas, buka halaman daftar kelas terlebih dahulu.
					</p>
				</div>
				<div className="mt-3 flex justify-end">
					<Button
						type="button"
						variant="outline"
						color="blue"
						size="xs"
						disabled={duplicating}
						onClick={handleDuplicate}
					>
						{duplicating ? "Menduplikasi..." : "Duplikasikan ke Kelas Lain"}
					</Button>
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
								<span>Materi</span>
								<Dropdown className="w-32">
									<Dropdown.Trigger>
										<div className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 bg-white cursor-pointer">
											{materials.find((m) => m.id === q.material_id)?.material_name ||
													"Pilih materi"}
										</div>
									</Dropdown.Trigger>
									<Dropdown.Content align="left" width="48">
										{materials.map((m) => (
											<Dropdown.Item
													key={m.id}
													onClick={() => updateQuestionField(idx, "material_id", m.id)}
													className={
														q.material_id === m.id ? "bg-blue-100 text-blue-900" : ""
													}
											>
												{m.material_name}
											</Dropdown.Item>
										))}
									</Dropdown.Content>
								</Dropdown>
							</div>
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
						onImageChange={handleImageUpload}
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
