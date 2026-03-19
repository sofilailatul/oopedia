import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link, router } from "@inertiajs/react";
import Button from "@/Components/Button";
import Card from "@/Components/Card";
import { FaEye, FaPen, FaTrash } from "react-icons/fa";
import { difficultyLabel } from "@/Features/practice/labels";
import { usePopup } from "@/Components/PopUp/PopUpProvider";

function logAction(action, detail = {}) {
	console.log("[Latsol]", { action, ...detail });
}

function getPracticeLogContext(practice) {
	if (!practice) return {};

	return {
		practiceId: practice.id,
		materialName: practice.material_name,
		levelLabel: difficultyLabel(practice.difficulty_level),
		totalQuestions: Number(practice.total_questions ?? 0),
	};
}

export default function DosenPracticesIndex({ practices = [], materials = [] }) {
	return (
		<AppLayout title="Kelola Latihan Soal" label="Kelola Latihan Soal">
			<PageContent practices={practices} materials={materials} />
		</AppLayout>
	);
}

function PageContent({ practices = [], materials = [] }) {
	const [deleting, setDeleting] = React.useState(false);
	const popup = usePopup();

	const handleOpenCreate = () => {
		popup.open({
			title: "Buat Latihan Soal",
			size: "lg",
			content: (
				<div className="p-6">
					<CreatePracticeModal
						materials={materials}
						practices={practices}
						onClose={() => popup.close()}
					/>
				</div>
			),
		});
	};

	const handleConfirmDelete = (practiceToDelete) => {
		if (!practiceToDelete || deleting) return;
		logAction("confirm_delete", {
			...getPracticeLogContext(practiceToDelete),
		});

		setDeleting(true);
		router.delete(route("practices.destroy", practiceToDelete.id), {
			onSuccess: () => {
				setDeleting(false);
				console.log("[Latsol]", {
					action: "delete_result",
					success: true,
					reason: "delete_success",
					...getPracticeLogContext(practiceToDelete),
				});
				popup.alert({
					title: "Berhasil",
					message: `Latihan untuk materi "${practiceToDelete.material_name}" level ${difficultyLabel(
						practiceToDelete.difficulty_level,
					)} berhasil dihapus.`,
					confirmText: "Tutup",
				});
			},
			onError: (errors) => {
				setDeleting(false);
				console.error("[Latsol]", {
					action: "delete_result",
					success: false,
					reason: "delete_failed",
					errors,
					...getPracticeLogContext(practiceToDelete),
				});
			},
		});
	};

	const handleOpenDelete = (practice) => {
		if (!practice || deleting) return;

		logAction("open_delete_confirmation", {
			...getPracticeLogContext(practice),
		});

		popup.confirm({
			title: "Hapus Latihan Soal",
			message: `Yakin ingin menghapus latihan untuk materi "${practice.material_name}" level ${difficultyLabel(
				practice.difficulty_level,
			)}?`,
			confirmText: deleting ? "Menghapus..." : "Hapus",
			cancelText: "Batal",
			onConfirm: () => handleConfirmDelete(practice),
		});
	};

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<div className="rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="space-y-1">
						<h1 className="text-xl font-semibold tracking-tight text-slate-900">Daftar Latihan Soal</h1>
						<p className="text-sm text-slate-500">Atur, lihat, dan Update Latihan Soal Yang Dibuat</p>
					</div>
					<Button
						variant="solid"
						color="yellow"
						size="md"
						className="rounded-full bg-white text-slate-900 hover:bg-slate-100 border-none shadow-sm"
						onClick={(e) => {
							e.preventDefault();
							logAction("click_create_button");
							handleOpenCreate();
						}}
					>
						+ Buat Latihan Baru
					</Button>
			</div>
			</div>
			{/* Table */}
			<Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
								<th className="px-5 py-3 w-16 text-left">No</th>
								<th className="px-5 py-3 text-left">Materi</th>
								<th className="px-5 py-3 text-left">Level</th>
								<th className="px-5 py-3 text-center">Jumlah Soal</th>
								<th className="px-5 py-3 w-40 text-center">Aksi</th>
							</tr>
						</thead>
						<tbody>
							{practices.length > 0 ? (
								practices.map((practice, idx) => (
									<tr
										key={practice.id}
										className="group border-t border-slate-100/80 bg-white hover:bg-slate-50/80 transition-colors"
									>
										<td className="px-5 py-3 align-middle text-xs text-slate-500">
											<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
												{idx + 1}
											</span>
										</td>
										<td className="px-5 py-3 align-middle">
											<span className="text-sm font-semibold text-slate-900 group-hover:text-slate-950">
												{practice.material_name}
											</span>
											<p className="mt-0.5 text-[11px] text-slate-400">
												Level latihan untuk materi ini
											</p>
										</td>
										<td className="px-5 py-3 align-middle text-sm text-slate-700">
											<span
												className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium
													${
														practice.difficulty_level === "easy"
															? "bg-emerald-50 text-emerald-700 border border-emerald-100"
														: practice.difficulty_level === "normal"
															? "bg-blue-50 text-blue-700 border border-blue-100"
															: "bg-purple-50 text-purple-700 border border-purple-100"
													}`}
											>
												<span className="h-1.5 w-1.5 rounded-full bg-current" />
												{difficultyLabel(practice.difficulty_level)}
											</span>
										</td>
										<td className="px-5 py-3 align-middle text-center text-sm text-slate-700">
											<span className="inline-flex items-center justify-center rounded-full bg-slate-50 px-3 py-1 text-[12px] font-medium text-slate-700 border border-slate-100">
												{practice.total_questions} soal
											</span>
										</td>
										<td className="px-5 py-3 align-middle">
											<div className="flex items-center justify-center gap-2">
												<Button
													as={Link}
													href={route("dosen.practices.show", practice.id)}
													color="blue"
													variant="ghost"
													size="sm"
													leftIcon={<FaEye className="h-3 w-3" />}
													onClick={() =>
														logAction("open_latsol_detail", {
															...getPracticeLogContext(practice),
														})
													}
												>
													Lihat
												</Button>
												<Button
													as={Link}
													href={route("dosen.practices.edit", practice.id)}
													color="blue"
													variant="outline"
													size="sm"
													leftIcon={<FaPen className="h-3 w-3" />}
													onClick={() =>
														logAction("open_latsol_edit", {
															...getPracticeLogContext(practice),
														})
													}
												>
													Edit
												</Button>
												<Button
													type="button"
													color="red"
													variant="outline"
																size="sm"
																leftIcon={<FaTrash className="h-3 w-3" />}
													onClick={() => {
														logAction("click_delete", {
															...getPracticeLogContext(practice),
														});
														handleOpenDelete(practice);
													}}
												>
													Hapus
												</Button>
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan="5"
										className="px-5 py-10 text-center text-sm text-slate-400"
									>
										Belum ada latihan soal untuk materi yang Anda buat.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</Card>

		</div>
	);
}

function CreatePracticeModal({ materials = [], practices = [], onClose }) {
	const [selectedMaterialId, setSelectedMaterialId] = React.useState("");
	const [selectedLevel, setSelectedLevel] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState("");

	const existingMap = React.useMemo(() => {
		const map = {};
		practices.forEach((p) => {
			if (!map[p.material_id]) {
				map[p.material_id] = new Set();
			}
			map[p.material_id].add(p.difficulty_level);
		});
		return map;
	}, [practices]);

	const levels = [
		{ value: "easy", label: difficultyLabel("easy") },
		{ value: "normal", label: difficultyLabel("normal") },
		{ value: "hard", label: difficultyLabel("hard") },
	];

	const handleSubmit = (e) => {
		e?.preventDefault();
		logAction("submit_create_practice", {
			materialId: selectedMaterialId,
			level: selectedLevel,
		});

		if (!selectedMaterialId || !selectedLevel) {
			setError("Pilih materi dan level terlebih dahulu.");
			console.warn("[Latsol]", {
				action: "create_result",
				success: false,
				reason: "material_or_level_not_selected",
			});
			return;
		}

		setSubmitting(true);
		setError("");

		router.post(
			route("practices.store"),
			{
				material_id: selectedMaterialId,
				difficulty_level: selectedLevel,
			},
			{
				onSuccess: () => {
					setSubmitting(false);
					console.log("[Latsol]", {
						action: "create_result",
						success: true,
						reason: "create_success",
						materialId: selectedMaterialId,
						level: selectedLevel,
					});
					onClose?.();
				},
				onError: (errors) => {
					setSubmitting(false);
					console.error("[Latsol]", {
						action: "create_result",
						success: false,
						reason: "create_failed",
						errors,
						materialId: selectedMaterialId,
						level: selectedLevel,
					});
					setError(
						errors?.difficulty_level ||
							"Gagal membuat latihan. Periksa isian Anda.",
					);
				},
			},
		);
	};

	const currentLevels = selectedMaterialId
		? existingMap[Number(selectedMaterialId)] ?? new Set()
		: new Set();

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-1">
				<p className="text-[11px] font-medium text-slate-500">Pilih Materi</p>
				<select
					value={selectedMaterialId}
					onChange={(e) => {
						setSelectedMaterialId(e.target.value);
						setSelectedLevel("");
					}}
					className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
				>
					<option value="">Pilih materi</option>
					{materials.map((m) => (
						<option key={m.id} value={m.id}>
							{m.material_name}
						</option>
					))}
				</select>
			</div>

			<div className="space-y-1">
				<p className="text-[11px] font-medium text-slate-500">Pilih Level Soal</p>
				<div className="grid grid-cols-3 gap-2">
					{levels.map((lvl) => {
						const isUsed = currentLevels.has(lvl.value);
						const isSelected = selectedLevel === lvl.value;
						return (
							<button
								key={lvl.value}
								type="button"
								disabled={isUsed}
								onClick={() => {
									if (isUsed) {
										console.warn("[Latsol]", {
											action: "select_level_result",
											success: false,
											reason: "level_already_used",
											level: lvl.value,
										});
										return;
									}
									logAction("select_level", {
										level: lvl.value,
									});
									setSelectedLevel(lvl.value);
								}}
								className={`rounded-xl border px-3 py-2 text-xs font-medium transition
									${isUsed
										? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
										: isSelected
										? "border-slate-900 bg-slate-900 text-white"
										: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}
								`}
							>
								{lvl.label}
							</button>
						);
					})}
				</div>
			</div>

			{error && <p className="text-[11px] text-red-500">{error}</p>}

			<div className="flex items-center justify-end gap-2 pt-2">
				<Button
					type="button"
					variant="ghost"
					color="blue"
					size="sm"
						onClick={() => {
							// logAction("close_create_modal");
							onClose?.();
						}}
				>
					Batal
				</Button>
				<Button
					type="submit"
					color="blue"
					variant="solid"
					size="sm"
					disabled={submitting}
				>
					{submitting ? "Menyimpan..." : "Lanjut"}
				</Button>
			</div>
		</form>
	);
}


