import React from "react";
import UploadImage from "@/Components/UploadImage";
import Field from "@/Components/Field";
import Dropdown from "@/Components/Dropdown";

export default function MultipleChoiceQuestionForm({
  question,
  questionIndex,
  subtopicOptions = [],
  readOnly = false,
  onQuestionFieldChange,
  onOptionFieldChange,
  onSetCorrectOption,
  onImageChange,
}) {
  const q = question;
  const selectedSubtopicId = q.subtopic_id ?? q.sub_topic_id ?? "";

  const subtopicNameFromOptions = subtopicOptions.find((item) =>
    String(item.id) === String(selectedSubtopicId),
  )?.name;
  const subTopicValue =
    q.sub_topic_name ??
    q.subTopicName ??
    subtopicNameFromOptions ??
    q.sub_topic ??
    q.subtopic ??
    q.subTopic ??
    "";
  const selectedSubtopicLabel = subtopicNameFromOptions || subTopicValue || "Pilih sub-topik";

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
                {subTopicValue || "-"}
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

            <div className="space-y-1">
              <p className="text-[11px] font-medium text-slate-500">Sub-topik</p>
              <Dropdown>
                <Dropdown.Trigger>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    <span className="truncate pr-2">{selectedSubtopicLabel}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 text-slate-400"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </Dropdown.Trigger>
                <Dropdown.Content>
                  <Dropdown.Item
                    onClick={() => onQuestionFieldChange?.(questionIndex, "subtopic_id", null)}
                    className={!selectedSubtopicId ? "bg-slate-100" : ""}
                  >
                    Pilih sub-topik
                  </Dropdown.Item>

                  {subtopicOptions.length === 0 ? (
                    <div className="px-3 py-2 text-[12px] text-slate-400">
                      Sub-topik belum tersedia di materi ini.
                    </div>
                  ) : (
                    subtopicOptions.map((item) => (
                      <Dropdown.Item
                        key={item.id}
                        onClick={() =>
                          onQuestionFieldChange?.(questionIndex, "subtopic_id", Number(item.id))
                        }
                        className={
                          String(item.id) === String(selectedSubtopicId) ? "bg-slate-100" : ""
                        }
                      >
                        {item.name}
                      </Dropdown.Item>
                    ))
                  )}
                </Dropdown.Content>
              </Dropdown>
            </div>
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
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-[12px] transition ${
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
                    className="flex-1 border-none bg-transparent text-[12px] text-slate-800 focus:outline-none"
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
            <div className="flex min-h-[48px] items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-800">
              <p className="text-[11px] text-slate-800">{q.feedback_correct || q.feedbackCorrect || "-"}</p>
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
            <div className="flex min-h-[48px] items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-800">
              <p className="text-[11px] text-slate-800">{q.feedback_incorrect || q.feedbackIncorrect || "-"}</p>
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
