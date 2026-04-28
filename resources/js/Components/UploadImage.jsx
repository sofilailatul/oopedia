import { useEffect, useRef, useState } from "react";
import { HiOutlineCloudArrowUp } from "react-icons/hi2";
import { FiDownload, FiX, FiMoreHorizontal } from "react-icons/fi";
import { createImagePayload } from "@/Features/questionImage";

export default function UploadImage({
  label = "Upload Image",
  helper = "Drag and drop files here or click to upload",
  subHelper = "Supported formats: .png, .jpeg",
  accept = "image/*",
  file = null,
  url = null,
  onFileChange,
  onRemove,
  onDeleteFromServer,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(url || null);

  useEffect(() => {
    if (file && (file instanceof Blob || file instanceof File)) {
      try {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      } catch (err) {
        console.error("Failed to create object URL:", err);
      }
    }

    setPreviewUrl(url || null);
  }, [file, url]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;

    const nextFile = files[0];

    if (!nextFile.type.startsWith("image/")) {
      return;
    }

    onFileChange?.(createImagePayload(nextFile));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const clearFile = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    onFileChange?.(createImagePayload(null));

    if (url && onDeleteFromServer) {
      onDeleteFromServer();
    }

    onRemove?.();
  };

  const downloadImage = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!previewUrl) return;

    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = file?.name || "image";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const fileName = file?.name || (url ? "Gambar soal" : null);

  const fileSize = file?.size
    ? `${(file.size / 1024).toFixed(2)} KB`
    : null;

  const hasImage = !!previewUrl;

  return (
    <div className="space-y-3">
      <div
        className={[
          "relative flex min-h-[250px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition",
          isDragging
            ? "border-blue-400 bg-blue-50/60"
            : hasImage
              ? "border-slate-200 bg-white hover:border-slate-300"
              : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50",
        ].join(" ")}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasImage ? (
          <>
            <img
              src={previewUrl}
              alt={fileName || "Preview gambar"}
              className="h-full max-h-[280px] w-full object-contain p-3"
            />

            <div className="absolute inset-x-3 bottom-3 rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 text-left">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {fileName}
                  </p>

                  {fileSize && (
                    <p className="text-[11px] text-slate-500">
                      {fileSize}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={downloadImage}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    title="Download gambar"
                  >
                    <FiDownload className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={clearFile}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500"
                    title="Hapus gambar"
                  >
                    <FiX className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClick();
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    title="Ganti gambar"
                  >
                    <FiMoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-8">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <HiOutlineCloudArrowUp className="h-7 w-7" />
            </div>

            <p className="text-sm font-semibold text-slate-900">
              {label}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {helper}
            </p>

            {subHelper && (
              <p className="mt-1 text-[11px] text-slate-400">
                {subHelper}
              </p>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}