import React from "react";
import UploadImage from "@/Components/UploadImage";
import Button from "@/Components/Button";

export default function DragDropQuestionForm({
  question,
  questionIndex,
  readOnly = false,
  onQuestionFieldChange,
  onOptionFieldChange,
  onAddCodeBlock,
  onRemoveCodeBlock,
  onImageChange,
}) {
  const q = question;

  return (
    <div className="space-y-5 px-5 py-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-slate-500">Question Text</p>
          {readOnly ? (
            <div className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-[12px] text-slate-800">
              <p className="whitespace-pre-wrap text-[12px] text-slate-800">{q.question_text || "-"}</p>
            </div>
          ) : (
            <textarea
              rows={3}
              value={q.question_text}
              onChange={(e) => onQuestionFieldChange?.(questionIndex, "question_text", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="Enter your question here..."
            />
          )}

          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-medium text-slate-500">Sub-topik</p>
            {readOnly ? (
              <div className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-[12px] text-slate-800">
                {q.sub_topic || "-"}
              </div>
            ) : (
              <input
                type="text"
                value={q.sub_topic || ""}
                onChange={(e) => onQuestionFieldChange?.(questionIndex, "sub_topic", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="Contoh: Polymorphism"
              />
            )}
          </div>

          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-medium text-slate-500">Output Code</p>
            {readOnly ? (
              <div className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-[12px] text-slate-800">
                {q.output_code || q.outputCode || "-"}
              </div>
            ) : (
              <input
                type="text"
                value={q.outputCode || ""}
                onChange={(e) => onQuestionFieldChange?.(questionIndex, "outputCode", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="Define expected output if applicable..."
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium text-slate-500">Gambar Pendukung (opsional)</p>
          {readOnly ? (
            q.image_url || q.imageUrl ? (
              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-3">
                <img
                  src={q.image_url || q.imageUrl}
                  alt="Gambar soal"
                  className="max-h-40 rounded-lg border object-contain"
                />
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">Tidak ada gambar untuk soal ini.</p>
            )
          ) : (
            <>
              <UploadImage
                label="Upload Image"
                helper="Drag and drop files here or click to upload"
                subHelper="Supported formats: .png, .jpeg"
                file={q.imageFile}
                url={q.imageUrl}
                onFileChange={(file) => onImageChange?.(questionIndex, file)}
              />
              {q.imageUrl && (
                <div className="mt-3">
                  <img
                    src={q.imageUrl}
                    alt="Gambar soal"
                    className="max-h-40 rounded-lg border object-contain"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-700">Code Block</p>
          <p className="text-[11px] text-rose-500">*Letakkan jawaban dengan urutan yang benar</p>
        </div>

        <div className="space-y-2">
          {(q.options || []).map((opt, optIdx) => (
            <div
              key={opt.id ?? optIdx}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
            >
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-blue-100 px-1 text-[11px] font-semibold text-blue-600">
                {optIdx + 1}
              </span>

              {readOnly ? (
                <span className="flex-1 text-sm text-slate-800">{opt.text}</span>
              ) : (
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => onOptionFieldChange?.(questionIndex, optIdx, "text", e.target.value)}
                  placeholder="Masukkan potongan kode"
                  className="flex-1 border-none bg-transparent text-sm text-slate-800 focus:outline-none"
                />
              )}

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onRemoveCodeBlock?.(questionIndex, optIdx)}
                  disabled={(q.options || []).length <= 2}
                  className="rounded-md px-2 py-1 text-sm text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              color="blue"
              size="sm"
              onClick={() => onAddCodeBlock?.(questionIndex)}
            >
              + Tambah Baris Kode
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-slate-500">Feedback jawaban BENAR</p>
          {readOnly ? (
            <div className="flex min-h-[48px] items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-[9px] text-slate-800">
              <p className="text-[12px] text-slate-800">{q.feedback_correct || q.feedbackCorrect || "-"}</p>
            </div>
          ) : (
            <textarea
              rows={2}
              value={q.feedbackCorrect || ""}
              onChange={(e) => onQuestionFieldChange?.(questionIndex, "feedbackCorrect", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="Contoh: Urutan kode kamu sudah tepat."
            />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-medium text-slate-500">Feedback jawaban SALAH</p>
          {readOnly ? (
            <div className="flex min-h-[48px] items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-[9px] text-slate-800">
              <p className="text-[12px] text-slate-800">{q.feedback_incorrect || q.feedbackIncorrect || "-"}</p>
            </div>
          ) : (
            <textarea
              rows={2}
              value={q.feedbackIncorrect || ""}
              onChange={(e) => onQuestionFieldChange?.(questionIndex, "feedbackIncorrect", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="Contoh: Coba susun ulang berdasarkan alur eksekusi kode."
            />
          )}
        </div>
      </div>
    </div>
  );
}
