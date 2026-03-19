import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link, router } from "@inertiajs/react";
import Button from "@/Components/Button";
import Card from "@/Components/Card";
import { FaEye, FaPen, FaTrash } from "react-icons/fa";

function logAction(action, detail = {}) {
	console.log("[Quiz]", { action, ...detail });
}

function getQuizLogContext(quiz) {
	if (!quiz) return {};

	return {
		quizId: quiz.id,
		title: quiz.title,
		className: quiz.class_name,
		totalQuestions: Number(quiz.total_questions ?? 0),
	};
}

export default function DosenQuizzesIndex({ quizzes = [], classes = [] }) {
	return (
		<AppLayout title="Kelola Kuis" label="Kelola Kuis">
			<PageContent quizzes={quizzes} classes={classes} />
		</AppLayout>
	);
}

function PageContent({ quizzes = [], classes = [] }) {
	const [deleting, setDeleting] = React.useState(false);

	const handleOpenCreate = () => {
		router.visit(route("dosen.quizzes.create"));
	};

	const handleConfirmDelete = (quizToDelete) => {
		if (!quizToDelete || deleting) return;
		logAction("confirm_delete", {
			...getQuizLogContext(quizToDelete),
		});

		setDeleting(true);
		router.delete(route("quizzes.destroy", quizToDelete.id), {
			onSuccess: () => {
				setDeleting(false);
				console.log("[Quiz]", {
					action: "delete_result",
					success: true,
					reason: "delete_success",
					...getQuizLogContext(quizToDelete),
				});
				popup.alert({
					title: "Berhasil",
					message: `Kuis "${quizToDelete.title}" berhasil dihapus.`,
					confirmText: "Tutup",
				});
			},
			onError: (errors) => {
				setDeleting(false);
				console.error("[Quiz]", {
					action: "delete_result",
					success: false,
					reason: "delete_failed",
					errors,
					...getQuizLogContext(quizToDelete),
				});
			},
		});
	};

	const handleOpenDelete = (quiz) => {
		if (!quiz || deleting) return;

		logAction("open_delete_confirmation", {
			...getQuizLogContext(quiz),
		});

		popup.confirm({
			title: "Hapus Kuis",
			message: `Yakin ingin menghapus kuis "${quiz.title}"?`,
			confirmText: deleting ? "Menghapus..." : "Hapus",
			cancelText: "Batal",
			onConfirm: () => handleConfirmDelete(quiz),
		});
	};

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<div className="rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="space-y-1">
						<h1 className="text-lg font-semibold tracking-tight text-slate-900">Daftar Kuis</h1>
						<p className="text-xs text-slate-500">Atur, lihat, dan Update Kuis Yang Dibuat</p>
					</div>
					<Button
						as={Link}
						href={route("dosen.quizzes.create")}
						variant="solid"
						color="yellow"
						size="md"
						className="rounded-full bg-white text-slate-900 hover:bg-slate-100 border-none shadow-sm"
					>
						+ Buat Kuis Baru
					</Button>
				</div>
			</div>
			{/* Table */}
			<Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<table className="w-full text-left text-sm">
					<thead>
						<tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
							<th className="px-5 py-3 w-16 text-left">No</th>
							<th className="px-5 py-3 text-left">Judul Kuis</th>
							<th className="px-5 py-3 text-left">Kelas</th>
							<th className="px-5 py-3 text-center">Jumlah Soal</th>
							<th className="px-5 py-3 w-40 text-center">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{quizzes.length > 0 ? (
							quizzes.map((quiz, idx) => (
								<tr
									key={quiz.id}
									className="group border-t border-slate-100/80 bg-white hover:bg-slate-50/80 transition-colors"
								>
									<td className="px-5 py-3 align-middle text-xs text-slate-500">
										<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
											{idx + 1}
										</span>
									</td>
									<td className="px-5 py-3 align-middle">
										<span className="text-sm font-semibold text-slate-900 group-hover:text-slate-950">
											{quiz.title}
										</span>
										<p className="mt-0.5 text-[11px] text-slate-400">
											Durasi: {quiz.duration} menit
										</p>
									</td>
									<td className="px-5 py-3 align-middle text-sm text-slate-700">
										<span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
											<span className="h-1.5 w-1.5 rounded-full bg-current" />
											{quiz.class_name}
										</span>
									</td>
									<td className="px-5 py-3 align-middle text-center text-sm text-slate-700">
										<span className="inline-flex items-center justify-center rounded-full bg-slate-50 px-3 py-1 text-[12px] font-medium text-slate-700 border border-slate-100">
											{quiz.total_questions} soal
										</span>
									</td>
									<td className="px-5 py-3 align-middle">
										<div className="flex items-center justify-center gap-2">
											<Button
												as={Link}
												href={route("dosen.quizzes.show", quiz.id)}
												color="blue"
												variant="ghost"
												size="sm"
												leftIcon={<FaEye className="h-3 w-3" />}
												onClick={() =>
													logAction("open_quiz_detail", {
														...getQuizLogContext(quiz),
													})
												}
											>
												Lihat
											</Button>
											<Button
												as={Link}
												href={route("dosen.quizzes.edit", quiz.id)}
												color="blue"
												variant="outline"
												size="sm"
												leftIcon={<FaPen className="h-3 w-3" />}
												onClick={() =>
													logAction("open_quiz_edit", {
														...getQuizLogContext(quiz),
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
														...getQuizLogContext(quiz),
													});
													handleOpenDelete(quiz);
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
									Belum ada kuis yang Anda buat.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</Card>
		</div>
	);
}
