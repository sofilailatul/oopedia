import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link, router, usePage } from "@inertiajs/react";
import Button from "@/Components/Button";
import Card from "@/Components/Card";
import Dropdown from "@/Components/Dropdown";
import { FaEye, FaPen, FaTrash, FaSearch, FaTimes } from "react-icons/fa";
import TextInput from "@/Components/TextInput";
import { usePopup } from "@/Components/PopUp/PopUpProvider";

function levelLabel(level, type) {
	if (type === "pretest") return "Pretest";

	if (level === "easy") return "Easy";
	if (level === "medium") return "Medium";
	if (level === "hard") return "Hard";

	return "-";
}

function logAction(action, detail = {}) {
	console.log("[Latsol]", { action, ...detail });
}

function getPracticeLogContext(practice) {
	if (!practice) return {};

	return {
		practiceId: practice.id,
		materialName: practice.material_name,
		levelLabel: levelLabel(practice.level, practice.type),
		totalQuestions: Number(practice.total_questions ?? 0),
	};
}

export default function ManagePracticesIndex({ practices = [], materials = [], authUser }) {
	const page = usePage();
	const user = authUser || page.props?.auth?.user || {};
	const role = (user.role || "").toLowerCase();

	return (
		<AppLayout title="Kelola Latihan Soal" label="Kelola Latihan Soal">
			<PageContent
				practices={practices}
				materials={materials}
				role={role}
			/>
		</AppLayout>
	);
}

