import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link } from "@inertiajs/react";
import Card from "@/Components/Card";
import Button from "@/Components/Button";
import { QUESTION_TYPE } from "@/Features/practice/constants";
import { difficultyLabel, questionTypeLabel } from "@/Features/practice/labels";
import PracticeMetaPanel from "@/Features/practice/PracticeMetaPanel";
import MultipleChoiceQuestionForm from "@/Components/QuestionForm/MultipleChoiceQuestionForm";
import DragDropQuestionForm from "@/Components/QuestionForm/DragDropQuestionForm";

export default function ManagePracticesShow({
	practice,
	teacher,
	questions = [],
	authUser,
}) {
	const [typeFilter, setTypeFilter] = React.useState("all");
	const role = (authUser?.role || "").toLowerCase();
	const isSuperadmin = role === "superadmin";
	const backRoute = isSuperadmin ? "superadmin.practices.index" : "dosen.practices.index";
	const baseRouteName = isSuperadmin ? "superadmin.practices" : "dosen.practices";

	const filteredQuestions = React.useMemo(
		() => {
			if (typeFilter === "all") return questions;
			return questions.filter((q) => {
				if (!q.type && typeFilter === QUESTION_TYPE.MC) return true;
				return q.type === typeFilter;
			});
		},
		[typeFilter, questions]
	);

	return (
		<AppLayout
			title="Detail Latihan Soal"
			label="Detail Latihan Soal"
			backHref={route(backRoute)}
			backLabel="Kembali ke daftar latihan"
		>
			<div className="mx-auto max-w-6xl space-y-6">
				{/* Header */}
				<div className="rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm sm:p-6">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div className="space-y-1">
							<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
								Detail Latihan Soal
							</p>
							<h1 className="text-lg font-semibold tracking-tight text-slate-900">
								{practice?.material?.name ?? "Nama materi belum diatur"}
							</h1>
							<p className="text-xs text-slate-500">
								Level {difficultyLabel(practice?.difficulty_level) ?? "-"}
								{teacher?.name && (
									<>
										{" "}&bull; Pengampu {" "}
										<span className="font-medium text-slate-800">{teacher.name}</span>
									</>
								)}
								{questions?.length > 0 && (
									<>
										{" "}&bull; {questions.length} soal
									</>
								)}
							</p>
						</div>
						<Button
							as={Link}
							href={route(`${baseRouteName}.edit`, practice?.id)}
							variant="solid"
							color="blue"
							size="sm"
							className="rounded-full px-4"
						>
							Edit Latihan & Soal
						</Button>
					</div>
				</div>

				{/* Meta & Filter */}
				<Card className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5 shadow-sm">
					<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
						<div>
							<h3 className="text-sm font-semibold text-slate-800">Pengaturan Latihan & Filter Soal</h3>
							<p className="text-[11px] text-slate-500">
								Pilih tipe soal yang ingin ditampilkan untuk review.
							</p>
						</div>
					</div>
					<PracticeMetaPanel
						teacherName={teacher?.name ?? "Dosen"}
						materialName={practice?.material?.name ?? "Pilih Materi"}
						levelLabel={difficultyLabel(practice?.difficulty_level) ?? "Pilih Level"}
						enableTypeSelect
						selectedType={typeFilter}
						onTypeChange={setTypeFilter}
						typeOptions={[
							{ value: "all", label: "Semua tipe soal" },
							{ value: QUESTION_TYPE.MC, label: questionTypeLabel(QUESTION_TYPE.MC) },
							{ value: QUESTION_TYPE.DRAG, label: questionTypeLabel(QUESTION_TYPE.DRAG) },
						]}
					/>
				</Card>

				<section className="space-y-4">
					{filteredQuestions.length === 0 ? (
						<p className="text-sm text-slate-500">Belum ada soal untuk ditampilkan.</p>
					) : (
						filteredQuestions.map((q, idx) => (
							<div
								key={q.id ?? idx}
								className="border border-slate-200 bg-white/90 shadow-sm rounded-2xl backdrop-blur py-2"
							>
								<div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
									<div className="flex items-center gap-3">
										<span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
											{idx + 1}
										</span>
										<div>
											<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
												{getQuestionTypeLabel(q.type).toUpperCase()}
											</p>
											<p className="text-[11px] text-slate-400">
												Points: {q.points ?? 10}
											</p>
										</div>
									</div>
								</div>

								{(q.type || QUESTION_TYPE.MC) === QUESTION_TYPE.DRAG ? (
									<DragDropQuestionForm question={q} questionIndex={idx} readOnly />
								) : (
									<MultipleChoiceQuestionForm
										question={q}
										questionIndex={idx}
										readOnly
									/>
								)}
							</div>
						))
					)}
				</section>
			</div>
		</AppLayout>
	);
}

function getQuestionTypeLabel(type) {
	return questionTypeLabel(type || QUESTION_TYPE.MC) ?? "Soal";
}
