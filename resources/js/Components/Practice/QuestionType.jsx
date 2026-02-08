// resources/js/Pages/Practices/Components/QuestionTypeSelector.jsx

import React from 'react';
import Dropdown from '@/Components/Dropdown';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import { getQuestionTypeLabel } from '@/services/practiceService';

export default function QuestionTypeSelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">Tipe Soal</label>
      
      <Dropdown>
        <Dropdown.Trigger>
          <button
            type="button"
            className="w-full flex items-center justify-between border rounded-xl px-3 py-2 bg-white hover:bg-slate-50"
          >
            <span className="text-sm text-slate-800">
              {getQuestionTypeLabel(value)}
            </span>
            <FaChevronDown className="text-slate-500 text-xs" />
          </button>
        </Dropdown.Trigger>

        <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-white">
          {['multiple_choice', 'drag_drop'].map((type) => (
            <Dropdown.Item
              key={type}
              onClick={() => onChange(type)}
              className="flex items-center gap-2"
            >
              {value === type && <FaCheck className="text-xs" />}
              {getQuestionTypeLabel(type)}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown>
    </div>
  );
}