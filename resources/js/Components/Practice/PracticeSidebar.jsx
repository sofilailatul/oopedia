import React from "react";
import Dropdown from "@/Components/Dropdown";
import { FaChevronDown, FaCheck } from "react-icons/fa";
import Button from "@/Components/Button";

import { difficultyLabel, questionTypeLabel } from "@/Features/practice/labels";
import { hintToneClass, scoreBadgeClass } from "@/Features/practice/ui";
import { calculateDifficultyRule, canSelectDifficulty } from "@/Features/practice/rules";
import { totalQuestions } from "@/Features/practice/helpers";

export default function PracticeSidebar({
  selectedPractice,
  difficulty,
  questionType,
  onDifficultyChange,
  onQuestionTypeChange,
  onClose,
  onStart,
  canStart,
}) {
  const scores = selectedPractice?.scores ?? { easy: null, normal: null, hard: null };
  const questionCounts = selectedPractice?.question_counts ?? {};

  const rule = calculateDifficultyRule(scores);
  const qty = totalQuestions(questionCounts, difficulty, questionType, selectedPractice?.material_name);

  const handleDifficultySelect = (level) => {
    console.log("Dropdown Level dipilih:", level);
    onDifficultyChange(level);
  };

  const handleQuestionTypeSelect = (type) => {
    console.log("Dropdown Tipe Soal dipilih:", type);
    onQuestionTypeChange(type);
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5 ">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500">Latihan Soal</div>
          <h3 className="text-lg font-bold mt-1">
            {selectedPractice?.material_name ?? "Pilih materi dulu"}
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700"
          title="Tutup"
        >
          ✕
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <div className={`border rounded-xl px-3 py-2 text-sm ${hintToneClass(rule.tone)}`}>
          {rule.hint}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-700">Nilai per Level</div>
          <div className="space-y-2">
            {["easy", "normal", "hard"].map((level) => (
              <div key={level} className="flex items-center justify-between border rounded-xl px-3 py-2">
                <span className="text-sm text-slate-700 font-medium">
                  {difficultyLabel(level)}
                </span>
                <ScoreBadge score={scores[level]} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Level</label>
          <Dropdown>
            <Dropdown.Trigger>
              <button
                type="button"
                className="w-full flex items-center justify-between border rounded-xl px-3 py-2 bg-white hover:bg-slate-50"
              >
                <span className="text-sm text-slate-800">{difficultyLabel(difficulty)}</span>
                <FaChevronDown className="text-slate-500 text-xs" />
              </button>
            </Dropdown.Trigger>

            <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-white">
              {["easy", "normal", "hard"].map((level) => {
                const enabled = canSelectDifficulty(level, rule);
                const selected = difficulty === level;

                return (
                  <Dropdown.Item
                    key={level}
                    disabled={!enabled}
                    onClick={() => enabled && handleDifficultySelect(level)}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {selected && <FaCheck className="text-xs" />}
                      {difficultyLabel(level)}
                    </span>
                    {!enabled && <span className="text-xs text-gray-400">Terkunci</span>}
                  </Dropdown.Item>
                );
              })}
            </Dropdown.Content>
          </Dropdown>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Tipe Soal</label>
          <Dropdown>
            <Dropdown.Trigger>
              <button
                type="button"
                className="w-full flex items-center justify-between border rounded-xl px-3 py-2 bg-white hover:bg-slate-50"
              >
                <span className="text-sm text-slate-800">{questionTypeLabel(questionType)}</span>
                <FaChevronDown className="text-slate-500 text-xs" />
              </button>
            </Dropdown.Trigger>

            <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-white">
              {["multiple_choice", "drag_drop"].map((type) => (
                <Dropdown.Item
                  key={type}
                  onClick={() => handleQuestionTypeSelect(type)}
                  className="flex items-center gap-2"
                >
                  {questionType === type && <FaCheck className="text-xs" />}
                  {questionTypeLabel(type)}
                </Dropdown.Item>
              ))}
            </Dropdown.Content>
          </Dropdown>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold text-slate-700">Jumlah Soal</div>
          <div className="px-3 py-2 border rounded-xl text-sm text-slate-600 bg-slate-50">
            {!difficulty || !questionType ? "—" : qty}
          </div>
        </div>

        {difficulty && questionType && qty === 0 && (
          <div className="text-xs text-red-600">Soal untuk level & tipe ini belum tersedia.</div>
        )}

        <Button
          disabled={!canStart}
          onClick={() => onStart(qty)}
          variant="Solid"
          color="blue"
          className={`w-full ${canStart ? "Blue hover:bg-slate-600" : "bg-slate-200 text-slate-500 cursor-not-allowed"}`}
        >
          Mulai
        </Button>
      </div>
    </div>
  );
}

function ScoreBadge({ score }) {
  const badgeClass = scoreBadgeClass(score);
  const display = score == null ? "Belum mengerjakan" : score;

  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeClass}`}>
      {display}
    </span>
  );
}
