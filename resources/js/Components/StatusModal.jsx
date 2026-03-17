import Button from "@/Components/Button";
import Modal from "@/Components/Modal";

const STATUS_MAP = {
  success: {
    fallbackTitle: "Berhasil",
    fallbackConfirmText: "OK",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-600" fill="none" aria-hidden="true">
        <path d="M20 7L9 18l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    iconBg: "bg-emerald-100",
  },
  error: {
    fallbackTitle: "Terjadi Kesalahan",
    fallbackConfirmText: "Tutup",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-rose-600" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 8v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="16.8" r="1.2" fill="currentColor" />
      </svg>
    ),
    iconBg: "bg-rose-100",
  },
  confirm: {
    fallbackTitle: "Konfirmasi",
    fallbackConfirmText: "Konfirmasi",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-amber-600" fill="none" aria-hidden="true">
        <path d="M12 3l9 16H3L12 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="1.2" fill="currentColor" />
      </svg>
    ),
    iconBg: "bg-amber-100",
  },
};

export default function StatusModal({
  type = "success",
  title,
  message,
  onClose,
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Batal",
  show = true,
}) {
  const config = STATUS_MAP[type] ?? STATUS_MAP.success;
  const resolvedTitle = title ?? config.fallbackTitle;
  const resolvedConfirmText = confirmText || config.fallbackConfirmText;
  const isConfirm = type === "confirm";

  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const footer = isConfirm ? (
    <>
      <Button type="button" variant="outline" color="blue" onClick={handleCancel} className="min-w-[120px]">
        {cancelText}
      </Button>
      <Button type="button" variant="solid" color="blue" onClick={handleConfirm} className="min-w-[120px]">
        {resolvedConfirmText}
      </Button>
    </>
  ) : (
    <Button
      type="button"
      variant="solid"
      color={type === "error" ? "red" : "blue"}
      onClick={handleConfirm}
      className="min-w-[140px]"
    >
      {type === "error" ? "Tutup" : resolvedConfirmText}
    </Button>
  );

  return (
    <Modal show={show} onClose={onClose} maxWidth="md" closeable={!isConfirm}>
      <div className="bg-white px-6 py-7 sm:px-8 sm:py-8">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${config.iconBg}`}>
            {config.icon}
          </div>

          <h3 className="text-xl font-bold tracking-tight text-slate-900">{resolvedTitle}</h3>

          {message ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{message}</p>
          ) : null}

          <div className="mt-7 flex w-full items-center justify-center gap-3">{footer}</div>
        </div>
      </div>
    </Modal>
  );
}
