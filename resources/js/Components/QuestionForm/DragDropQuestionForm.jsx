import React from "react";
import UploadImage from "@/Components/UploadImage";
import Button from "@/Components/Button";
import Dropdown from "@/Components/Dropdown";

export default function DragDropQuestionForm({
  question,
  questionIndex,
  subtopicOptions = [],
  readOnly = false,
  onQuestionFieldChange,
  onOptionFieldChange,
  onAddCodeBlock,
  onRemoveCodeBlock,
  onImageChange,
}) {
  const q = question;

  const selectedSubtopicId =
    q.subtopic_id ??
    q.sub_topic_id ??
    q.subtopicId ??
    q.subTopicId ??
    "";

  const subtopicNameFromOptions =
    subtopicOptions.find(
      (item) => String(item.id) === String(selectedSubtopicId),
    )?.name ??
    subtopicOptions.find(
      (item) => String(item.id) === String(selectedSubtopicId),
    )?.subtopic_name ??
    subtopicOptions.find(
      (item) => String(item.id) === String(selectedSubtopicId),
    )?.sub_topic_name;

  const subTopicValue =
    q.sub_topic_name ??
    q.subTopicName ??
    subtopicNameFromOptions ??
    q.sub_topic ??
    q.subtopic ??
    "";

  const selectedSubtopicLabel =
    subtopicNameFromOptions || subTopicValue || "Pilih sub-topik";

  return (
    <div className="space-y-5 px-5 py-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-slate-500">
            Question Text
          </p>

          {readOnly ? (
            <div className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-[12px] text-slate-800">
              <p className="whitespace-pre-wrap text-[12px] text-slate-800">
                {q.question_text || "-"}
              </p>
            </div>
          ) : (
            <textarea
              rows={3}
              value={q.question_text || ""}
              onChange={(e) =>
                onQuestionFieldChange?.(
                  questionIndex,
                  "question_text",
                  e.target.value,
                )
              }
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="Enter your question here..."
            />
          )}

          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-medium text-slate-500">
              Sub-topik
            </p>

            {readOnly ? (
              <div className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-[12px] text-slate-800">
                {subTopicValue || "-"}
              </div>
            ) : (
              <Dropdown className="w-full">
                <Dropdown.Trigger>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800"
                  >
                    <span className="truncate pr-2">
                      {selectedSubtopicLabel}
                    </span>

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 shrink-0 text-slate-400"
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

                <Dropdown.Content align="left" width="full">
                  <Dropdown.Item
                    onClick={() =>
                      onQuestionFieldChange?.(
                        questionIndex,
                        "subtopic_id",
                        null,
                      )
                    }
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
                          onQuestionFieldChange?.(
                            questionIndex,
                            "subtopic_id",
                            Number(item.id),
                          )
                        }
                        className={
                          String(item.id) === String(selectedSubtopicId)
                            ? "bg-slate-100"
                            : ""
                        }
                      >
                        {item.name ??
                          item.subtopic_name ??
                          item.sub_topic_name}
                      </Dropdown.Item>
                    ))
                  )}
                </Dropdown.Content>
              </Dropdown>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-medium text-slate-500">
              Code Snippet
            </p>

            {readOnly ? (
              <div className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-[12px] text-slate-800">
                {q.code_snippet || q.outputCode || "-"}
              </div>
            ) : (
              <input
                type="text"
                value={q.outputCode || ""}
                onChange={(e) =>
                  onQuestionFieldChange?.(
                    questionIndex,
                    "outputCode",
                    e.target.value,
                  )
                }
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="Define expected output if applicable..."
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium text-slate-500">
            Gambar Pendukung{" "}
            <span className="font-normal text-slate-400">(opsional)</span>
          </p>

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
              <p className="text-[11px] text-slate-400">
                Tidak ada gambar untuk soal ini.
              </p>
            )
          ) : (
            <UploadImage
              label="Upload Image"
              helper="Drag and drop files here or click to upload"
              subHelper="Supported formats: .png, .jpeg"
              file={q.imageFile}
              url={q.imageUrl || q.image_url}
              onFileChange={(payload) =>
                onImageChange?.(questionIndex, payload)
              }
            />
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-700">
            Code Block
          </p>
          <p className="text-[11px] text-rose-500">
            *Letakkan jawaban dengan urutan yang benar
          </p>
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
                <span className="flex-1 text-sm text-slate-800">
                  {opt.text}
                </span>
              ) : (
                <input
                  type="text"
                  value={opt.text || ""}
                  onChange={(e) =>
                    onOptionFieldChange?.(
                      questionIndex,
                      optIdx,
                      "text",
                      e.target.value,
                    )
                  }
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
          <p className="text-[11px] font-medium text-slate-500">
            Feedback jawaban BENAR
          </p>

          {readOnly ? (
            <div className="flex min-h-[48px] items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-[9px] text-slate-800">
              <p className="text-[12px] text-slate-800">
                {q.feedback_correct || q.feedbackCorrect || "-"}
              </p>
            </div>
          ) : (
            <textarea
              rows={2}
              value={q.feedbackCorrect || ""}
              onChange={(e) =>
                onQuestionFieldChange?.(
                  questionIndex,
                  "feedbackCorrect",
                  e.target.value,
                )
              }
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="Contoh: Urutan kode kamu sudah tepat."
            />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-medium text-slate-500">
            Feedback jawaban SALAH
          </p>

          {readOnly ? (
            <div className="flex min-h-[48px] items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-[9px] text-slate-800">
              <p className="text-[12px] text-slate-800">
                {q.feedback_incorrect || q.feedbackIncorrect || "-"}
              </p>
            </div>
          ) : (
            <textarea
              rows={2}
              value={q.feedbackIncorrect || ""}
              onChange={(e) =>
                onQuestionFieldChange?.(
                  questionIndex,
                  "feedbackIncorrect",
                  e.target.value,
                )
              }
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="Contoh: Coba susun ulang berdasarkan alur eksekusi kode."
            />
          )}
        </div>
      </div>
    </div>
  );
}