import { useRef, useState } from 'react';
import { HiOutlineCloudArrowUp, HiOutlinePhoto } from 'react-icons/hi2';
import { FiDownload, FiX, FiMoreHorizontal } from 'react-icons/fi';

export default function UploadImage({
  label = 'Upload Image',
  helper = 'Drag and drop files here or click to upload',
  subHelper = 'Supported formats: .png, .jpeg',
  accept = 'image/*',
  file = null,
  url = null,
  onFileChange,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const next = files[0];
    if (onFileChange) {
      onFileChange(next);
    }
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

  const clearFile = () => {
    if (onFileChange) {
      onFileChange(null);
    }
  };

  const fileName = file?.name || (url ? 'Gambar section' : null);
  const fileSize = file?.size
    ? `${(file.size / 1024).toFixed(2)} KB`
    : null;

  return (
    <div className="space-y-3">
      <div
        className={
          'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ' +
          (isDragging
            ? 'border-blue-400 bg-blue-50/60'
            : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50')
        }
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-500">
          <HiOutlineCloudArrowUp className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="mt-1 text-xs text-slate-500">{helper}</p>
        {subHelper && (
          <p className="mt-1 text-[11px] text-slate-400">{subHelper}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {(fileName || url) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 border border-slate-200">
                <HiOutlinePhoto className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-800">
                  {fileName}
                </p>
                {fileSize && (
                  <p className="text-[11px] text-slate-500">{fileSize}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                  title="Download / buka"
                >
                  <FiDownload className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={clearFile}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-red-500"
                title="Hapus"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200"
                title="Opsi"
              >
                <FiMoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
