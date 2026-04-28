import React from "react";

export default function CheckboxCard({
  label,
  checked = false,
  onClick,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
        checked
          ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      } ${className}`}
    >
      <span className="truncate pr-2">{label}</span>

      <div
        className={`flex h-4 w-4 items-center justify-center rounded-md border transition-colors ${
          checked
            ? "border-blue-500 bg-blue-500"
            : "border-slate-300 bg-white"
        }`}
      >
        {checked && (
          <svg
            className="h-2.5 w-2.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
    </button>
  );
}