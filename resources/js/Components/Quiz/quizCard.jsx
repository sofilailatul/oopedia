import React from "react";
import { statusBadgeClass, statusLabel } from "@/Features/quiz/labels";
import Icons from "@/icons";
import Button from "@/Components/Button";

export default function QuizCard({ quiz, onClick }) {
  const isDone = quiz?.can_review === true || quiz?.status === "done";
  const isAvailable = quiz?.is_available !== false;
  const materialNames = Array.isArray(quiz?.material_names) ? quiz.material_names : [];

  const handleCardClick = () => {
    if (!isAvailable && !isDone) return;
    onClick?.(quiz);
  };

  const handleButtonClick = (e) => {
    e.stopPropagation(); 
    onClick?.(quiz);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => (e.key === "Enter" ? handleCardClick() : null)}
      className={`text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-4 transition md:p-6 ${
        !isAvailable && !isDone
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-md cursor-pointer"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${statusBadgeClass(quiz?.status)} ${
          !isAvailable && !isDone ? "bg-slate-100 text-slate-400 border border-slate-200" : ""
        }`}>
          {!isAvailable && !isDone ? "Terkunci" : statusLabel(quiz?.status)}
        </span>
      </div>

      <div className="mt-4">
        <div className="text-sm font-bold text-slate-900">{quiz?.title ?? "-"}</div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
          <Icons.User className="h-4 w-4" />
        </div>
        <div className="min-w-0 text-[12px] text-slate-600">{quiz?.teacher_name ?? "Dosen"}</div>
      </div>

      {/* Materi */}
      <div className="mt-4">
        <div className="text-[12px] font-semibold text-slate-700">Materi yang diuji</div>
        {materialNames.length === 0 ? (
          <div className="mt-2 text-[12px] text-slate-500">-</div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {materialNames.map((name, idx) => (
              <span
                key={`${name}-${idx}`}
                className="inline-flex rounded-lg border bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5">
        <Button
          type="button"
          onClick={handleButtonClick}
          variant="solid"
          color={isDone ? "green" : isAvailable ? "yellow" : "gray"}
          disabled={!isAvailable && !isDone}
          className="w-full"
          leftIcon={!isAvailable && !isDone ? <Icons.Lock className="w-3.5 h-3.5" /> : null}
        >
          {isDone
            ? "Review Kuis"
            : !isAvailable
            ? "Baca materi & selesaikan latihan dulu"
            : "Kerjakan Kuis"}
        </Button>
      </div>
    </div>
  );
}
