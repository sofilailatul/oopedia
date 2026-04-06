import React from "react";
import UploadImage from "@/Components/UploadImage";
import Field from "@/Components/Field";

export default function MultipleChoiceQuestionForm({
  question,
  questionIndex,
  readOnly = false,
  onQuestionFieldChange,
  onOptionFieldChange,
  onSetCorrectOption,
  onImageChange,
}) {
  const q = question;

  return (
    <div className="space-y-5 px-5 py-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        {readOnly ? (
          <div className="space-y-4">
            <p className="text-[11px] font-medium text-slate-500">Teks Soal</p>
            <div className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-[12px] text-slate-800">
              <p className="whitespace-pre-wrap text-[12px] text-slate-800">{q.question_text || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-medium text-slate-500">Sub-topik</p>
              <div className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-[12px] text-slate-800">
                {q.sub_topic || "-"}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Field
              as="textarea"
              label="Teks Soal"
              rows={3}
              value={q.question_text}
              onChange={(e) => onQuestionFieldChange?.(questionIndex, "question_text", e.target.value)}
              placeholder="Tulis pertanyaan yang jelas dan singkat..."
            />

            <Field
              label="Sub-topik"
              value={q.sub_topic || ""}
              onChange={(e) => onQuestionFieldChange?.(questionIndex, "sub_topic", e.target.value)}
              placeholder="Contoh: Encapsulation"
            />
          </div>
        )}

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

      <div className="space-y-2">
        <p className="flex items-center justify-between text-[11px] font-medium text-slate-500">
          <span>Opsi Jawaban</span>
          {!readOnly && (
            <span className="text-[10px] font-normal text-slate-400">Pilih satu jawaban yang benar</span>
          )}
        </p>

        <div className="space-y-2">
          {(q.options || []).map((opt, optIdx) => {
            const isCorrect = !!opt.is_correct;
            return (
              <div
                key={opt.id ?? optIdx}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
                  isCorrect ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"
                }`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] text-slate-500">
                  {String.fromCharCode(65 + optIdx)}
                </span>

                {readOnly ? (
                  <span className="flex-1 text-[12px] text-slate-800">{opt.text}</span>
                ) : (
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => onOptionFieldChange?.(questionIndex, optIdx, "text", e.target.value)}
                    placeholder={`Masukkan Kalimat Jawaban ${String.fromCharCode(65 + optIdx)}`}
                    className="flex-1 border-none bg-transparent text-sm text-slate-800 focus:outline-none"
                  />
                )}

                {readOnly ? (
                  isCorrect && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      Benar
                    </span>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => onSetCorrectOption?.(questionIndex, optIdx)}
                    className="ml-2 rounded-full border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-600 hover:bg-emerald-50"
                  >
                    {isCorrect ? "Benar" : "Jadikan benar"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-slate-500">Feedback jawaban BENAR</p>
          {readOnly ? (
            <div className="flex min-h-[48px] items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-[9px] text-slate-800">
              <p className="text-[12px] text-slate-800">{q.feedback_correct || q.feedbackCorrect || "-"}</p>
            </div>
          ) : (
            <Field
              as="textarea"
              rows={2}
              value={q.feedbackCorrect}
              onChange={(e) => onQuestionFieldChange?.(questionIndex, "feedbackCorrect", e.target.value)}
              placeholder="Contoh: Keren! Penjelasan kamu tepat."
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
            <Field
              as="textarea"
              rows={2}
              value={q.feedbackIncorrect}
              onChange={(e) => onQuestionFieldChange?.(questionIndex, "feedbackIncorrect", e.target.value)}
              placeholder="Contoh: Coba cek lagi konsep utama di paragraf 2."
            />
          )}
        </div>
      </div>
    </div>
  );
}
