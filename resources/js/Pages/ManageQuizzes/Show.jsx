import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link } from "@inertiajs/react";
import Card from "@/Components/Card";
import Button from "@/Components/Button";

const formatDateTime = (value) => {
	if (!value) return "Tidak diatur";
	if (typeof value !== "string") return value;

	// Jaga jam tetap sama dengan yang disimpan di database (tanpa geser timezone)
	// Contoh input: "2026-03-30 07:15:00" atau "2026-03-30T07:15"
	const parts = value.split(/[ T]/);
	const datePart = parts[0];
	const timeRaw = parts[1] || "";

	if (!datePart) return value;

	const [year, month, day] = datePart.split("-");
	if (!year || !month || !day) return value;

	const monthNames = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"Mei",
		"Jun",
		"Jul",
		"Agu",
		"Sep",
		"Okt",
		"Nov",
		"Des",
	];

	const monthIndex = Number.parseInt(month, 10) - 1;
	const monthLabel = monthNames[monthIndex] ?? month;
	const timePart = timeRaw.slice(0, 5); // HH:MM

	return `${day} ${monthLabel} ${year}${timePart ? ` ${timePart}` : ""}`;
};

export default function ManageQuizzesShow({ quiz, questions = [], authUser }) {
	const role = (authUser?.role || "").toLowerCase();
	const isSuperadmin = role === "superadmin";
	const baseRouteName = isSuperadmin ? "superadmin.quizzes" : "dosen.quizzes";

	return (
		<AppLayout
			title="Detail Kuis"
			label="Detail Kuis"
			backHref={route(`${baseRouteName}.index`)}
			backLabel="Kembali ke daftar kuis"
		>
			<div className="mx-auto max-w-6xl space-y-6">
				{/* Header */}
				<div className="rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm sm:p-6">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div className="space-y-1">
							<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
								Detail Kuis
							</p>
							<h1 className="text-lg font-semibold tracking-tight text-slate-900">
								{quiz.title}
							</h1>
							<p className="text-xs text-slate-500">
								Kelas {" "}
								<span className="font-medium text-slate-800">{quiz.class_name}</span>
								{" "}• Durasi {quiz.duration} menit • Batas lulus {quiz.passing_score}
							</p>
						</div>
						<Button
							as={Link}
							href={route(`${baseRouteName}.edit`, quiz.id)}
							variant="solid"
							color="blue"
							size="sm"
							className="rounded-full px-4"
						>
							Edit Kuis & Soal
						</Button>
					</div>
				</div>

				{/* Meta card */}
					<Card className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5 shadow-sm">
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
							<div>
								<h3 className="text-sm font-semibold text-slate-800">Informasi Kuis</h3>
								<p className="text-[11px] text-slate-500">
									Ringkasan pengaturan dan jadwal pelaksanaan.
								</p>
							</div>
						</div>
						<div className="grid gap-4 text-xs text-slate-700 sm:grid-cols-3">
							<dl className="space-y-2">
								<div>
									<dt className="text-[11px] font-medium text-slate-500">Judul</dt>
									<dd className="mt-0.5 font-semibold text-slate-900 truncate">
										{quiz.title}
									</dd>
								</div>
								<div>
									<dt className="text-[11px] font-medium text-slate-500">Kelas</dt>
									<dd className="mt-0.5">{quiz.class_name}</dd>
								</div>
							</dl>
							<dl className="space-y-2">
								<div>
									<dt className="text-[11px] font-medium text-slate-500">Durasi</dt>
									<dd className="mt-0.5">{quiz.duration} menit</dd>
								</div>
								<div>
									<dt className="text-[11px] font-medium text-slate-500">Batas Lulus</dt>
									<dd className="mt-0.5">{quiz.passing_score} / 100</dd>
								</div>
							</dl>
							<dl className="space-y-2">
								<div>
									<dt className="text-[11px] font-medium text-slate-500">Mulai</dt>
									<dd className="mt-0.5">{formatDateTime(quiz.start_at)}</dd>
								</div>
								<div>
									<dt className="text-[11px] font-medium text-slate-500">Selesai</dt>
									<dd className="mt-0.5">{formatDateTime(quiz.end_at)}</dd>
								</div>
								<div>
									<dt className="text-[11px] font-medium text-slate-500">Total Soal</dt>
									<dd className="mt-0.5">{questions.length} soal</dd>
								</div>
							</dl>
						</div>
					{quiz.description && (
						<div className="mt-4 border-t border-dashed border-slate-200 pt-3 text-xs text-slate-700">
							<p className="mb-1 text-[11px] font-medium text-slate-500">
								Deskripsi / Catatan
							</p>
							<p>{quiz.description}</p>
						</div>
					)}
				</Card>

				{/* Questions */}
				<Card className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
					<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
						<div>
							<h3 className="text-sm font-semibold text-slate-800">Daftar Soal</h3>
							<p className="text-[11px] text-slate-500">
								{questions.length > 0
									? `Total ${questions.length} soal pilihan ganda.`
									: "Belum ada soal yang dibuat untuk kuis ini."}
							</p>
						</div>
					</div>
					<div className="space-y-4">
						{questions.length === 0 && (
							<p className="text-xs text-slate-500">
								Belum ada soal yang dibuat untuk kuis ini.
							</p>
						)}
						{questions.map((q, idx) => (
							<div
								key={q.id || idx}
								className="border border-slate-200 bg-white/90 shadow-sm rounded-2xl backdrop-blur py-2"
							>
								<div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
									<div className="flex items-center gap-3">
										<span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
											{idx + 1}
										</span>
										<div>
											<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
												Soal Pilihan Ganda
											</p>
											<p className="text-[11px] text-slate-400">
												{q.material_name && <>Materi: {q.material_name} • </>}
												Points: {q.points ?? 10}
											</p>
										</div>
									</div>
								</div>
								<div className="px-5 pb-4 pt-3 space-y-3">
									<p className="text-xs font-medium text-slate-900">
										{q.quiz_text || q.question_text}
									</p>
									{(q.image_url || q.image_path) && (
										<div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
											<img
												src={q.image_url || q.image_path}
												alt="Gambar soal"
												className="max-h-64 w-full object-contain"
											/>
										</div>
									)}
									<ol className="mt-2 space-y-1 text-xs text-slate-700">
										{(q.options || []).map((opt, optIdx) => (
											<li
												key={opt.id || optIdx}
												className="flex gap-2"
											>
												<span className="mt-0.5 w-4 text-[11px] font-medium text-slate-500">
													{String.fromCharCode(65 + optIdx)}.
												</span>
												<span
													className={
														opt.is_correct
															? "rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
														: "text-[11px] text-slate-700"
													}
												>
													{opt.option_text || opt.text}
													{opt.is_correct && " (Benar)"}
												</span>
											</li>
										))}
									</ol>
									{(q.feedback_correct || q.feedback_incorrect) && (
										<div className="mt-3 grid gap-2 border-t border-dashed border-slate-200 pt-2 text-[11px] text-slate-600 sm:grid-cols-2">
											{q.feedback_correct && (
												<div>
													<p className="font-medium text-emerald-700">Feedback Jawaban Benar</p>
													<p>{q.feedback_correct}</p>
												</div>
											)}
											{q.feedback_incorrect && (
												<div>
													<p className="font-medium text-amber-700">Feedback Jawaban Salah</p>
													<p>{q.feedback_incorrect}</p>
												</div>
											)}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</Card>
			</div>
		</AppLayout>
	);
}
