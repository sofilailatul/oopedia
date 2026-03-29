import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import Card from "@/Components/Card";
import Button from "@/Components/Button";
import StatusModal from "@/Components/StatusModal";
import { FaSave } from "react-icons/fa";

function getErrorReason(errors) {
	if (!errors || typeof errors !== "object") {
		return "Gagal membuat kuis. Periksa kembali data yang diisi.";
	}

	const values = Object.values(errors);
	if (values.length === 0) {
		return "Gagal membuat kuis. Periksa kembali data yang diisi.";
	}

	const first = values[0];
	if (typeof first === "string") return first;
	if (Array.isArray(first) && first[0]) return String(first[0]);

	return "Gagal membuat kuis. Periksa kembali data yang diisi.";
}

export default function DosenQuizCreate({ classes = [], materials = [] }) {
	const [formData, setFormData] = React.useState({
		class_ids: [],
		title: "",
		duration: 60,
		passing_score: 60,
		start_at: "",
		end_at: "",
		material_ids: [],
	});

	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState("");
	const [modalState, setModalState] = React.useState({
		show: false,
		type: "success",
		title: "",
		message: "",
		confirmText: "OK",
		cancelText: "",
		onConfirm: null,
		onCancel: null,
	});

	const handleSubmit = (e) => {
		e.preventDefault();

		if (!formData.class_ids.length || !formData.title.trim()) {
			setError("Pilih minimal satu kelas dan isi judul kuis terlebih dahulu.");
			return;
		}

		if (formData.material_ids.length === 0) {
			setError("Pilih minimal satu materi untuk kuis ini.");
			return;
		}

		setSaving(true);
		setError("");

		router.post(route("quizzes.store"), formData, {
			onSuccess: () => {
				setSaving(false);
				setModalState({
					show: true,
					type: "success",
					title: "Berhasil",
					message: "Kuis berhasil dibuat. Kamu akan dialihkan ke halaman pengaturan soal.",
					confirmText: "Tutup",
					cancelText: "",
					onConfirm: null,
					onCancel: null,
				});
			},
			onError: (errors) => {
				setSaving(false);
				const reason = getErrorReason(errors);
				setError(reason);
				setModalState({
					show: true,
					type: "error",
					title: "Gagal Membuat Kuis",
					message: `Gagal membuat kuis. ${reason}`,
					confirmText: "Tutup",
					cancelText: "",
					onConfirm: null,
					onCancel: null,
				});
			},
		});
	};

	const handleInputChange = (field, value) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
	};

	const toggleClass = (id) => {
		setFormData(prev => {
			const currentIds = prev.class_ids;
			if (currentIds.includes(id)) {
				return { ...prev, class_ids: currentIds.filter(cid => cid !== id) };
			} else {
				return { ...prev, class_ids: [...currentIds, id] };
			}
		});
	};

	const toggleMaterial = (id) => {
		setFormData(prev => {
			const currentIds = prev.material_ids;
			if (currentIds.includes(id)) {
				return { ...prev, material_ids: currentIds.filter(mid => mid !== id) };
			} else {
				return { ...prev, material_ids: [...currentIds, id] };
			}
		});
	};

	return (
		<AppLayout
			title="Buat Kuis Baru"
			label="Buat Kuis Baru"
			backHref={route("dosen.quizzes.index")}
			backLabel="Kembali ke daftar kuis"
		>
			<div className="pb-10">
				<Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
					<div className="p-8">
						<header className="mb-8">
							<h1 className="text-xl font-bold text-slate-900">Buat Kuis Baru</h1>
							<p className="text-sm text-slate-500 mt-1">Lengkapi detail kuis dan pilih materi yang akan diujikan.</p>
						</header>

						<form onSubmit={handleSubmit} className="space-y-8">
							{/* Section 1: Detail Utama */}
							<div className="space-y-5">
								<h3 className="text-sm font-semibold text-slate-800 border-l-4 border-blue-500 pl-3">Detail Utama</h3>
								
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-700">Pilih Kelas (bisa lebih dari satu)</label>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50/40">
										{classes.length === 0 ? (
											<div className="col-span-full py-4 text-center text-[11px] text-slate-400 italic">
												Belum ada kelas yang Anda buat.
											</div>
										) : (
											classes.map((cls) => {
												const selected = formData.class_ids.includes(cls.id);
												return (
													<button
														key={cls.id}
														type="button"
														onClick={() => toggleClass(cls.id)}
														className={`flex items-center justify-between rounded-xl border px-3 py-2 text-[11px] font-medium transition-all ${
															selected
																? "border-blue-500 bg-blue-50 text-blue-700"
																: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
														}`}
													>
														<span className="truncate">{cls.class_name}</span>
														<span className={`h-2 w-2 rounded-full ${selected ? "bg-blue-600" : "bg-slate-300"}`} />
													</button>
												);
											})
										)}
									</div>
									<p className="text-[10px] text-slate-400 mt-1">Minimal pilih satu kelas.</p>
								</div>

								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-700">Judul Kuis</label>
									<input
										type="text"
										value={formData.title}
										onChange={(e) => handleInputChange("title", e.target.value)}
										className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50/50"
										placeholder="Masukkan judul kuis"
										required
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-1">
										<label className="text-xs font-medium text-slate-700">Durasi (menit)</label>
										<input
											type="number"
											value={formData.duration}
											onChange={(e) => handleInputChange("duration", Number(e.target.value))}
											min="1"
											className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50/50"
											required
										/>
									</div>

									<div className="space-y-1">
										<label className="text-xs font-medium text-slate-700">Nilai Kelulusan (%)</label>
										<input
											type="number"
											value={formData.passing_score}
											onChange={(e) => handleInputChange("passing_score", Number(e.target.value))}
											min="0"
											max="100"
											className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50/50"
											required
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-1">
										<label className="text-xs font-medium text-slate-700">Waktu Mulai</label>
										<input
											type="datetime-local"
											value={formData.start_at}
											onChange={(e) => handleInputChange("start_at", e.target.value)}
											className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50/50"
										/>
									</div>

									<div className="space-y-1">
										<label className="text-xs font-medium text-slate-700">Waktu Selesai</label>
										<input
											type="datetime-local"
											value={formData.end_at}
											onChange={(e) => handleInputChange("end_at", e.target.value)}
											className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50/50"
										/>
									</div>
								</div>
							</div>

							{/* Section 2: Pilih Materi (Critical Part) */}
							<div className="space-y-5 pt-4">
								<div className="flex items-center justify-between">
									<h3 className="text-sm font-semibold text-slate-800 border-l-4 border-emerald-500 pl-3">Pilih Materi Kuis</h3>
									<span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase tracking-wider font-bold">
										Materi Terpilih: {formData.material_ids.length}
									</span>
								</div>
								
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50/30">
									{materials.length === 0 ? (
										<div className="col-span-full py-8 text-center text-slate-400 text-xs italic">
											Belum ada materi yang tersedia. Silakan buat materi terlebih dahulu.
										</div>
									) : (
										materials.map((m) => {
											const isSelected = formData.material_ids.includes(m.id);
											return (
												<div 
													key={m.id}
													onClick={() => toggleMaterial(m.id)}
													className={`
														group relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200
														${isSelected 
															? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100 shadow-sm' 
															: 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
														}
													`}
												>
													<div className={`
														flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors
														${isSelected ? 'bg-blue-600 border-blue-600 shadow-sm' : 'border-slate-300 bg-white group-hover:border-slate-400'}
													`}>
														{isSelected && (
															<svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
																<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
															</svg>
														)}
													</div>
													<div className="min-w-0 flex-1">
														<p className={`text-[11px] font-medium truncate ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
															{m.material_name}
														</p>
													</div>
												</div>
											);
										})
									)}
								</div>
								<p className="text-[10px] text-slate-400 italic">Materi yang dipilih tidak dapat diubah setelah kuis dibuat.</p>
							</div>

							{error && (
								<div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
									<div className="mt-0.5 text-red-500">
										<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
										</svg>
									</div>
									<p className="text-xs text-red-600 font-medium">{error}</p>
								</div>
							)}

							<div className="flex justify-end pt-4 border-t border-slate-50">
								<Button
									type="submit"
									color="blue"
									variant="solid"
									size="lg"
									className="rounded-xl px-8 shadow-blue-200 shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all"
									leftIcon={<FaSave className="h-4 w-4" />}
									disabled={saving}
								>
									{saving ? "Membuat Kuis..." : "Buat Kuis & Lanjut"}
								</Button>
							</div>
						</form>
					</div>
				</Card>

				<StatusModal
					show={modalState.show}
					type={modalState.type}
					title={modalState.title}
					message={modalState.message}
					confirmText={modalState.confirmText}
					cancelText={modalState.cancelText}
					onConfirm={() => {
						if (modalState.onConfirm) modalState.onConfirm();
						setModalState(prev => ({ ...prev, show: false }));
					}}
					onCancel={() => {
						if (modalState.onCancel) modalState.onCancel();
						setModalState(prev => ({ ...prev, show: false }));
					}}
					onClose={() => setModalState(prev => ({ ...prev, show: false }))}
				/>
			</div>
		</AppLayout>
	);
}
