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
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6 bg-slate-900/30"
      onMouseDown={onBackdrop}
    >
      <div className={`w-full ${sizeClass} rounded-3xl bg-white shadow-[0_18px_55px_rgba(15,23,42,0.18)] border border-slate-200/80 overflow-hidden`}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="text-sm font-semibold text-slate-900 truncate">{modal.title}</div>
          <button
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-white transition"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 bg-white">
          {modal.type === "custom" ? (
            modal.content
          ) : (
            <p className="text-sm text-slate-700 whitespace-pre-line">{modal.message}</p>
          )}
        </div>

        {modal.type !== "custom" && (
          <div className="px-6 py-4 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70">
            {modal.type === "confirm" && (
              <button
                onClick={modal.onCancel}
                className="px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50 hover:border-slate-300 transition"
              >
                {modal.cancelText}
              </button>
            )}

            <button
              onClick={modal.type === "confirm" ? modal.onConfirm : (modal.onConfirm ?? onClose)}
              className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm hover:bg-slate-800 shadow-sm transition"
            >
              {modal.confirmText ?? "OK"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
