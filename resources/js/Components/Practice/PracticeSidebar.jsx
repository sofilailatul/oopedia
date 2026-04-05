import React from "react";
import { Link } from "@inertiajs/react";
import Dropdown from "@/Components/Dropdown";
import { FaChevronDown, FaCheck, FaTimes } from "react-icons/fa";
import Button from "@/Components/Button";
import { difficultyLabel } from "@/Features/practice/labels";
import { hintToneClass, scoreBadgeClass } from "@/Features/practice/ui";
import { calculateDifficultyRule, canSelectDifficulty } from "@/Features/practice/rules";
import { totalQuestions } from "@/Features/practice/helpers";

export default function PracticeSidebar({
  selectedPractice,
  difficulty,
  questionType,
  onDifficultyChange,
  onClose,
  onStart,
  canStart,
}) {
  const scores = selectedPractice?.scores ?? { easy: null, normal: null, hard: null };
  const levels = selectedPractice?.levels ?? {};
  const questionCounts = selectedPractice?.question_counts ?? {};

  const rule = calculateDifficultyRule(scores);
  const qty = totalQuestions(questionCounts, difficulty, questionType, selectedPractice?.material_name);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between pb-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900 leading-snug">
            {selectedPractice?.material_name ?? "Pilih Materi"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Tutup"
        >
          <FaTimes className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-6 flex-1">
        {/* Hint / Rules */}
        <div className={`border rounded-2xl p-4 text-[13px] leading-relaxed font-medium ${hintToneClass(rule.tone) || 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">💡</span>
            <p>{rule.hint}</p>
          </div>
        </div>

        {/* Scores */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block ml-1">
            Nilai Per Level
          </label>
          <div className="grid grid-cols-1 gap-2">
            {["easy", "normal", "hard"].map((level) => (
              <div key={level} className="flex items-center justify-between bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3">
                <span className="text-[12px] font-medium text-slate-700 capitalize">
                  {difficultyLabel(level)}
                </span>
                <ScoreBadge score={scores[level]} />
              </div>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block ml-1">
            Level Kesulitan
          </label>
          <Dropdown>
            <Dropdown.Trigger>
              <Button
                className="w-full flex items-center justify-between border border-slate-200 rounded-2xl px-4 py-3.5 bg-white hover:border-indigo-300 hover:bg-slate-50 transition-all focus:ring-4 focus:ring-indigo-50"
              >
                <span className="text-[12px] font-medium text-slate-700">
                  {difficulty ? difficultyLabel(difficulty) : "Pilih Level"}
                </span>
                <FaChevronDown className="text-slate-400 text-[10px]" />
              </Button>
            </Dropdown.Trigger>
            <Dropdown.Content align="left" width="48" contentClasses="py-2 bg-white rounded-2xl shadow-xl border border-slate-100">
              {["easy", "normal", "hard"].map((level) => {
                const enabled = canSelectDifficulty(level, rule);
                const selected = difficulty === level;
                return (
                  <button
                    key={level}
                    type="button"
                    disabled={!enabled}
                    onClick={() => enabled && onDifficultyChange(level)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between ${
                      selected ? "bg-indigo-50 text-indigo-700" : (enabled ? "text-slate-700 hover:bg-slate-50" : "text-slate-300 cursor-not-allowed")
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {selected && <FaCheck className="text-[10px]" />}
                      {difficultyLabel(level)}
                    </span>
                    {!enabled && <span className="text-[10px] uppercase font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded-md">Terkunci</span>}
                  </button>
                );
              })}
            </Dropdown.Content>
          </Dropdown>
        </div>

        {/* Summary Info */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <span className="text-[13px] font-semibold text-slate-600">Total Soal</span>
          <div className="flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg bg-white border border-slate-200 text-sm font-bold text-indigo-600 shadow-sm">
            {!difficulty || !questionType ? "—" : qty}
          </div>
        </div>

        {difficulty && questionType && qty === 0 && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-red-600">
            <span className="text-sm mt-0.5">⚠️</span>
            <p className="text-xs font-medium leading-relaxed">
              Soal untuk level ini belum tersedia. Silakan pilih level lain.
            </p>
          </div>
        )}

        <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Summary</p>
          </div>

          <div className="space-y-2">
            {(["easy", "normal", "hard"]).map((level) => {
              const practiceId = levels[level];
              const score = scores[level];

              if (!practiceId || score == null) {
                return null;
              }

              return (
                <Link
                  key={level}
                  href={route("practices.summary", practiceId)}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/60"
                >
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-900">{difficultyLabel(level)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {score} points
                  </span>
                </Link>
              );
            })}

            {(["easy", "normal", "hard"]).every((level) => !levels[level] || scores[level] == null) && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                Summary akan muncul setelah kamu menyelesaikan latihan.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <Button
          disabled={!canStart}
          onClick={() => onStart(qty)}
          variant="solid"
          color="indigo"
          size="lg"
          className={`w-full rounded-2xl font-bold py-4 shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:bg-indigo-700 disabled:shadow-none transition-all ${
            !canStart && "bg-slate-100 text-slate-400 border border-slate-200"
          }`}
        >
          {canStart ? "Mulai Kerjakan" : "Hubungi Dosen"}
        </Button>
      </div>
    </div>
  );
}

function ScoreBadge({ score }) {
  const badgeClass = scoreBadgeClass(score);
  const display = score == null ? "0" : `${score} pts`;

  return (
    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-md tracking-wider uppercase ${badgeClass} border ${
      score == null ? "bg-slate-100 text-slate-500 border-slate-200" : badgeClass
    }`}>
      {display}
    </span>
  );
}
