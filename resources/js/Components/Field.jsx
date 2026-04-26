import React from "react";

/**
 * Generic field row used to display a label + value pair.
 *
 * Variants handled via props:
 * - disabled: true/false → menentukan gaya enable/disable
 * - icon: React node opsional di dalam value (bisa emoji atau ikon lain)
 */
export default function Field({
  label,
  value,
  disabled = false,
  icon = null,
  className = "",
  as = null,
  rows = 3,
  helper = "",
  inputClassName = "",
  ...props
}) {
  if (as) {
    const InputComponent = as;

    return (
      <div className={`space-y-1 ${className}`}>
        <label className="text-[11px] font-medium text-slate-500">{label}</label>
        <div
          className={`rounded-2xl border px-3 py-2 text-[12px] transition-colors ${
            disabled
              ? "border-slate-200 bg-slate-100 text-slate-500"
              : "border-slate-200 bg-white text-slate-800"
          }`}
        >
          {icon ? <span className="mb-1 inline-block shrink-0">{icon}</span> : null}
          <InputComponent
            value={value}
            disabled={disabled}
            rows={as === "textarea" ? rows : undefined}
            className={`w-full border-none bg-transparent text-[12px] text-inherit focus:outline-none focus:ring-0 ${
              as === "textarea" ? "resize-y min-h-[84px]" : ""
            } ${inputClassName}`}
            {...props}
          />
        </div>
        {helper ? <p className="text-[11px] text-slate-400">{helper}</p> : null}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-[70px_1fr] items-center gap-2 ${className}`}>
      <div className="text-slate-700 text-[12px] font-medium">{label}</div>
      <div
        className={`border rounded-lg px-3 py-2 text-[11px] flex items-center gap-2 transition-colors ${
          disabled
            ? "bg-slate-100 text-slate-500 border-slate-200"
            : "bg-white text-slate-800 border-slate-200"
        }`}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}
