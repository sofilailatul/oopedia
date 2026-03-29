import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import Card from "@/Components/Card";
import Button from "@/Components/Button";
import { router, Link } from "@inertiajs/react";

export default function DosenClassScoresPage({ classes = [], selectedClassId = null, classDetail = null }) {
	return (
		<AppLayout title="Nilai Mahasiswa" label="Nilai Mahasiswa">
			<div className="mx-auto max-w-7xl space-y-6 pb-10">
				<HeaderSection />
				<ContentSection
					classes={classes}
					selectedClassId={selectedClassId}
					classDetail={classDetail}
				/>
			</div>
		</AppLayout>
	);
}

function HeaderSection() {
	return (
		<Card className="rounded-2xl border border-slate-200/80 bg-white px-6 py-5 shadow-sm">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

function ContentSection({ classes, selectedClassId, classDetail }) {
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
			<ClassList classes={classes} selectedClassId={selectedClassId} />
			<ScoreTable classDetail={classDetail} />
		</div>
	);
}

function ClassList({ classes, selectedClassId }) {
	const handleSelect = (id) => {
		if (!id || id === selectedClassId) return;
		router.get(route("dosen.grades.index"), { class_id: id }, {
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
								"flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-xs transition-all",
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

function ScoreTable({ classDetail }) {
	if (!classDetail) {
		return (
			<Card className="h-full rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
				Pilih salah satu kelas di sebelah kiri untuk melihat rekap nilai mahasiswa.
			</Card>
		);
	}

	const quizzes = classDetail.quizzes || [];
	const students = classDetail.students || [];

	return (
		<Card className="h-full rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
			<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-sm font-semibold text-slate-900">{classDetail.class_name}</h2>
					<p className="text-[11px] text-slate-500">
						Kode kelas {classDetail.class_code} &bull; {students.length} mahasiswa &bull; {quizzes.length} kuis
					</p>
				</div>
				<Button
					as="a"
					variant="outline"
					color="slate"
					className="rounded-full border-slate-300 px-3 py-1 text-[11px] text-slate-600 hover:border-slate-400 hover:bg-slate-50"
					href={route("dosen.classes.index")}
				>
					Kelola kelas
				</Button>
			</div>
			<div className="mt-2 overflow-x-auto">
				<table className="min-w-full border-separate border-spacing-y-1 text-xs">
					<thead>
						<tr>
							<th className="sticky left-0 z-10 rounded-l-xl bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Mahasiswa</th>
							<th className="bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Email</th>
							<th className="bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nilai Hard</th>
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
												{score !== null ? (
													<span className={score >= 70 ? "font-semibold text-emerald-600" : "font-semibold text-slate-700"}>
														{score}
													</span>
												) : (
													<span className="text-slate-400">-</span>
												)}
											</td>
										);
									})}
									<td className="px-3 py-2 text-center text-[11px]">
										<Link
											className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
											href={route("dosen.grades.show", { student: student.id, class_id: classDetail.id })}
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

