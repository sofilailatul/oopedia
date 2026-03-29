import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { QUESTION_TYPE } from "@/Features/practice/constants";
import { difficultyLabel, questionTypeLabel } from "@/Features/practice/labels";
import PracticeMetaPanel from "@/Features/practice/PracticeMetaPanel";
import MultipleChoiceQuestionForm from "@/Components/QuestionForm/MultipleChoiceQuestionForm";
import DragDropQuestionForm from "@/Components/QuestionForm/DragDropQuestionForm";

export default function DosenPracticeShow({ practice, teacher, questions = [] }) {
  const [typeFilter, setTypeFilter] = React.useState("all");

  const filteredQuestions = React.useMemo(
    () => {
      if (typeFilter === "all") return questions;
      return questions.filter((q) => {
        if (!q.type && typeFilter === QUESTION_TYPE.MC) return true;
        return q.type === typeFilter;
      });
    },
    [questions, typeFilter],
  );

  const getQuestionTypeLabel = (type) => {
    return questionTypeLabel(type || QUESTION_TYPE.MC);
  };

  return (
    <AppLayout
      title="Detail Latihan Soal"
      label="Detail Latihan Soal"
      backHref={route("dosen.practices.index")}
      backLabel="Kembali ke daftar latihan"
    >
      <div className=" mx-auto space-y-6">
        <header className="space-y-4">
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
        </header>

        <section className="space-y-4">
          {filteredQuestions.map((q, idx) => (
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
                <MultipleChoiceQuestionForm question={q} questionIndex={idx} readOnly />
              )}
            </div>
          ))}
        </section>
      </div>
    </AppLayout>
  );
}
