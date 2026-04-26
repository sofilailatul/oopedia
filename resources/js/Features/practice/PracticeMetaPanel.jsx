import React from "react";
import Dropdown from "@/Components/Dropdown";
import { FaChevronDown, FaCheck } from "react-icons/fa";

function MetaItem({ label, value, children, disabled = true }) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      {children ?? (
        <div
          className={`rounded-2xl border px-3 py-3 text-[12px] font-medium shadow-sm backdrop-blur ${
            disabled
              ? "border-slate-200/80 bg-slate-100/90 text-slate-500"
              : "border-slate-200/80 bg-white/80 text-slate-700"
          }`}
        >
          <span className="block truncate">{value}</span>
        </div>
      )}
    </div>
  );
}

export default function PracticeMetaPanel({
  teacherName,
  materialName,
  typeLabel = "Multiple Choice",
  typeControl,
  enableTypeSelect = false,
  typeOptions = [],
  selectedType = "",
  onTypeChange,
  className = "",
}) {
  const showTypeSelect =
    !typeControl &&
    enableTypeSelect &&
    Array.isArray(typeOptions) &&
    typeOptions.length > 0;

  const selectedOption =
    typeOptions.find((opt) => opt.value === selectedType) ??
    typeOptions[0] ??
    { label: typeLabel, value: selectedType };

  return (
    <div className={`rounded-3xl border border-slate-200/80 bg-slate-50/65 p-4 shadow-sm ${className}`.trim()}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetaItem label="Pembuat" value={teacherName || "Dosen"} disabled />
        <MetaItem label="Materi" value={materialName || "Pilih Materi"} disabled />
        <MetaItem label="Tipe Soal" value={typeLabel} disabled={!showTypeSelect && !typeControl}>
          {typeControl}
          {showTypeSelect ? (
            <Dropdown className="w-full">
              <Dropdown.Trigger>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-[12px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <span className="truncate">{selectedOption.label}</span>
                  <FaChevronDown className="text-[11px] text-slate-400" />
                </button>
              </Dropdown.Trigger>

              <Dropdown.Content align="right" width="56" contentClasses="p-2 bg-white/95">
                {typeOptions.map((opt) => {
                  const active = opt.value === selectedType;

                  return (
                    <Dropdown.Item
                      key={opt.value}
                      onClick={() => onTypeChange?.(opt.value)}
                      className={`flex items-center justify-between px-3 py-2.5 ${
                        active
                          ? "bg-rose-100/70 text-rose-600"
                          : "text-slate-700"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {active ? <FaCheck className="text-[10px]" /> : null}
                    </Dropdown.Item>
                  );
                })}
              </Dropdown.Content>
            </Dropdown>
          ) : null}
        </MetaItem>
      </div>
    </div>
  );
}
