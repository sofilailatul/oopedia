import React from "react";

export default function QuestionNavigator({ questions, currentIndex, isAnswered, onGoTo }) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-700 mb-3">Nomor Soal</div>
      <div className="grid grid-cols-4 gap-3">
        {questions.map((q, idx) => {
          const active = idx === currentIndex;
          const answered = isAnswered(q);

          const base =
            "w-11 h-11 rounded-xl border text-sm font-semibold flex items-center justify-center transition";
          const cls = active
            ? "bg-slate-700 text-white border-slate-700"
            : answered
            ? "bg-slate-200 text-slate-800 border-slate-200"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50";

          return (
            <button
              key={q.id}
              type="button"
              className={`${base} ${cls}`}
              onClick={() => onGoTo(idx)}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
