import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import Modal from "@/Components/Modal";
import StatusModal from "@/Components/StatusModal";

const PopupContext = createContext(null);

export function PopupProvider({ children }) {
  const [modal, setModal] = useState(null);

  const logModalEvent = useCallback((activeModal, result = {}) => {
    if (!activeModal) return;

    const payload = {
      event: "modal_closed",
      modalType: activeModal.type,
      statusType: activeModal.statusType ?? null,
      title: activeModal.title ?? "",
      success: !!result.success,
      reason: result.reason ?? "unknown",
    };
  }, []);

  const close = useCallback((result = {}) => {
    setModal((activeModal) => {
      if (activeModal) {
        logModalEvent(activeModal, result);
      }
      return null;
    });
  }, [logModalEvent]);

  const resolveAlertType = useCallback((opts) => {
    const title = String(opts?.title ?? "").toLowerCase();
    const message = String(opts?.message ?? "").toLowerCase();

    if (opts?.type === "error" || opts?.tone === "danger") return "error";
    if (title.includes("gagal") || title.includes("error")) return "error";
    if (message.includes("gagal") || message.includes("error")) return "error";
    return "success";
  }, []);

  const alert = useCallback((opts) => {
    const o = typeof opts === "string" ? { message: opts } : (opts ?? {});
    const statusType = resolveAlertType(o);

    setModal({
      type: "alert",
      statusType,
      title: o.title ?? "Info",
      message: o.message ?? "",
      confirmText: o.confirmText ?? "OK",
      onConfirm: o.onClose,
      size: o.size ?? "sm",
    });
  }, [resolveAlertType]);

  const confirm = useCallback((opts) => {
    const o = opts ?? {};
    setModal({
      type: "confirm",
      title: o.title ?? "Konfirmasi",
      message: o.message ?? "",
      confirmText: o.confirmText ?? "Ya",
      cancelText: o.cancelText ?? "Batal",
      onConfirm: o.onConfirm,
      onCancel: o.onCancel,
      size: o.size ?? "sm",
    });
  }, []);

  const open = useCallback((opts) => {
    const o = opts ?? {};
    setModal({
      type: "custom",
      title: o.title ?? "",
      content: o.content ?? null,
      size: o.size ?? "md",
      onCancel: o.onClose,
    });
  }, []);

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

  const onDismiss = () => {
    onClose({ success: false, reason: "dismiss" });
  };

  if (modal.type === "alert" || modal.type === "confirm") {
    const handleConfirm = () => {
      modal.onConfirm?.();

      const success =
        modal.type === "confirm"
          ? true
          : (modal.statusType ?? "success") !== "error";

      onClose({ success, reason: "confirm_button" });
    };

    const handleCancel = () => {
      modal.onCancel?.();
      onClose({ success: false, reason: "cancel_button" });
    };

    return (
      <StatusModal
        show={!!modal}
        type={modal.type === "confirm" ? "confirm" : (modal.statusType ?? "success")}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        onClose={onDismiss}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }

  const maxWidth =
    modal.size === "sm"
      ? "md"
      : modal.size === "lg"
      ? "2xl"
      : "xl";

  const closeCustomFromButton = () => {
    modal.onCancel?.();
    onClose({ success: true, reason: "close_button" });
  };

  return (
    <Modal show={!!modal} maxWidth={maxWidth} onClose={onDismiss}>
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="truncate text-sm font-semibold text-slate-900">{modal.title}</div>
          <button
            type="button"
            onClick={closeCustomFromButton}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
          >
            X
          </button>
        </div>

        <div className="bg-white px-6 py-5">
          {modal.type === "custom" ? modal.content : <p className="whitespace-pre-line text-sm text-slate-700">{modal.message}</p>}
        </div>

        {modal.type !== "custom" && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            {modal.type === "confirm" && (
              <button
                type="button"
                onClick={modal.onCancel}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {modal.cancelText}
              </button>
            )}

            <button
              type="button"
              onClick={modal.type === "confirm" ? modal.onConfirm : (modal.onConfirm ?? onClose)}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-sm transition hover:bg-slate-800"
            >
              {modal.confirmText ?? "OK"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
