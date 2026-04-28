import React, { useEffect, useState } from "react";
import UploadImage from "@/Components/UploadImage";
import Field from "@/Components/Field";
import Dropdown from "@/Components/Dropdown";

export default function MultipleChoiceQuestionForm({
  question,
  questionIndex,
  subtopicOptions = [],
  materials = [],
  readOnly = false,
  onQuestionFieldChange,
  onOptionFieldChange,
  onSetCorrectOption,
  onImageChange,
  onMaterialChange,
}) {
  const q = question;

  const initialMaterialId =
    q.material_id ??
    q.materialId ??
    q.material?.id ??
    "";

  const [localMaterialId, setLocalMaterialId] = useState(initialMaterialId);

  useEffect(() => {
    setLocalMaterialId(initialMaterialId);
  }, [initialMaterialId]);

  const selectedMaterialId = localMaterialId;

  const selectedMaterial = materials.find(
    (m) => String(m.id) === String(selectedMaterialId),
  );

  const currentSubtopicOptions =
    selectedMaterial?.subtopics ??
    selectedMaterial?.sub_topics ??
    selectedMaterial?.subtopic ??
    selectedMaterial?.sub_topic ??
    subtopicOptions ??
    [];

  const selectedSubtopicId =
    q.subtopic_id ??
    q.sub_topic_id ??
    q.subtopicId ??
    q.subTopicId ??
    "";

  const selectedSubtopic = currentSubtopicOptions.find(
    (item) => String(item.id) === String(selectedSubtopicId),
  );

  const subtopicNameFromOptions =
    selectedSubtopic?.name ??
    selectedSubtopic?.subtopic_name ??
    selectedSubtopic?.sub_topic_name ??
    "";

  const subTopicValue =
    q.sub_topic_name ??
    q.subTopicName ??
    subtopicNameFromOptions ??
    q.sub_topic ??
    q.subtopic ??
    "";

  const selectedSubtopicLabel =
    subtopicNameFromOptions || subTopicValue || "Pilih sub-topik";

  const selectedMaterialLabel =
    selectedMaterial?.material_name ??
    selectedMaterial?.name ??
    selectedMaterial?.title ??
    "Pilih materi";

  const hasMaterials = materials.length > 0;
  const hasSelectedMaterial = !!selectedMaterialId;

  const handleSelectMaterial = (materialId) => {
    setLocalMaterialId(materialId);

    onMaterialChange?.(questionIndex, materialId);

    onQuestionFieldChange?.(questionIndex, "material_id", materialId);
    onQuestionFieldChange?.(questionIndex, "subtopic_id", null);
  };

  const handleSelectSubtopic = (subtopicId) => {
    onQuestionFieldChange?.(questionIndex, "subtopic_id", subtopicId);
  };

  return (
    <div className="space-y-5 px-5 py-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        {readOnly ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-slate-500">
                Teks Soal
              </p>

              <div className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-[12px] text-slate-800">
                <p className="whitespace-pre-wrap text-[12px] text-slate-800">
                  {q.question_text || "-"}
                </p>
              </div>
            </div>

            {hasMaterials && (
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-500">
                  Materi
                </p>

                <div className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-[12px] text-slate-800">
                  {selectedMaterialLabel || "-"}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-[11px] font-medium text-slate-500">
                Sub-topik
              </p>

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
              value={q.question_text || ""}
              onChange={(e) =>
                onQuestionFieldChange?.(
                  questionIndex,
                  "question_text",
                  e.target.value,
                )
              }
              placeholder="Tulis pertanyaan yang jelas dan singkat..."
            />

            <div className={hasMaterials ? "grid grid-cols-2 gap-3" : ""}>
              {hasMaterials && (
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-medium text-slate-500">
                    Materi
                  </p>

                  <Dropdown className="w-full">
                    <Dropdown.Trigger>
                      <button
                        type="button"
                        className="flex w-full min-w-0 items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-[12px] text-slate-800 shadow-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      >
                        <span className="block min-w-0 truncate pr-2">
                          {selectedMaterialLabel}
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
                        onClick={() => handleSelectMaterial(null)}
                        className={!selectedMaterialId ? "bg-slate-100" : ""}
                      >
                        Pilih materi
                      </Dropdown.Item>

                      {materials.map((m) => (
                        <Dropdown.Item
                          key={m.id}
                          onClick={() => handleSelectMaterial(m.id)}
                          className={
                            String(m.id) === String(selectedMaterialId)
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : ""
                          }
                        >
                          {m.material_name ?? m.name ?? m.title}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Content>
                  </Dropdown>
                </div>
              )}

              {(hasMaterials ? hasSelectedMaterial : true) && (
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-medium text-slate-500">
                    Sub-topik
                  </p>

                  <Dropdown className="w-full">
                    <Dropdown.Trigger>
                      <button
                        type="button"
                        className="flex w-full min-w-0 items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-[12px] text-slate-800 shadow-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      >
                        <span className="block min-w-0 truncate pr-2">
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
                        onClick={() => handleSelectSubtopic(null)}
                        className={!selectedSubtopicId ? "bg-slate-100" : ""}
                      >
                        Pilih sub-topik
                      </Dropdown.Item>

                      {currentSubtopicOptions.length === 0 ? (
                        <div className="px-3 py-2 text-[12px] italic text-slate-400">
                          Sub-topik belum tersedia di materi ini.
                        </div>
                      ) : (
                        currentSubtopicOptions.map((item) => (
                          <Dropdown.Item
                            key={item.id}
                            onClick={() =>
                              handleSelectSubtopic(Number(item.id))
                            }
                            className={
                              String(item.id) === String(selectedSubtopicId)
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : ""
                            }
                          >
                            {item.name ??
                              item.subtopic_name ??
                              item.sub_topic_name ??
                              item.title}
                          </Dropdown.Item>
                        ))
                      )}
                    </Dropdown.Content>
                  </Dropdown>
                </div>
              )}

              {hasMaterials && !hasSelectedMaterial && (
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-medium text-slate-500">
                    Sub-topik
                  </p>

                  <div className="flex h-[38px] items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-400">
                    Pilih materi terlebih dahulu
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
            <>
            <UploadImage
              label="Upload Image"
              helper="Drag and drop files here or click to upload"
              subHelper="Supported formats: .png, .jpeg"
              file={q.imageFile}
              url={q.imageUrl || q.image_url}
              onFileChange={(payload) => onImageChange?.(questionIndex, payload)}
            />
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-slate-500">
            Opsi Jawaban
          </p>

          {!readOnly && (
            <span className="text-[10px] font-normal text-slate-400">
              Pilih satu jawaban yang benar
            </span>
          )}
        </div>

        <div className="space-y-3">
          {(q.options || []).map((opt, optIdx) => {
            const isCorrect = !!opt.is_correct;
            const optionLabel = String.fromCharCode(65 + optIdx);

            return (
              <div
                key={opt.id ?? optIdx}
                className={`group rounded-2xl border p-3 shadow-sm transition ${
                  isCorrect
                    ? "border-emerald-300 bg-emerald-50/70"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isCorrect
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {optionLabel}
                  </div>

                  <div className="min-w-0 flex-1">
                    {readOnly ? (
                      <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-slate-800">
                        {opt.text || "-"}
                      </p>
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
                        placeholder={`Masukkan jawaban ${optionLabel}`}
                        className="w-full rounded-xl border border-transparent bg-transparent px-0 py-1 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-slate-200 focus:bg-white focus:px-3 focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                      />
                    )}
                  </div>

                  {readOnly ? (
                    isCorrect && (
                      <span className="shrink-0 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                        Benar
                      </span>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSetCorrectOption?.(questionIndex, optIdx)}
                      className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-medium transition ${
                        isCorrect
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-700"
                      }`}
                    >
                      {isCorrect ? "Jawaban benar" : "Jadikan benar"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-slate-500">
            Feedback jawaban BENAR
          </p>

          {readOnly ? (
            <div className="flex min-h-[48px] items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-800">
              <p className="text-[11px] text-slate-800">
                {q.feedback_correct || q.feedbackCorrect || "-"}
              </p>
            </div>
          ) : (
            <Field
              as="textarea"
              rows={2}
              value={q.feedbackCorrect || ""}
              onChange={(e) =>
                onQuestionFieldChange?.(
                  questionIndex,
                  "feedbackCorrect",
                  e.target.value,
                )
              }
              placeholder="Contoh: Keren! Penjelasan kamu tepat."
            />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-medium text-slate-500">
            Feedback jawaban SALAH
          </p>

          {readOnly ? (
            <div className="flex min-h-[48px] items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-800">
              <p className="text-[11px] text-slate-800">
                {q.feedback_incorrect || q.feedbackIncorrect || "-"}
              </p>
            </div>
          ) : (
            <Field
              as="textarea"
              rows={2}
              value={q.feedbackIncorrect || ""}
              onChange={(e) =>
                onQuestionFieldChange?.(
                  questionIndex,
                  "feedbackIncorrect",
                  e.target.value,
                )
              }
              placeholder="Contoh: Coba cek lagi konsep utama di paragraf 2."
            />
          )}
        </div>
      </div>
    </div>
  );
}