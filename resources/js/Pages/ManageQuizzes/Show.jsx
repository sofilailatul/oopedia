import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link } from "@inertiajs/react";
import Button from "@/Components/Button";
import Card from "@/Components/Card";
import { FaPen, FaChevronDown, FaChevronUp } from "react-icons/fa";

const formatDateTime = (value) => {
	if (!value) return "Tidak diatur";
	const parts = value.split(/[ T]/);
	const datePart = parts[0];
	const timeRaw = parts[1] || "";
	if (!datePart) return value;
	const [year, month, day] = datePart.split("-");
	if (!year || !month || !day) return value;
	const monthNames = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
	const monthLabel = monthNames[parseInt(month, 10) - 1] ?? month;
	const timePart = timeRaw.slice(0, 5);
	return `${day} ${monthLabel} ${year}${timePart ? `, ${timePart}` : ""}`;
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
			<div className="mx-auto space-y-6">
				{/* ── Info card ── */}
				<Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
				{/* Header */}
				<div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4 rounded-t-2xl">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
						<span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
							<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"
							/>
							</svg>
						</span>

						<div>
							<h2 className="text-sm font-semibold text-slate-900">
							Informasi Kuis
							</h2>
							<p className="text-[11px] text-slate-500">
							Ringkasan pengaturan, kelas, dan jadwal pelaksanaan kuis.
							</p>
						</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
						{questions.length} soal
						</span>

						<Button
						as={Link}
						href={route(`${baseRouteName}.edit`, quiz.id)}
						color="blue"
						variant="solid"
						size="sm"
						leftIcon={<FaPen className="h-3 w-3" />}
						className="rounded-full shadow-sm"
						>
						Edit Kuis & Soal
						</Button>
					</div>
					</div>
				</div>

				{/* Content */}
				<div className="space-y-3">
					{/* Title + Classes */}
					<div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.3fr)]">
						<div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex flex-col justify-center">
							<h3 className="mt-2 mb-2 text-base font-semibold leading-snug text-slate-900">
							{quiz.title}
							</h3>
							<div className="flex flex-wrap gap-1.5">
								{(quiz.classes || [{ id: quiz.id, class_name: quiz.class_name }]).map((cls) => (
									<span
									key={cls.id}
									className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-700"
									>
									<span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
									{cls.class_name}
									</span>
								))}
							</div>

							{quiz.description && (
							<p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
								{quiz.description}
							</p>
							)}
						</div>

						{/* Schedule */}
						<div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex flex-col justify-center">
							<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
								Jadwal Pelaksanaan
							</p>
							<div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
								<div className="flex items-center gap-3">
									<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
										<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M5 11h14M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
										</svg>
									</span>
									<div>
										<p className="text-[10px] text-slate-500 font-medium">Mulai</p>
										<p className="text-sm font-semibold text-slate-800">{formatDateTime(quiz.start_at)}</p>
									</div>
								</div>
								
								<div className="hidden sm:flex h-px flex-1 bg-slate-200"></div>

								<div className="flex items-center gap-3">
									<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
										<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</span>
									<div>
										<p className="text-[10px] text-slate-500 font-medium">Selesai</p>
										<p className="text-sm font-semibold text-slate-800">{formatDateTime(quiz.end_at)}</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Stats */}
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
						<div className="flex items-center justify-between">
						<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
							Durasi
						</p>
						<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
							Timer
						</span>
						</div>
						<p className="mt-2 text-lg font-semibold text-slate-900">
						{quiz.duration}
						<span className="ml-1 text-xs font-medium text-slate-500">
							menit
						</span>
						</p>
					</div>

					<div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
						<div className="flex items-center justify-between">
						<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
							Batas Lulus
						</p>
						<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-600">
							Minimum
						</span>
						</div>
						<p className="mt-2 text-lg font-semibold text-slate-900">
						{quiz.passing_score}
						<span className="ml-1 text-xs font-medium text-slate-500">
							/ 100
						</span>
						</p>
					</div>

					<div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
						<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
						Total Soal
						</p>
						<p className="mt-2 text-lg font-semibold text-slate-900">
						{questions.length}
						<span className="ml-1 text-xs font-medium text-slate-500">
							soal
						</span>
						</p>
					</div>
					</div>


					{/* Description full */}
					{quiz.description && (
					<div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4">
						<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
						Deskripsi
						</p>
						<p className="mt-2 text-xs leading-relaxed text-slate-600">
						{quiz.description}
						</p>
					</div>
					)}
				</div>
				</Card>

				{/* ── Questions ── */}
				<Card className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-sm font-semibold text-slate-800">Daftar Soal</h2>
							<p className="text-[11px] text-slate-500">
								{questions.length > 0
									? `${questions.length} soal pilihan ganda.`
									: "Belum ada soal. Edit kuis untuk menambahkan soal."}
							</p>
						</div>
					</div>

					{questions.length === 0 ? (
						<div className="px-5 py-10 text-center text-sm text-slate-400">
							Belum ada soal. Klik <strong>Edit Kuis & Soal</strong> untuk menambahkan.
						</div>
					) : (
						<div className="space-y-3">
							{questions.map((q, idx) => (
								<QuestionCard key={q.id || idx} q={q} idx={idx} />
							))}
						</div>
					)}
				</Card>
			</div>
		</AppLayout>
	);
}

