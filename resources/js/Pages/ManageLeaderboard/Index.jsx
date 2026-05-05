import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import Card from "@/Components/Card";
import Button from "@/Components/Button";
import { router, Link } from "@inertiajs/react";
import { usePopup } from "@/Components/PopUp/PopUpProvider";

export default function ManageLeaderboardIndex({ authUser, classes = [], selectedClassId = null, classDetail = null }) {
	const role = (authUser?.role || "").toLowerCase();
	const isSuperadmin = role === "superadmin";

	return (
		<AppLayout title="Nilai Mahasiswa" label="Nilai Mahasiswa">
			<div className="mx-auto max-w-7xl space-y-6 pb-10">
				<HeaderSection />
				<ContentSection
					classes={classes}
					selectedClassId={selectedClassId}
					classDetail={classDetail}
					isSuperadmin={isSuperadmin}
				/>
			</div>
		</AppLayout>
	);
}

function EditQuizScoreModal({
	classId,
	student,
	quiz,
	fetchRouteName,
	updateRouteName,
	onSaved,
}) {
	const popup = usePopup();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [materials, setMaterials] = useState([]);
	const [totalScore, setTotalScore] = useState(0);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		let mounted = true;
		setLoading(true);
		setError("");

		window.axios
			.get(route(fetchRouteName, { class: classId, student: student.id, quiz: quiz.id }))
			.then((res) => {
				if (!mounted) return;
				const data = res.data || {};
				setTotalScore(Number(data.total_score ?? 0));
				setMaterials(
					(data.materials || []).map((item) => ({
						material_id: item.material_id,
						material_name: item.material_name,
						earned_score: Number(item.earned_score ?? 0),
						max_score: Number(item.max_score ?? 0),
					}))
				);
			})
			.catch(() => {
				if (mounted) setError("Gagal memuat data quiz.");
			})
			.finally(() => {
				if (mounted) setLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, [classId, student?.id, quiz?.id, fetchRouteName]);

	const handleChange = (index, field, value) => {
		setMaterials((prev) =>
			prev.map((item, idx) =>
				idx === index ? { ...item, [field]: Number(value) } : item
			)
		);
	};

	const computedTotal = useMemo(() => {
		return materials.reduce((sum, item) => sum + (Number(item.earned_score) || 0), 0);
	}, [materials]);

	const handleSave = async () => {
		if (saving) return;
		setSaving(true);
		setError("");

		try {
			await window.axios.put(
				route(updateRouteName, { class: classId, student: student.id, quiz: quiz.id }),
				{
					total_score: Number(totalScore),
					materials: materials.map((item) => ({
						material_id: item.material_id,
						earned_score: Number(item.earned_score) || 0,
						max_score: Number(item.max_score) || 0,
					})),
				}
			);

			popup.alert({
				type: "success",
				title: "Berhasil",
				message: "Nilai quiz berhasil diperbarui.",
				onClose: () => popup.close(),
			});
			onSaved?.();
		} catch (err) {
			setError("Gagal menyimpan nilai quiz.");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-10 gap-2">
				<div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin" />
				<p className="text-xs text-slate-400">Memuat data quiz...</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
				<p className="text-xs font-semibold text-slate-500">Mahasiswa</p>
				<p className="text-sm font-semibold text-slate-800">
					{student?.nama} <span className="text-slate-400">•</span> {quiz?.title}
				</p>
			</div>

			<div>
				<label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Total Score</label>
				<input
					type="number"
					min="0"
					className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
					value={totalScore}
					onChange={(e) => setTotalScore(e.target.value)}
				/>
				<p className="mt-1 text-[11px] text-slate-400">Total otomatis dari materi: {computedTotal}</p>
			</div>

			<div className="overflow-x-auto">
				<table className="min-w-full text-xs">
					<thead>
						<tr className="text-slate-500">
							<th className="text-left py-2">Materi</th>
							<th className="text-center py-2">Skor</th>
							<th className="text-center py-2">Maks</th>
							<th className="text-center py-2">%</th>
						</tr>
					</thead>
					<tbody>
						{materials.length === 0 ? (
							<tr>
								<td colSpan={4} className="py-3 text-center text-slate-400">Tidak ada materi di quiz ini.</td>
							</tr>
						) : (
							materials.map((item, idx) => {
								const maxScore = Number(item.max_score) || 0;
								const percent = maxScore > 0
									? Math.round((Number(item.earned_score || 0) / maxScore) * 100)
									: 0;

								return (
									<tr key={item.material_id} className="border-t border-slate-100">
										<td className="py-2 text-slate-700">{item.material_name}</td>
										<td className="py-2 text-center">
											<input
												type="number"
												min="0"
												className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-center"
												value={item.earned_score}
												onChange={(e) => handleChange(idx, "earned_score", e.target.value)}
											/>
										</td>
										<td className="py-2 text-center">
											<input
												type="number"
												min="0"
												className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-center"
												value={item.max_score}
												onChange={(e) => handleChange(idx, "max_score", e.target.value)}
											/>
										</td>
										<td className="py-2 text-center font-semibold text-slate-600">{percent}</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			{error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600">{error}</p>}

			<div className="flex items-center justify-end gap-2">
				<button
					type="button"
					className="rounded-xl border border-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-600"
					onClick={() => popup.close()}
				>
					Batal
				</button>
				<button
					type="button"
					disabled={saving}
					className="rounded-xl bg-slate-900 px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-60"
					onClick={handleSave}
				>
					{saving ? "Menyimpan..." : "Simpan"}
				</button>
			</div>
		</div>
	);
}

function HeaderSection() {
	return (
		<Card className="rounded-2xl border border-slate-200/80 bg-white px-6 py-5 shadow-sm">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="space-y-1">
					<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-500">Insight Kelas</p>
					<h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Nilai Mahasiswa per Kelas</h1>
					<p className="text-xs text-slate-500">
						Pantau performa latihan dan kuis mahasiswa di setiap kelas.
					</p>
				</div>
			</div>
		</Card>
	);
}

function ContentSection({ classes, selectedClassId, classDetail, isSuperadmin }) {
	if (!classes || classes.length === 0) {
		return (
			<Card className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 py-14 text-center">
				<p className="text-sm font-semibold text-slate-800">Belum ada kelas</p>
				<p className="mt-1 max-w-md text-xs text-slate-500">
					Buat kelas terlebih dahulu, kemudian minta mahasiswa bergabung untuk melihat rekap nilai mereka.
				</p>
			</Card>
		);
	}

	return (
		<div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)]">
			<ClassList classes={classes} selectedClassId={selectedClassId} isSuperadmin={isSuperadmin} />
			<ScoreTable classDetail={classDetail} isSuperadmin={isSuperadmin} />
		</div>
	);
}

function ClassList({ classes, selectedClassId, isSuperadmin }) {
	const handleSelect = (id) => {
		if (!id || id === selectedClassId) return;

		const routeName = isSuperadmin ? "grades.index" : "dosen.grades.index";
		router.get(route(routeName), { class_id: id }, {
			preserveScroll: true,
			preserveState: true,
		});
	};

	return (
		<Card className="h-full rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
			<div className="mb-3 flex items-center justify-between gap-2">
				<div>
					<h2 className="text-sm font-semibold text-slate-900">Daftar Kelas</h2>
					<p className="text-[11px] text-slate-500">Pilih kelas untuk melihat rekap nilai.</p>
				</div>
				<span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
					{classes.length} Kelas
				</span>
			</div>
			<div className="mt-1 space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
				{classes.map((cls) => {
					const isActive = selectedClassId === cls.id;
					const studentsCount = cls.students_count ?? cls.users_count ?? 0;
					return (
						<button
							key={cls.id}
							type="button"
							onClick={() => handleSelect(cls.id)}
							className={[
								"flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-xs transition-all",
								isActive
									? "border-slate-900 bg-slate-900 text-white shadow-sm"
									: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
							].join(" ")}
						>
							<div className="min-w-0 flex-1">
								<p className="truncate text-[13px] font-semibold">{cls.class_name}</p>
								<p className={"truncate text-[10px] " + (isActive ? "text-slate-100/90" : "text-slate-500")}>
									Kode: {cls.class_code}
								</p>
							</div>
							<div className="shrink-0 text-right">
								<p className={"text-[11px] font-semibold " + (isActive ? "text-emerald-300" : "text-slate-600")}>
									{studentsCount} mhs
								</p>
								<p className={"text-[10px] " + (isActive ? "text-slate-200" : "text-slate-400")}>
									Lihat nilai
								</p>
							</div>
						</button>
					);
				})}
			</div>
		</Card>
	);
}

function ScoreTable({ classDetail, isSuperadmin }) {
  const popup = usePopup();

	if (!classDetail) {
		return (
			<Card className="h-full rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
				Pilih salah satu kelas di sebelah kiri untuk melihat rekap nilai mahasiswa.
			</Card>
		);
	}

	const quizzes = classDetail.quizzes || [];
	const students = classDetail.students || [];
	const classRouteName = isSuperadmin ? "classes.index" : "dosen.classes.index";
	const gradeShowRouteName = isSuperadmin ? "grades.show" : "dosen.grades.show";
	const exportRouteName = isSuperadmin ? "grades.export" : "dosen.grades.export";
	const quizFetchRouteName = isSuperadmin ? "grades.quiz.latest" : "dosen.grades.quiz.latest";
	const quizUpdateRouteName = isSuperadmin ? "grades.quiz.update" : "dosen.grades.quiz.update";
	const exportPath = isSuperadmin
		? route("grades.export")
		: route("dosen.grades.export");

	const openEditQuiz = (student, quiz) => {
		popup.open({
			title: "Edit nilai quiz",
			size: "lg",
			content: (
				<EditQuizScoreModal
					classId={classDetail.id}
					student={student}
					quiz={quiz}
					fetchRouteName={quizFetchRouteName}
					updateRouteName={quizUpdateRouteName}
					onSaved={() => router.reload({ only: ["classDetail"] })}
				/>
			),
		});
	};

	return (
		<Card className="h-full rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
			<div className="mb-1 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-sm font-semibold text-slate-900">{classDetail.class_name}</h2>
					<p className="text-[11px] text-slate-500">
						Kode kelas {classDetail.class_code} &bull; {students.length} mahasiswa &bull; {quizzes.length} kuis
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<a
						href={`${exportPath}?class_id=${classDetail.id}`}
						className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-700"
						target="_blank"
						rel="noreferrer"
					>
						<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						Export Excel
					</a>
					<Button
						as="a"
						variant="outline"
						color="slate"
						className="rounded-full border-slate-300 px-3 py-1 text-[11px] text-slate-600 hover:border-slate-400 hover:bg-slate-50"
						href={route(classRouteName)}
					>
						Kelola kelas
					</Button>
				</div>
			</div>
			<div className="mt-0 overflow-x-auto">
				<table className="min-w-full border-separate border-spacing-y-1 text-xs">
					<thead>
						<tr>
							<th className="sticky left-0 z-10 rounded-l-xl bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Mahasiswa</th>
							<th className="bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Email</th>
							<th className="bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nilai Latihan</th>
							<th className="bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Kuis Selesai</th>
							<th className="bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rata-rata Quiz</th>
							{quizzes.map((quiz) => (
								<th
									key={quiz.id}
									className="bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500"
								>
									<span className="block max-w-[120px] truncate" title={quiz.title}>
										{quiz.title}
									</span>
								</th>
							))}
							<th className="bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Detail</th>
						</tr>
					</thead>
					<tbody>
						{students.length === 0 ? (
							<tr>
								<td
									colSpan={5 + quizzes.length}
									className="px-4 py-6 text-center text-[11px] text-slate-500"
								>
									Belum ada mahasiswa yang terdaftar di kelas ini.
								</td>
							</tr>
						) : (
							students.map((student) => (
								<tr key={student.id} className="rounded-xl border border-slate-100 bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)]">
									<td className="sticky left-0 z-[1] max-w-[180px] rounded-l-xl bg-white px-3 py-2 text-[12px] font-semibold text-slate-900">
										<span className="block truncate" title={student.nama}>{student.nama}</span>
									</td>
									<td className="max-w-[200px] px-3 py-2 text-[11px] text-slate-600">
										<span className="block truncate" title={student.email}>{student.email}</span>
									</td>
									<td className="px-3 py-2 text-center text-[11px] font-semibold">
										{student.hard_score !== null ? (
											<span className={student.hard_score >= 70 ? "text-emerald-600" : "text-slate-700"}>
												{student.hard_score}
											</span>
										) : (
											<span className="text-slate-400">-</span>
										)}
									</td>
									<td className="px-3 py-2 text-center text-[11px] font-semibold text-slate-700">
										{student.completed_quizzes}
									</td>
									<td className="px-3 py-2 text-center text-[11px] font-semibold text-slate-700">
										{student.average_score !== null ? `${student.average_score}` : "-"}
									</td>
									{quizzes.map((quiz) => {
										const entry = (student.scores || []).find((s) => s.quiz_id === quiz.id);
										const score = entry ? entry.score : null;
										return (
											<td key={quiz.id} className="px-3 py-2 text-center text-[11px]">
												<div className="flex flex-col items-center gap-1">
													{score !== null ? (
														<span className={score >= 70 ? "font-semibold text-emerald-600" : "font-semibold text-slate-700"}>
															{score}
														</span>
													) : (
														<span className="text-slate-400">-</span>
													)}
													<button
														type="button"
														onClick={() => openEditQuiz(student, quiz)}
														className="text-[10px] font-semibold text-sky-600 hover:underline"
													>
														Edit
													</button>
												</div>
											</td>
										);
									})}
									<td className="px-3 py-2 text-center text-[11px]">
										<Link
											className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
											href={route(gradeShowRouteName, { student: student.id, class_id: classDetail.id })}
										>
											Detail
										</Link>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</Card>
	);
}
