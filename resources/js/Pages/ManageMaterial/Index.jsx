import React, { useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link, router } from "@inertiajs/react";
import { FaPlus, FaPen, FaEye, FaChevronUp, FaChevronDown, FaLock, FaTrash } from "react-icons/fa";
import Button from "@/Components/Button";
import Card from "@/Components/Card";
import StatusModal from "@/Components/StatusModal";
import Modal from "@/Components/Modal";
import { useDosenMaterialsIndex } from "@/Features/materials/useDosenMaterialsIndex";

export default function ManageMaterialsIndex({ authUser, materials = [] }) {
	const role = (authUser?.role || "").toLowerCase();
	const baseRole = role === "superadmin" ? "superadmin" : "dosen";

	const routeShowName = `${baseRole}.materials.show`;
	const routeEditName = `${baseRole}.materials.edit`;
	const routeDestroyName = `${baseRole}.materials.destroy`;
	const createRouteName = `${baseRole}.materials.store`;

	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [successMessage, setSuccessMessage] = useState("Operasi berhasil dilakukan.");
	const [showErrorModal, setShowErrorModal] = useState(false);
	const [errorTitle, setErrorTitle] = useState("Terjadi Kesalahan");
	const [errorMessage, setErrorMessage] = useState("");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [materialName, setMaterialName] = useState("");
	const [subTopics, setSubTopics] = useState([{ id: Date.now(), name: "" }]);
	const [isCreating, setIsCreating] = useState(false);

	// State untuk delete
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [materialToDelete, setMaterialToDelete] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleOrderSuccess = () => {
		setSuccessMessage("Urutan materi telah berhasil diubah dan tersimpan pada sistem.");
		setShowSuccessModal(true);
	};

	const handleOrderError = (message) => {
		setErrorTitle('Oops, Gagal Mengubah Urutan!');
		setErrorMessage(message);
		setShowErrorModal(true);
	};

	const { state, view, actions } = useDosenMaterialsIndex({
		authUser,
		materials,
		onOrderSuccess: handleOrderSuccess,
		onOrderError: handleOrderError,
	});
	const { currentPage, perPage, isSavingOrder, totalMaterials } = state;
	const { paginated } = view;
	const { moveUp, moveDown } = actions;

	const handleCreateMaterial = () => {
		if (!materialName.trim()) {
			setErrorTitle('Validasi Gagal');
			setShowErrorModal(true);
			setErrorMessage('Nama materi wajib diisi.');
			return;
		}

		const cleanedSubTopics = subTopics
			.map((item) => item.name.trim())
			.filter((name) => name.length > 0);

		if (cleanedSubTopics.length === 0) {
			setErrorTitle('Validasi Gagal');
			setShowErrorModal(true);
			setErrorMessage('Minimal satu subtopic wajib diisi.');
			return;
		}

		setIsCreating(true);
		router.post(
			route(createRouteName),
			{
				material_name: materialName,
				sub_topics: cleanedSubTopics,
				create_mode: true,
			},
			{
				preserveScroll: true,
				onFinish: () => setIsCreating(false),
				onSuccess: () => {
					setShowCreateModal(false);
					setMaterialName("");
					setSubTopics([{ id: Date.now(), name: "" }]);
				},
				onError: (errors) => {
					setErrorTitle('Gagal Membuat Materi');
					const firstMessage = Object.values(errors || {})?.[0];
					setErrorMessage(Array.isArray(firstMessage) ? firstMessage[0] : firstMessage || 'Gagal membuat materi.');
					setShowErrorModal(true);
				},
			},
		);
	};

	const openDeleteModal = (material) => {
		setMaterialToDelete(material);
		setShowDeleteModal(true);
	};

	const handleDeleteMaterial = () => {
		if (!materialToDelete) return;
		setIsDeleting(true);
		router.delete(route(routeDestroyName, materialToDelete.id), {
			preserveScroll: true,
			onFinish: () => setIsDeleting(false),
			onSuccess: () => {
				setShowDeleteModal(false);
				setMaterialToDelete(null);
				setSuccessMessage(`Materi "${materialToDelete?.material_name}" beserta semua latihan soal terkait berhasil dihapus.`);
				setShowSuccessModal(true);
			},
			onError: () => {
				setShowDeleteModal(false);
				setErrorTitle('Gagal Menghapus Materi');
				setErrorMessage('Terjadi kesalahan saat menghapus materi. Silakan coba lagi.');
				setShowErrorModal(true);
			},
		});
	};

	return (
		<AppLayout title="Kelola Materi" label="Kelola Materi">
			<div className="mx-auto space-y-6">
				<div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div className="space-y-1">
							<h1 className="text-xl font-semibold tracking-tight text-slate-900">Daftar Materi</h1>
							<p className="text-sm text-slate-500">Atur materi, lihat dan update detail materi.</p>
						</div>

						<Button
							color="blue"
							variant="solid"
							size="md"
							leftIcon={<FaPlus className="h-3.5 w-3.5" />}
							className="rounded-full shadow-sm"
							onClick={() => setShowCreateModal(true)}
						>
							Tambah Materi
						</Button>
					</div>
				</div>

				{/* Table card */}
				<Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
								<th className="px-5 py-3 w-24 text-center">Urutan</th>
								<th className="px-5 py-3 text-left">Materi</th>
								<th className="px-5 py-3 w-44 text-center">Aksi</th>
							</tr>
						</thead>
						<tbody>
							{paginated.length > 0 ? (
								paginated.map((material, idx) => (
									<tr
										key={material.id}
										className="group border-t border-slate-100/80 bg-white hover:bg-slate-50/80 transition-colors"
									>
										<td className="px-5 py-3 align-middle text-xs text-slate-500">
											<div className="flex items-center justify-center gap-3">
												<div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
													<button
														type="button"
														onClick={() => {
															moveUp((currentPage - 1) * perPage + idx);
														}}
														disabled={(currentPage - 1) * perPage + idx === 0 || isSavingOrder || material.is_locked || paginated[idx - 1]?.is_locked}
														className="text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded active:scale-75 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all p-1"
														title={material.is_locked ? "Terkunci" : "Geser ke Atas"}
													>
														<FaChevronUp className="w-2.5 h-2.5" />
													</button>
													<button
														type="button"
														onClick={() => {
															moveDown((currentPage - 1) * perPage + idx);
														}}
														disabled={(currentPage - 1) * perPage + idx === totalMaterials - 1 || isSavingOrder || material.is_locked || paginated[idx + 1]?.is_locked}
														className="text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded active:scale-75 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all p-1"
														title={material.is_locked ? "Terkunci" : "Geser ke Bawah"}
													>
														<FaChevronDown className="w-2.5 h-2.5" />
													</button>
												</div>
												<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100/80 text-[11px] font-bold text-slate-600 shadow-sm border border-slate-200/50">
													{(currentPage - 1) * perPage + idx + 1}
												</span>
											</div>
										</td>
										<td className="px-5 py-3 align-middle">
											<div className="flex flex-col">
												<span className="text-sm font-medium text-slate-900 group-hover:text-slate-950 flex items-center gap-2">
													{material.material_name}
													{material.is_locked && (
														<span title="Sudah diakses mahasiswa" className="text-slate-400">
															<FaLock className="w-2.5 h-2.5" />
														</span>
													)}
												</span>
												{typeof material.order_number === "number" && (
													<span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
														<span className="inline-flex h-4 rounded-full bg-slate-100 px-2 text-[10px] uppercase tracking-wide text-slate-600">
															Materi ke-{material.order_number}
														</span>
													</span>
												)}
											</div>
										</td>
										<td className="px-5 py-3 align-middle text-right">
											<div className="inline-flex items-center gap-1">
												<Button
													as={Link}
													href={route(routeShowName, material.id)}
													color="green"
													variant="outline"
													size="sm"
													leftIcon={<FaEye className="h-3 w-3" />}
												>
													Lihat
												</Button>
												<Button
													as={Link}
													href={route(routeEditName, material.id)}
													color="blue"
													variant="outline"
													size="sm"
													leftIcon={<FaPen className="h-3 w-3" />}
													title={material.is_locked ? "Konten bisa diedit, urutan tidak bisa diubah" : "Edit materi"}
												>
													Edit
												</Button>
												<Button
													type="button"
													color="red"
													variant="outline"
													size="sm"
													leftIcon={<FaTrash className="h-3 w-3" />}
													onClick={() => openDeleteModal(material)}
													title="Hapus materi beserta semua latihan soal terkait"
												>
													Hapus
												</Button>
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="3" className="px-5 py-10 text-center text-sm text-slate-400">
										Belum ada materi. Yuk mulai buat materi pertamamu ✨
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</Card>
			</div>

			{/* Modal Sukses */}
			<StatusModal
				show={showSuccessModal}
				type="success"
				title="Berhasil"
				message={successMessage}
				onClose={() => setShowSuccessModal(false)}
				onConfirm={() => setShowSuccessModal(false)}
				confirmText="Mengerti"
			/>

			{/* Modal Error */}
			<StatusModal
				show={showErrorModal}
				type="danger"
				title={errorTitle}
				message={errorMessage}
				onClose={() => setShowErrorModal(false)}
				onConfirm={() => setShowErrorModal(false)}
				confirmText="Tutup"
			/>

			{/* Modal Konfirmasi Hapus */}
			<Modal show={showDeleteModal} maxWidth="md" onClose={() => !isDeleting && setShowDeleteModal(false)}>
				<div className="p-6 space-y-5">
					<div className="flex items-start gap-4">
						<div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
							<FaTrash className="h-5 w-5 text-red-600" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-slate-900">Hapus Materi?</h3>
							<p className="mt-1 text-sm text-slate-500">
								Anda akan menghapus materi{" "}
								<span className="font-semibold text-slate-700">
									"{materialToDelete?.material_name}"
								</span>
								.
							</p>
						</div>
					</div>

					<div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 space-y-1">
						<p className="font-semibold">⚠️ Tindakan ini tidak dapat dibatalkan!</p>
						<p>Semua data berikut akan ikut terhapus permanen:</p>
						<ul className="mt-1 ml-4 list-disc space-y-0.5 text-red-600">
							<li>Latihan soal yang terkait dengan materi ini</li>
							<li>Semua pertanyaan (questions) dalam latihan soal</li>
							<li>Semua pilihan jawaban (options) dan item drag-drop</li>
							<li>Riwayat pengerjaan mahasiswa (attempts &amp; answers)</li>
							<li>Subtopik dan konten materi</li>
							<li>Progres belajar mahasiswa untuk materi ini</li>
						</ul>
					</div>

					<div className="flex justify-end gap-3 pt-1">
						<Button
							color="grey"
							variant="outline"
							onClick={() => setShowDeleteModal(false)}
							disabled={isDeleting}
						>
							Batal
						</Button>
						<Button
							color="red"
							variant="solid"
							onClick={handleDeleteMaterial}
							disabled={isDeleting}
							leftIcon={<FaTrash className="h-3.5 w-3.5" />}
						>
							{isDeleting ? "Menghapus..." : "Ya, Hapus Permanen"}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Modal Buat Materi */}
			<Modal show={showCreateModal} maxWidth="lg" onClose={() => setShowCreateModal(false)}>
				<div className="p-6 space-y-5">
					<div>
						<h3 className="text-lg font-semibold text-slate-900">Buat Materi Baru</h3>
						<p className="mt-1 text-sm text-slate-500">Isi nama materi dan subtopic awal untuk memulai drafting.</p>
					</div>

					<div className="space-y-4">
						<div className="space-y-2">
							<label className="text-sm font-medium text-slate-700">Nama Materi</label>
							<input
								type="text"
								value={materialName}
								onChange={(e) => setMaterialName(e.target.value)}
								className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-300"
								placeholder="Contoh: Pengenalan OOP"
							/>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between gap-3">
								<label className="text-sm font-medium text-slate-700">Subtopic</label>
								<Button
									type="button"
									size="sm"
									color="grey"
									variant="outline"
									onClick={() => setSubTopics((prev) => [...prev, { id: Date.now() + prev.length, name: "" }])}
								>
									Tambah Subtopic
								</Button>
							</div>

							<div className="space-y-3">
								{subTopics.map((item, index) => (
									<div key={item.id} className="flex items-center gap-3">
										<input
											type="text"
											value={item.name}
											onChange={(e) =>
												setSubTopics((prev) =>
													prev.map((subTopic) =>
														subTopic.id === item.id ? { ...subTopic, name: e.target.value } : subTopic,
													),
												)
											}
											className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-300"
											placeholder={`Contoh subtopic ${index + 1}`}
										/>
										<Button
											type="button"
											size="sm"
											color="red"
											variant="outline"
											onClick={() => {
												setSubTopics((prev) => prev.length === 1 ? prev : prev.filter((subTopic) => subTopic.id !== item.id));
											}}
											disabled={subTopics.length === 1}
										>
											Hapus
										</Button>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button color="grey" variant="outline" onClick={() => setShowCreateModal(false)}>
							Batal
						</Button>
						<Button color="blue" variant="solid" onClick={handleCreateMaterial} disabled={isCreating}>
							{isCreating ? 'Membuat...' : 'Lanjut'}
						</Button>
					</div>
				</div>
			</Modal>
		</AppLayout>
	);
}
