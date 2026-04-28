import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { router } from "@inertiajs/react";
import Card from "@/Components/Card";
import Button from "@/Components/Button";
import StatusModal from "@/Components/StatusModal";
import { FaSave } from "react-icons/fa";

function getErrorReason(errors) {
	if (!errors || typeof errors !== "object") return "Gagal membuat kuis. Periksa kembali data yang diisi.";
	const values = Object.values(errors);
	if (values.length === 0) return "Gagal membuat kuis. Periksa kembali data yang diisi.";
	const first = values[0];
	if (typeof first === "string") return first;
	if (Array.isArray(first) && first[0]) return String(first[0]);
	return "Gagal membuat kuis. Periksa kembali data yang diisi.";
}

export default function ManageQuizzesCreate({ classes = [], materials = [], authUser }) {
	const role = (authUser?.role || "").toLowerCase();
	const isSuperadmin = role === "superadmin";
	const backRoute = isSuperadmin ? "superadmin.quizzes.index" : "dosen.quizzes.index";

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
		show: false, type: "success", title: "", message: "",
		confirmText: "OK", cancelText: "", onConfirm: null, onCancel: null,
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
		const routeName = isSuperadmin ? "superadmin.quizzes.store" : "quizzes.store";
		router.post(route(routeName), formData, {
			onSuccess: () => {
				setSaving(false);
				setModalState({
					show: true, type: "success", title: "Berhasil",
					message: "Kuis berhasil dibuat. Kamu akan dialihkan ke halaman pengaturan soal.",
					confirmText: "Tutup", cancelText: "", onConfirm: null, onCancel: null,
				});
			},
			onError: (errors) => {
				setSaving(false);
				const reason = getErrorReason(errors);
				setError(reason);
				setModalState({
					show: true, type: "error", title: "Gagal Membuat Kuis",
					message: `Gagal membuat kuis. ${reason}`,
					confirmText: "Tutup", cancelText: "", onConfirm: null, onCancel: null,
				});
			},
		});
	};

	const handleInputChange = (field, value) =>
		setFormData((prev) => ({ ...prev, [field]: value }));

	const toggleClass = (id) =>
		setFormData((prev) => ({
			...prev,
			class_ids: prev.class_ids.includes(id)
				? prev.class_ids.filter((c) => c !== id)
				: [...prev.class_ids, id],
		}));

	const toggleMaterial = (id) =>
		setFormData((prev) => ({
			...prev,
			material_ids: prev.material_ids.includes(id)
				? prev.material_ids.filter((m) => m !== id)
				: [...prev.material_ids, id],
		}));

	return (
		<AppLayout
			title="Buat Kuis Baru"
			label="Buat Kuis Baru"
			backHref={route(backRoute)}
			backLabel="Kembali ke daftar kuis"
		>
			<div className="mx-auto max-w-3xl space-y-6 pb-10">

				{/* Page header */}
				<div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 sm:p-6">
					<h1 className="text-xl font-semibold tracking-tight text-slate-900">Buat Kuis Baru</h1>
					<p className="mt-1 text-sm text-slate-500">
						Lengkapi detail kuis dan pilih materi yang akan diujikan.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-5">

					{/* ── Section 1: Pilih Kelas ── */}
					<Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
						<div className="px-5 py-4 border-b border-slate-100">
							<h2 className="text-sm font-semibold text-slate-800 border-l-4 border-blue-500 pl-3">
								Pilih Kelas
							</h2>
							<p className="mt-0.5 text-[11px] text-slate-500 pl-3">
								Kuis akan dibuat terpisah untuk setiap kelas yang dipilih.
							</p>
						</div>
						<div className="p-5 space-y-2">
							{classes.length === 0 ? (
								<p className="py-4 text-center text-xs text-slate-400 italic">
									Belum ada kelas yang Anda buat.
								</p>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{classes.map((cls) => {
										const selected = formData.class_ids.includes(cls.id);
										return (
											<button
												key={cls.id}
												type="button"
												onClick={() => toggleClass(cls.id)}
												className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
													selected
														? "border-blue-400 bg-blue-50 text-blue-700"
														: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
												}`}
											>
												<span className="truncate">{cls.class_name}</span>
												<span className={`h-2 w-2 rounded-full flex-shrink-0 ml-2 ${selected ? "bg-blue-500" : "bg-slate-300"}`} />
											</button>
										);
									})}
								</div>
							)}
							<p className="text-[10px] text-slate-400">Minimal pilih satu kelas.</p>
						</div>
					</Card>

					{/* ── Section 2: Detail Utama ── */}
					<Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
						<div className="px-5 py-4 border-b border-slate-100">
							<h2 className="text-sm font-semibold text-slate-800 border-l-4 border-slate-400 pl-3">
								Detail Utama
							</h2>
						</div>
						<div className="p-5 space-y-4">
							{/* Judul */}
							<div className="space-y-1.5">
								<label className="text-xs font-medium text-slate-700">Judul Kuis</label>
								<input
									type="text"
									value={formData.title}
									onChange={(e) => handleInputChange("title", e.target.value)}
									className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all bg-slate-50/50"
									placeholder="Contoh: UTS Pemrograman Berorientasi Objek"
									required
								/>
							</div>

							{/* Durasi & Passing score */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="text-xs font-medium text-slate-700">Durasi (menit)</label>
									<input
										type="number"
										value={formData.duration}
										onChange={(e) => handleInputChange("duration", Number(e.target.value))}
										min="1"
										className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all bg-slate-50/50"
										required
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-medium text-slate-700">Batas Nilai Kelulusan</label>
									<input
										type="number"
										value={formData.passing_score}
										onChange={(e) => handleInputChange("passing_score", Number(e.target.value))}
										min="0" max="100"
										className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all bg-slate-50/50"
										required
									/>
								</div>
							</div>

							{/* Waktu */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="text-xs font-medium text-slate-700">Waktu Mulai</label>
									<input
										type="datetime-local"
										value={formData.start_at}
										onChange={(e) => handleInputChange("start_at", e.target.value)}
										className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all bg-slate-50/50"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-medium text-slate-700">Waktu Selesai</label>
									<input
										type="datetime-local"
										value={formData.end_at}
										onChange={(e) => handleInputChange("end_at", e.target.value)}
										className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all bg-slate-50/50"
									/>
								</div>
							</div>
						</div>
					</Card>

					{/* ── Section 3: Pilih Materi ── */}
					<Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
						<div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
							<div>
								<h2 className="text-sm font-semibold text-slate-800 border-l-4 border-emerald-500 pl-3">
									Pilih Materi Kuis
								</h2>
								<p className="mt-0.5 text-[11px] text-slate-500 pl-3">Materi yang akan diujikan dalam kuis ini.</p>
							</div>
							{formData.material_ids.length > 0 && (
								<span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
									{formData.material_ids.length} dipilih
								</span>
							)}
						</div>
						<div className="p-5 space-y-2">
							{materials.length === 0 ? (
								<p className="py-8 text-center text-xs text-slate-400 italic">
									Belum ada materi. Silakan buat materi terlebih dahulu.
								</p>
							) : (
								<div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
									{materials.map((m) => {
										const isSelected = formData.material_ids.includes(m.id);
										return (
											<div
												key={m.id}
												onClick={() => toggleMaterial(m.id)}
												className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
													isSelected
														? "bg-emerald-50/60 border-emerald-200"
														: "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
												}`}
											>
												<div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
													isSelected ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white"
												}`}>
													{isSelected && (
														<svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
															<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
														</svg>
													)}
												</div>
												<span className={`text-sm font-medium truncate ${isSelected ? "text-emerald-900" : "text-slate-700"}`}>
													{m.material_name}
												</span>
											</div>
										);
									})}
								</div>
							)}
							<p className="text-[10px] text-slate-400 italic pt-1">
								Materi yang dipilih tidak dapat diubah setelah kuis dibuat.
							</p>
						</div>
					</Card>

					{/* ── Error ── */}
					{error && (
						<div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
							<svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
							<p className="text-xs text-red-600 font-medium">{error}</p>
						</div>
					)}

					{/* ── Submit ── */}
					<div className="flex justify-end pt-2">
						<Button
							type="submit"
							color="blue"
							variant="solid"
							size="lg"
							leftIcon={<FaSave className="h-4 w-4" />}
							className="rounded-full px-8 shadow-sm"
							disabled={saving}
						>
							{saving ? "Membuat Kuis..." : "Buat Kuis & Lanjut"}
						</Button>
					</div>
				</form>
			</div>

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
		</AppLayout>
	);
}