function QuestionCard({ q, idx }) {
	const [open, setOpen] = React.useState(false);

	return (
		<div className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-sm transition-shadow">
			{/* Header */}
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50/60 transition-colors"
			>
				<span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white mt-0.5">
					{idx + 1}
				</span>
				<div className="flex-1 min-w-0">
					<p className="text-[12px] font-medium text-slate-800 leading-snug">
						{q.quiz_text || q.question_text}
					</p>
					<div className="flex flex-wrap gap-1.5 mt-1">
						{q.material_name && (
							<span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-100">
								{q.material_name}
							</span>
						)}
						<span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
							{q.points ?? 10} poin
						</span>
					</div>
				</div>
				<span className="text-slate-400 text-xs flex-shrink-0 mt-0.5">
					{open ? <FaChevronUp /> : <FaChevronDown />}
				</span>
			</button>

			{/* Body */}
			{open && (
				<div className=" px-4 pb-4 pt-3 space-y-3">
					{(q.image_url || q.image_path) && (
						<div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
							<img
								src={q.image_url || q.image_path}
								alt="Gambar soal"
								className="max-h-64 w-full object-contain"
							/>
						</div>
					)}

					<ol className="space-y-1.5">
						{(q.options || []).map((opt, optIdx) => (
							<li
								key={opt.id || optIdx}
								className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
									opt.is_correct
										? "bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold"
										: "bg-slate-50 border border-slate-100 text-slate-700"
								}`}
							>
								<span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
									opt.is_correct ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
								}`}>
									{String.fromCharCode(65 + optIdx)}
								</span>
								<span className="flex-1">{opt.option_text || opt.text}</span>
								{opt.is_correct && (
									<span className="ml-auto text-[10px] font-semibold text-emerald-600">✓ Benar</span>
								)}
							</li>
						))}
					</ol>

					{(q.feedback_correct || q.feedback_incorrect) && (
						<div className="grid gap-2 sm:grid-cols-2 border-t border-dashed border-slate-200 pt-3">
							{q.feedback_correct && (
								<div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
									<p className="text-[10px] font-semibold text-emerald-700 mb-1 uppercase tracking-wide">Feedback Benar</p>
									<p className="text-[11px] text-emerald-800">{q.feedback_correct}</p>
								</div>
							)}
							{q.feedback_incorrect && (
								<div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
									<p className="text-[10px] font-semibold text-amber-700 mb-1 uppercase tracking-wide">Feedback Salah</p>
									<p className="text-[11px] text-amber-800">{q.feedback_incorrect}</p>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
