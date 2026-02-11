import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const PopupContext = createContext(null);

export function PopupProvider({ children }) {
  const [modal, setModal] = useState(null);
  // modal shape:
  // { type: "alert"|"confirm"|"custom", title, message, confirmText, cancelText, onConfirm, onCancel, content, size }

  const close = useCallback(() => setModal(null), []);

  const alert = useCallback((opts) => {
    const o = typeof opts === "string" ? { message: opts } : (opts ?? {});
    setModal({
      type: "alert",
      title: o.title ?? "Info",
      message: o.message ?? "",
      confirmText: o.confirmText ?? "OK",
      onConfirm: () => {
        o.onClose?.();
        close();
      },
      size: o.size ?? "sm",
    });
  }, [close]);

  const confirm = useCallback((opts) => {
    const o = opts ?? {};
    setModal({
      type: "confirm",
      title: o.title ?? "Konfirmasi",
      message: o.message ?? "",
      confirmText: o.confirmText ?? "Ya",
      cancelText: o.cancelText ?? "Batal",
      onConfirm: () => {
        o.onConfirm?.();
        close();
      },
      onCancel: () => {
        o.onCancel?.();
        close();
      },
      size: o.size ?? "sm",
    });
  }, [close]);

  const open = useCallback((opts) => {
    const o = opts ?? {};
    setModal({
      type: "custom",
      title: o.title ?? "",
      content: o.content ?? null,
      size: o.size ?? "md",
      onCancel: () => {
        o.onClose?.();
        close();
      },
    });
  }, [close]);

  const value = useMemo(() => ({ alert, confirm, open, close }), [alert, confirm, open, close]);

  return (
    <PopupContext.Provider value={value}>
      {children}
      <PopupModal modal={modal} onClose={close} />
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error("usePopup() harus dipakai di dalam <PopupProvider />");
  return ctx;
}

function PopupModal({ modal, onClose }) {
  if (!modal) return null;

  const sizeClass =
    modal.size === "sm"
      ? "max-w-md"
      : modal.size === "lg"
      ? "max-w-3xl"
      : "max-w-xl";

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4"
      onMouseDown={onBackdrop}
    >
      <div className={`w-full ${sizeClass} rounded-2xl bg-white shadow-xl border border-slate-200`}>
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="text-slate-900 font-bold">{modal.title}</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <div className="px-6 py-5">
          {modal.type === "custom" ? (
            modal.content
          ) : (
            <p className="text-sm text-slate-700 whitespace-pre-line">{modal.message}</p>
          )}
        </div>

        <div className="px-6 pb-5 flex items-center justify-end gap-2">
          {modal.type === "confirm" && (
            <button
              onClick={modal.onCancel}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              {modal.cancelText}
            </button>
          )}

          <button
            onClick={modal.type === "confirm" ? modal.onConfirm : (modal.onConfirm ?? onClose)}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            {modal.confirmText ?? "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
