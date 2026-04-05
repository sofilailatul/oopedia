import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import Card from "@/Components/Card";

const PRACTICE_COLUMNS = [
	{ key: "easy", label: "Latihan Easy", dot: "bg-emerald-400", text: "text-emerald-600", activeBg: "bg-emerald-50 text-emerald-700" },
	{ key: "normal", label: "Latihan Normal", dot: "bg-amber-400", text: "text-amber-600", activeBg: "bg-amber-50 text-amber-700" },
	{ key: "hard", label: "Latihan Hard", dot: "bg-red-400", text: "text-red-500", activeBg: "bg-red-50 text-red-700" },
];

export default function ManageLeaderboardShow({ class: classInfo, student, materialStats = [], backRouteName = "dosen.grades.index" }) {
	const backHref = route(backRouteName);

	return (
		<AppLayout
			title="Detail Nilai Mahasiswa"
			label="Detail Nilai Mahasiswa"
			backHref={backHref}
			backLabel="Kembali ke daftar nilai"
		>
			<div className="mx-auto max-w-5xl space-y-6 pb-10">
				<HeaderSection classInfo={classInfo} student={student} />
				<MaterialSummarySection materialStats={materialStats} />
			</div>
		</AppLayout>
	);
}

function HeaderSection({ classInfo, student }) {
	return (
		<Card className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{student?.nama}</h1>
					<p className="text-xs text-slate-500">
						{student?.email}
						<span className="mx-1">•</span>
						Kelas {classInfo?.class_name} ({classInfo?.class_code})
					</p>
				</div>
			</div>
		</Card>
	);
}

function MaterialSummarySection({ materialStats }) {
	if (!materialStats || materialStats.length === 0) {
		return (
			<Card className="rounded-2xl border border-slate-200 bg-white/95 p-6 text-center text-[11px] text-slate-500">
				Belum ada nilai latihan atau kuis untuk mahasiswa ini.
			</Card>
		);
	}

	const hasQuiz = materialStats.some((row) => row.quiz && row.quiz > 0);

	const practiceGrandTotal = materialStats.reduce(
		(sum, row) => sum + (row.easy + row.normal + row.hard),
		0
	);

	const quizGrandTotal = materialStats.reduce((sum, row) => sum + (row.quiz || 0), 0);

	return (
		<div className="space-y-4">
			<Card className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
				<div className="mb-3 flex items-center justify-between gap-2">
					<div>
						<h2 className="text-sm font-semibold text-slate-900">Rekap Nilai Latihan per Materi</h2>
						<p className="text-[11px] text-slate-500">
							Nilai terbaik latihan (easy/normal/hard) untuk setiap materi.
						</p>
					</div>
					<span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
						{materialStats.length} materi
					</span>
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-full border-separate border-spacing-y-1 text-xs">
						<thead>
							<tr>
								<th className="bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Materi</th>
								{PRACTICE_COLUMNS.map((col) => (
									<th key={col.key} className="bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
										<span className={`inline-flex items-center gap-1 ${col.text}`}>
											<span className={`w-2 h-2 rounded-full ${col.dot}`}></span>
											{col.label}
										</span>
									</th>
								))}
								<th className="bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total Latihan</th>
							</tr>
						</thead>
						<tbody>
							{materialStats.map((row) => {
								const practiceTotal = row.easy + row.normal + row.hard;

								return (
									<tr key={row.material_id} className="rounded-xl border border-slate-100 bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)]">
										<td className="max-w-[220px] px-3 py-2 text-[11px] text-slate-800">
											<span className="block truncate" title={row.material_name}>{row.material_name}</span>
										</td>
										{PRACTICE_COLUMNS.map((col) => (
											<td key={col.key} className="px-3 py-2 text-center text-[11px]">
												<span className={[
													"inline-block min-w-[40px] rounded-md px-2 py-0.5 font-semibold",
													row[col.key] > 0 ? col.activeBg : "text-slate-400",
												].join(" ")}>
													{row[col.key]}
												</span>
											</td>
										))}
										<td className="px-3 py-2 text-center text-[11px]">
											<span className="inline-block min-w-[48px] rounded-lg bg-slate-800 px-3 py-1 font-bold text-white">
												{practiceTotal}
											</span>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<div className="mt-3 text-right text-[11px] text-slate-500">
					<span className="font-semibold text-slate-700">Total latihan semua materi:</span> {practiceGrandTotal}
				</div>
			</Card>

			{hasQuiz && (
				<Card className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
					<div className="mb-3 flex items-center justify-between gap-2">
						<div>
							<h2 className="text-sm font-semibold text-slate-900">Rekap Nilai Kuis per Materi</h2>
							<p className="text-[11px] text-slate-500">
								Total skor kuis yang diperoleh pada setiap materi.
							</p>
						</div>
						<span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
							Kuis
						</span>
					</div>

					<div className="overflow-x-auto">
						<table className="min-w-full border-separate border-spacing-y-1 text-xs">
							<thead>
								<tr>
									<th className="bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Materi</th>
									<th className="bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Skor Kuis</th>
								</tr>
							</thead>
							<tbody>
								{materialStats.map((row) => (
									<tr key={row.material_id} className="rounded-xl border border-slate-100 bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)]">
										<td className="max-w-[220px] px-3 py-2 text-[11px] text-slate-800">
											<span className="block truncate" title={row.material_name}>{row.material_name}</span>
										</td>
										<td className="px-3 py-2 text-center text-[11px] font-semibold">
											<span className={row.quiz > 0 ? "text-blue-600" : "text-slate-400"}>{row.quiz || 0}</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>
			)}
		</div>
	);
}