function PageContent({ practices = [], materials = [], role }) {
	const isDosen = role === "dosen";
	const isSuperadmin = role === "superadmin";
	const [deleting, setDeleting] = React.useState(false);
	const popup = usePopup();
	const [searchQuery, setSearchQuery] = React.useState("");

	const filteredPractices = React.useMemo(() => {
		return practices.filter((p) =>
			(p.material_name || "").toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [practices, searchQuery]);

	const groupedPractices = React.useMemo(() => {
		const groups = {};
		filteredPractices.forEach((practice) => {
			const key = practice.material_id || practice.material_name;
			if (!groups[key]) {
				groups[key] = {
					material_name: practice.material_name,
					practices: [],
				};
			}
			groups[key].practices.push(practice);
		});
		return Object.values(groups);
	}, [filteredPractices]);

	const handleOpenCreate = () => {
		if (!isDosen && !isSuperadmin) return;

		popup.open({
			title: "Buat Latihan Soal",
			size: "lg",
			content: (
				<div className="p-6">
					<CreatePracticeModal
						materials={materials}
						practices={practices}
						storeRouteName={storeRouteName}
						onClose={() => popup.close()}
					/>
				</div>
			),
		});
	};

	const handleConfirmDelete = (practiceToDelete) => {
		if ((!isDosen && !isSuperadmin) || !practiceToDelete || deleting) return;

		logAction("confirm_delete", {
			...getPracticeLogContext(practiceToDelete),
		});

		setDeleting(true);

		router.delete(route(destroyRouteName, practiceToDelete.id), {
			onSuccess: () => {
				setDeleting(false);
				popup.alert({
					title: "Berhasil",
					message: `Latihan untuk materi "${practiceToDelete.material_name}" level ${levelLabel(
						practiceToDelete.level,
						practiceToDelete.type
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
		if ((!isDosen && !isSuperadmin) || !practice || deleting) return;

		popup.confirm({
			title: "Hapus Latihan Soal",
			message: `Yakin ingin menghapus latihan untuk materi "${practice.material_name}" level ${levelLabel(
				practice.level,
				practice.type,
			)}?`,
			confirmText: deleting ? "Menghapus..." : "Hapus",
			cancelText: "Batal",
			onConfirm: () => handleConfirmDelete(practice),
		});
	};

	const showRouteName = isSuperadmin ? "superadmin.practices.show" : "dosen.practices.show";
	const editRouteName = isSuperadmin ? "superadmin.practices.edit" : "dosen.practices.edit";
	const destroyRouteName = isSuperadmin ? "superadmin.practices.destroy" : "dosen.practices.destroy";
	const storeRouteName = isSuperadmin ? "superadmin.practices.store" : "dosen.practices.store";

	return (
		<div className="mx-auto space-y-6">
			<div className="rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="space-y-1">
						<h1 className="text-xl font-semibold tracking-tight text-slate-900">
							Daftar Latihan Soal
						</h1>
						<p className="text-sm text-slate-500">
							Atur, lihat, dan update latihan soal yang dibuat
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
						<div className="relative w-full sm:w-64">
							<FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
							<TextInput
								placeholder="Cari material..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="!pl-10 !py-2 !rounded-full border-slate-200 !text-xs !h-10 bg-white/50 focus:bg-white transition-all shadow-sm"
							/>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery("")}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
								>
									<FaTimes className="text-xs" />
								</button>
							)}
						</div>

						{(isDosen || isSuperadmin) && (
							<Button
								variant="solid"
								color="yellow"
								size="md"
								className="rounded-full bg-white text-slate-900 hover:bg-slate-100 border-none shadow-sm whitespace-nowrap"
								onClick={(e) => {
									e.preventDefault();
									handleOpenCreate();
								}}
							>
								+ Buat Latihan Baru
							</Button>
						)}
					</div>
				</div>
			</div>

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
						{groupedPractices.length > 0 ? (
							groupedPractices.map((group, groupIdx) => (
								<React.Fragment key={groupIdx}>
									{group.practices.map((practice, idx) => (
										<tr
											key={practice.id}
											className={`group bg-white hover:bg-slate-50/80 transition-colors ${idx === 0 ? "border-t border-slate-200" : ""}`}
										>
											{idx === 0 && (
												<td className="px-5 py-4 align-top text-xs text-slate-500 border-r border-slate-100" rowSpan={group.practices.length}>
													<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
														{groupIdx + 1}
													</span>
												</td>
											)}

											{idx === 0 && (
												<td className="px-5 py-4 align-top border-r border-slate-100" rowSpan={group.practices.length}>
													<span className="text-sm font-bold text-slate-900">
														{group.material_name}
													</span>
												</td>
											)}

											<td className={`px-5 py-3 align-middle text-sm text-slate-700 ${idx !== 0 ? "border-t border-slate-100/50" : ""}`}>
												<span
													className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium shadow-sm ${
														practice.level === "easy"
															? "bg-emerald-50 text-emerald-700 border border-emerald-100"
															: practice.level === "medium"
															? "bg-blue-50 text-blue-700 border border-blue-100"
															: "bg-purple-50 text-purple-700 border border-purple-100"
													}`}
												>
													<span className="h-1.5 w-1.5 rounded-full bg-current" />
													{levelLabel(practice.level, practice.type)}
												</span>
											</td>

											<td className={`px-5 py-3 align-middle text-center text-sm text-slate-700 ${idx !== 0 ? "border-t border-slate-100/50" : ""}`}>
												<span className="inline-flex items-center justify-center rounded-full bg-white px-3 py-1 text-[12px] font-medium text-slate-700 border border-slate-200 shadow-sm">
													{practice.total_questions} soal
												</span>
											</td>

											<td className={`px-5 py-3 align-middle ${idx !== 0 ? "border-t border-slate-100/50" : ""}`}>
												<div className="flex items-center justify-center gap-2">
													{isDosen || isSuperadmin ? (
														<>
															<Button
																as={Link}
																href={route(showRouteName, practice.id)}
																color="blue"
																variant="ghost"
																size="sm"
																leftIcon={<FaEye className="h-3 w-3" />}
																className="rounded-lg"
															>
																Lihat
															</Button>

															<Button
																as={Link}
																href={route(editRouteName, practice.id)}
																color="blue"
																variant="outline"
																size="sm"
																leftIcon={<FaPen className="h-3 w-3" />}
																className="rounded-lg"
															>
																Edit
															</Button>

															<Button
																type="button"
																color="red"
																variant="outline"
																size="sm"
																leftIcon={<FaTrash className="h-3 w-3" />}
																className="rounded-lg"
																onClick={() => handleOpenDelete(practice)}
															>
																Hapus
															</Button>
														</>
													) : (
														<span className="text-xs text-slate-400">
															Aksi hanya untuk pengguna berwenang
														</span>
													)}
												</div>
											</td>
										</tr>
									))}
								</React.Fragment>
							))
						) : (
							<tr>
								<td
									colSpan="5"
									className="px-5 py-12 text-center text-sm text-slate-400"
								>
									<div className="flex flex-col items-center justify-center gap-2">
										<span className="text-3xl mb-1">📭</span>
										<p>Belum ada latihan soal untuk materi yang Anda buat.</p>
									</div>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</Card>
		</div>
	);
}

function CreatePracticeModal({ materials = [], practices = [], storeRouteName, onClose }) {
	const [selectedMaterialId, setSelectedMaterialId] = React.useState("");
	const [selectedType, setSelectedType] = React.useState("practice");
	const [selectedLevel, setSelectedLevel] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState("");

	const existingMap = React.useMemo(() => {
		const map = {};
		practices.forEach((p) => {
			const mId = Number(p.material_id);
			if (!map[mId]) {
				map[mId] = { practice: new Set(), pretest: false };
			}
			const type = p.type || "practice";
			if (type === "pretest") {
				map[mId].pretest = true;
			} else {
				map[mId].practice.add(p.level);
			}
		});
		return map;
	}, [practices]);

	const levels = [
		{ value: "easy", label: levelLabel("easy", "practice") },
		{ value: "medium", label: levelLabel("medium", "practice") },
		{ value: "hard", label: levelLabel("hard", "practice") },
	];

	const isMaterialFullyConfigured = React.useCallback(
		(materialId) => {
			const config = existingMap[Number(materialId)] || { practice: new Set(), pretest: false };
			return config.pretest && levels.every((lvl) => config.practice.has(lvl.value));
		},
		[existingMap],
	);

	const handleSubmit = (e) => {
		e.preventDefault();

		if (!selectedMaterialId) {
			setError("Pilih materi terlebih dahulu.");
			return;
		}

		if (selectedType === "practice" && !selectedLevel) {
			setError("Pilih level untuk latihan soal.");
			return;
		}

		setSubmitting(true);
		setError("");

		router.post(
			route(storeRouteName),
			{
				material_id: selectedMaterialId,
				type: selectedType,
				level: selectedType === "pretest" ? null : selectedLevel,
			},
			{
				onSuccess: () => {
					setSubmitting(false);
					onClose?.();
				},
				onError: (errors) => {
					setSubmitting(false);
					setError(errors?.type || errors?.level || "Gagal membuat latihan.");
				},
			},
		);
	};

	const config = selectedMaterialId
		? existingMap[Number(selectedMaterialId)] || { practice: new Set(), pretest: false }
		: { practice: new Set(), pretest: false };

	const isPretestExists = config.pretest;
	const usedLevels = config.practice;

	const selectedMaterialIsFull = selectedMaterialId
		? isMaterialFullyConfigured(selectedMaterialId)
		: false;

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-1">
				<p className="text-[11px] font-medium text-slate-500">Pilih Materi</p>
				<Dropdown className="w-full">
					<Dropdown.Trigger>
						<div className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 flex items-center justify-between bg-white">
							<span className={selectedMaterialId ? "text-slate-800" : "text-slate-400"}>
								{selectedMaterialId
									? materials.find((m) => String(m.id) === String(selectedMaterialId))?.material_name || "Pilih materi"
									: "Pilih materi"}
							</span>
							<span className="text-slate-400">▾</span>
						</div>
					</Dropdown.Trigger>

					<Dropdown.Content
						align="left"
						width="64"
						contentClasses="py-2 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-64 overflow-y-auto"
					>
						{materials.length === 0 ? (
							<div className="px-4 py-2 text-xs text-slate-400">
								Belum ada materi tersedia
							</div>
						) : (
							materials.map((m) => {
								const isSelected = String(selectedMaterialId) === String(m.id);
								const isDisabled = isMaterialFullyConfigured(m.id);

								return (
									<button
										key={m.id}
										type="button"
										disabled={isDisabled}
										onClick={() => {
											if (isDisabled) return;
											setSelectedMaterialId(String(m.id));
											setSelectedLevel("");
										}}
										className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
											isDisabled
												? "bg-slate-50 text-slate-300 cursor-not-allowed"
												: ""
										} ${
											isSelected
												? "bg-rose-100/70 text-rose-600"
												: "text-slate-700"
										}`}
									>
										<div className="flex items-center justify-between gap-2">
											<span>{m.material_name}</span>
											{isDisabled && (
												<span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
													Lengkap
												</span>
											)}
										</div>
									</button>
								);
							})
						)}
					</Dropdown.Content>
				</Dropdown>

				{selectedMaterialIsFull && (
					<p className="text-[11px] text-amber-600">
						Materi ini sudah memiliki semua level latihan (Easy, Medium, Hard).
					</p>
				)}
			</div>

			<div className="space-y-1">
				<p className="text-[11px] font-medium text-slate-500">Pilih Tipe</p>
				<div className="flex gap-2">
					<button
						type="button"
						disabled={selectedType === "practice" && isPretestExists && isMaterialFullyConfigured(selectedMaterialId)}
						onClick={() => {
							setSelectedType("practice");
							setSelectedLevel("");
						}}
						className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition ${
							selectedType === "practice"
								? "border-slate-900 bg-slate-900 text-white"
								: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
						}`}
					>
						Practice (Latihan)
					</button>
					<button
						type="button"
						disabled={isPretestExists}
						onClick={() => {
							setSelectedType("pretest");
							setSelectedLevel("");
						}}
						className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition ${
							isPretestExists
								? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
								: selectedType === "pretest"
								? "border-slate-900 bg-slate-900 text-white"
								: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
						}`}
					>
						Pre-test {isPretestExists && "(Sudah ada)"}
					</button>
				</div>
			</div>

			<div className={`space-y-1 transition-opacity ${selectedType === "pretest" ? "opacity-50 pointer-events-none" : ""}`}>
				<p className="text-[11px] font-medium text-slate-500">Pilih Level Soal {selectedType === "pretest" && "(Tidak berlaku untuk Pre-test)"}</p>
				<div className="grid grid-cols-3 gap-2">
					{levels.map((lvl) => {
						const isUsed = usedLevels.has(lvl.value);
						const isSelected = selectedLevel === lvl.value;

						return (
							<button
								key={lvl.value}
								type="button"
								disabled={isUsed || selectedType === "pretest"}
								onClick={() => {
									if (isUsed) return;
									setSelectedLevel(lvl.value);
								}}
								className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
									isUsed
										? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
										: isSelected
										? "border-slate-900 bg-slate-900 text-white"
										: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
								}`}
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
					onClick={() => onClose?.()}
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
