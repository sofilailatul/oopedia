import React from "react";
import Button from "@/Components/Button";
import { formatDateLabel } from "@/Features/quiz/labels";
import Icons from "@/icons";
import { router } from "@inertiajs/react";

export default function QuizSidebar({ quiz, onClose, onStart, onReview }) {
  if (!quiz) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-slate-500 text-sm">Pilih kuis untuk melihat detail.</div>
      </div>
    );
  }

const hasActive = quiz?.has_active_attempt === true;
const isDone = quiz?.can_review === true || quiz?.status === "done";
const isExpired = quiz?.end_at && new Date(quiz.end_at) < new Date();
const isAvailable = quiz?.is_available !== false;
const canStart = !isDone && !isExpired && isAvailable;
const canOpenReview = Boolean(quiz?.attempt_id);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-bold text-slate-900">{quiz.title}</div>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
              <Icons.User className="h-4 w-4" />
            </div>
            <div className="text-[12px] text-slate-600">{quiz.teacher_name ?? "Dosen"}</div>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
          ✕
        </button>
      </div>

      {/* Materi */}
      <div className="mt-5">
        <div className="text-[12px] font-semibold text-slate-700">Materi</div>
        {(!quiz.material_names || quiz.material_names.length === 0) ? (
          <div className="mt-2 text-[12px] text-slate-500">-</div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {quiz.material_names.map((name, idx) => (
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

      {/* Fields */}
      <div className="mt-6 space-y-4 text-[12px]">
        <Field label="Deadline" value={formatDateLabel(quiz.end_at)} />
        <Field label="Durasi" value={`${quiz.duration ?? 90} Menit`} icon="🕒" />
        <Field label="Jumlah" value={`${quiz.total_questions ?? 0}`} />
        <Field label="Nilai" value={quiz.score ?? "Belum Dikerjakan"} disabled />
      </div>

      {canOpenReview && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Review
          </p>
          <p className="mt-1 text-[12px] text-emerald-800">
            Pembahasan jawaban kuis tersedia.
          </p>
          <Button
            variant="solid"
            color="green"
            className="mt-3 w-full"
            onClick={() => {
              if (onReview) return onReview(quiz);
              router.get(route("quizzes.review", quiz.attempt_id));
            }}
          >
            Lihat Review
          </Button>
        </div>
      )}

      <div className="mt-auto pt-6">
        {!isDone && !isExpired && isAvailable && (
          <div className="flex items-start gap-3 text-[12px] text-slate-700">
            <span className="text-red-500">⚠</span>
            <p>
              Pertanyaan hanya bisa dijawab sekali. Pastikan jawaban Anda sebelum menekan
              <b> "Lanjut Pertanyaan Selanjutnya"</b>.
            </p>
          </div>
        )}

        {!isDone && !isExpired && !isAvailable && (
          <div className="mt-4 text-[12px] text-slate-600">
            Kuis ini terkunci. Selesaikan membaca materi dan semua latihan soal yang terkait
            terlebih dahulu.
          </div>
        )}

        {!isDone && isExpired && (
          <div className="mt-4 text-[12px] text-red-500 font-semibold">
            Batas pengerjaan sudah habis, hubungi Dosen yang bersangkutan.
          </div>
        )}

        <div className="mt-4 flex justify-end">
          {isDone ? (
            <Button
              variant="solid"
              color="green"
              disabled={!canOpenReview}
              onClick={() => {
                if (!quiz.attempt_id) return;
                if (onReview) return onReview(quiz);
                router.get(route("quizzes.review", quiz.attempt_id));
              }}
            >
              Review Kuis
            </Button>
          ) : (
            <Button
              variant="solid"
              color="blue"
              disabled={!canStart}
              onClick={() => onStart?.(quiz)}
            >
              {isAvailable ? "Kerjakan Kuis Ini" : "Terkunci"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, disabled = false, icon = null }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-3">
      <div className="text-slate-700">{label}</div>
      <div className={`border rounded-lg px-3 py-2 ${disabled ? "bg-slate-100 text-slate-500" : "bg-white"}`}>
        <div className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          <span>{value}</span>
        </div>
      </div>
    </div>
  );
}
