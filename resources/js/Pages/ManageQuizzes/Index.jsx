import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link, router, usePage } from "@inertiajs/react";
import Button from "@/Components/Button";
import Card from "@/Components/Card";
import { FaEye, FaPen, FaTrash, FaPlus } from "react-icons/fa";
import { usePopup } from "@/Components/PopUp/PopUpProvider";

export default function ManageQuizzesIndex({ quizzes = [], classes = [], authUser }) {
	const page = usePage();
	const user = authUser || page.props?.auth?.user || {};
	const role = (user.role || "").toLowerCase();
	const isSuperadmin = role === "superadmin";
	const isDosen = role === "dosen";

	const baseRouteName = isSuperadmin ? "superadmin.quizzes" : "dosen.quizzes";
	const destroyRouteName = isSuperadmin ? "superadmin.quizzes.destroy" : "quizzes.destroy";
	const showRouteName = `${baseRouteName}.show`;
	const editRouteName = `${baseRouteName}.edit`;

	const [deleting, setDeleting] = React.useState(false);
	const popup = usePopup();

	const handleConfirmDelete = (quiz) => {
		if (!quiz || deleting) return;
		setDeleting(true);
		router.delete(route(destroyRouteName, quiz.id), {
			onSuccess: () => {
				setDeleting(false);
				popup.alert({
					title: "Berhasil",
					message: `Kuis "${quiz.title}" berhasil dihapus.`,
					confirmText: "Tutup",
				});
			},
			onError: () => setDeleting(false),
		});
	};

	const handleOpenDelete = (quiz) => {
		if (!quiz || deleting) return;
		popup.confirm({
			title: "Hapus Kuis",
			message: `Yakin ingin menghapus kuis "${quiz.title}"?`,
			confirmText: deleting ? "Menghapus..." : "Hapus",
			cancelText: "Batal",
			onConfirm: () => handleConfirmDelete(quiz),
		});
	};

	return (
		<AppLayout title="Kelola Kuis" label="Kelola Kuis">
			<div className="mx-auto space-y-6">
				{/* Header card */}
				<div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-5 sm:p-6">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div className="space-y-1">
							<h1 className="text-xl font-semibold tracking-tight text-slate-900">Daftar Kuis</h1>
							<p className="text-sm text-slate-500">Atur, lihat, dan kelola kuis yang dibuat.</p>
						</div>
						{(isDosen || isSuperadmin) && (
							<Button
								as={Link}
								href={route(`${baseRouteName}.create`)}
								color="blue"
								variant="solid"
								size="md"
								leftIcon={<FaPlus className="h-3.5 w-3.5" />}
								className="rounded-full shadow-sm"
							>
								Buat Kuis Baru
							</Button>
						)}
					</div>
				</div>

				{/* Table card */}
				<Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
								<th className="px-5 py-3 w-16 text-center">No</th>
								<th className="px-5 py-3 text-left">Judul Kuis</th>
								<th className="px-5 py-3 text-left">Kelas</th>
								<th className="px-5 py-3 text-center">Jumlah Soal</th>
								<th className="px-5 py-3 w-48 text-center">Aksi</th>
							</tr>
						</thead>
						<tbody>
							{quizzes.length > 0 ? (
								quizzes.map((quiz, idx) => (
									<tr
										key={quiz.id}
										className="group border-t border-slate-100/80 bg-white hover:bg-slate-50/80 transition-colors"
									>
										{/* No */}
										<td className="px-5 py-3 align-middle text-xs text-slate-500 text-center">
											<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
												{idx + 1}
											</span>
										</td>

										{/* Title */}
										<td className="px-5 py-3 align-middle">
											<span className="text-sm font-semibold text-slate-900 group-hover:text-slate-950">
												{quiz.title}
											</span>
											<p className="mt-0.5 text-[11px] text-slate-400">
												Durasi: {quiz.duration} menit
											</p>
										</td>

										{/* Classes */}
										<td className="px-5 py-3 align-middle">
											<div className="flex flex-wrap gap-1">
												{(quiz.classes || []).map((cls) => (
													<span
														key={cls.id}
														className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100"
													>
														<span className="h-1.5 w-1.5 rounded-full bg-current" />
														{cls.class_name}
													</span>
												))}
											</div>
										</td>

										{/* Question count */}
										<td className="px-5 py-3 align-middle text-center">
											<span className="inline-flex items-center justify-center rounded-full bg-slate-50 px-3 py-1 text-[12px] font-medium text-slate-700 border border-slate-100">
												{quiz.total_questions ?? 0} soal
											</span>
										</td>

										{/* Actions */}
										<td className="px-5 py-3 align-middle">
											{(isDosen || isSuperadmin) ? (
												<div className="flex items-center justify-center gap-1.5">
													<Button
														as={Link}
														href={route(showRouteName, quiz.id)}
														color="blue"
														variant="ghost"
														size="sm"
														leftIcon={<FaEye className="h-3 w-3" />}
													>
														Lihat
													</Button>
													<Button
														as={Link}
														href={route(editRouteName, quiz.id)}
														color="blue"
														variant="outline"
														size="sm"
														leftIcon={<FaPen className="h-3 w-3" />}
													>
														Edit
													</Button>
													<Button
														type="button"
														color="red"
														variant="outline"
														size="sm"
														leftIcon={<FaTrash className="h-3 w-3" />}
														onClick={() => handleOpenDelete(quiz)}
														disabled={deleting}
													>
														Hapus
													</Button>
												</div>
											) : (
												<span className="text-xs text-slate-400 block text-center">—</span>
											)}
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="5" className="px-5 py-10 text-center text-sm text-slate-400">
										Belum ada kuis yang Anda buat.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</Card>
			</div>
		</AppLayout>
	);
}
