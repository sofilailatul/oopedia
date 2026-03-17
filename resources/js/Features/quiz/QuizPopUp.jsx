import React, { useEffect, useRef } from "react";
import { usePopup } from "@/Components/PopUp/PopUpProvider";
import Button from "@/Components/Button";
import Icons from "@/icons"; // kalau punya, kalau tidak ada hapus dan pakai emoji

function BaseCard({ icon, iconBg = "bg-slate-100", title, titleClass = "text-slate-900", children, actions }) {
  return (
    <div className="py-2">
      <div className="flex flex-col items-center text-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>

        <div className={`text-sm font-bold ${titleClass}`}>{title}</div>

        <div className="text-[13px] text-slate-700 leading-relaxed">{children}</div>

        {actions && <div className="pt-3 flex items-center justify-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function CorrectPopup({ message, subMessage }) {
  return (
    <BaseCard
      icon={<span className="text-green-600 text-2xl">✓</span>}
      iconBg="bg-green-100"
      title="Jawaban Benar!"
      titleClass="text-green-700"
    >
      <div className="font-semibold">{message}</div>
      {subMessage ? <div className="mt-2 text-slate-600">{subMessage}</div> : null}
    </BaseCard>
  );
}

export function WrongPopup({ message, explanation }) {
  return (
    <BaseCard
      icon={<span className="text-red-600 text-2xl">✕</span>}
      iconBg="bg-red-100"
      title="Jawaban Salah"
      titleClass="text-red-600"
    >
      <div className="font-semibold">{message}</div>
      {explanation ? <div className="mt-2 text-slate-600">{explanation}</div> : null}
    </BaseCard>
  );
}

export function ExitConfirmPopup({ onConfirm, onCancel }) {
  return (
    <BaseCard
      icon={<span className="text-slate-800 text-2xl">?</span>}
      iconBg="bg-slate-100"
      title="Yakin ingin Keluar ?"
      titleClass="text-slate-900"
      actions={
        <>
          <Button onClick={onConfirm} color="red" size="sm">
            Keluar
          </Button>
          <Button onClick={onCancel} color="gray" size="sm">
            Batal
          </Button>
        </>
      }
    >
      Jika keluar sekarang, jawaban Anda tidak akan tersimpan
    </BaseCard>
  );
}

export function SubmitConfirmPopup({ onConfirm, onCancel }) {
  return (
    <BaseCard
      icon={<span className="text-slate-800 text-2xl">?</span>}
      iconBg="bg-slate-100"
      title="Yakin ingin dikumpulkan?"
      titleClass="text-slate-900"
      actions={
        <>
          <Button onClick={onConfirm} color="red" size="sm">
            Submit
          </Button>
          <Button onClick={onCancel} color="gray" size="sm">
            Batal
          </Button>
        </>
      }
    >
      Anda tidak dapat mengulang kuis ini setelah submit
    </BaseCard>
  );
}

/**
 * Wrapper yang auto-close popup setelah `ms` milidetik
 * dan memanggil `onDone` ketika tertutup (oleh timer ATAU klik backdrop).
 */
function AutoCloseWrapper({ children, ms = 10000, onDone, closeFn }) {
  const fired = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fired.current) {
        fired.current = true;
        closeFn();
        onDone?.();
      }
    }, ms);
    return () => clearTimeout(timer);
  }, [ms, onDone, closeFn]);

  /* PopupProvider sudah memanggil closeFn ketika klik backdrop.
     Kita perlu panggil onDone juga saat itu. Kita pakai cleanup effect: */
  useEffect(() => {
    return () => {
      /* dipanggil saat komponen unmount (popup ditutup) */
      if (!fired.current) {
        fired.current = true;
        onDone?.();
      }
    };
  }, [onDone]);

  return <>{children}</>;
}

/**
 * Helper hook biar tinggal panggil:
 * popups.showCorrect(...)
 * popups.showWrong(...)
 * popups.showFeedback(...)   ← auto-close + onDone callback
 * popups.confirmExit(...)
 * popups.confirmSubmit(...)
 */
export function useQuizPopups() {
  const popup = usePopup();

  return {
    showCorrect: ({ message, subMessage }) => {
      popup.open({
        title: "Benar - Kuis - Pop Up",
        size: "sm",
        content: <CorrectPopup message={message} subMessage={subMessage} />,
      });
    },

    showWrong: ({ message, explanation }) => {
      popup.open({
        title: "Salah - Kuis - Pop Up",
        size: "sm",
        content: <WrongPopup message={message} explanation={explanation} />,
      });
    },

    /**
     * Tampilkan popup feedback (benar/salah) lalu auto-close setelah 10 detik
     * atau ketika klik di luar popup. Setelah tertutup, panggil onDone.
     */
    showFeedback: ({ isCorrect, feedback, onDone, ms = 10000 }) => {
      popup.open({
        title: "",
        size: "sm",
        onClose: () => {}, // handled by AutoCloseWrapper
        content: (
          <AutoCloseWrapper ms={ms} onDone={onDone} closeFn={() => popup.close()}>
            {isCorrect ? (
              <CorrectPopup message={feedback || "Jawaban Anda benar!"} />
            ) : (
              <WrongPopup message={feedback || "Jawaban Anda salah."} />
            )}
          </AutoCloseWrapper>
        ),
      });
    },

    confirmExit: ({ onConfirm }) => {
      popup.open({
        title: "",
        size: "sm",
        content: (
          <ExitConfirmPopup
            onConfirm={() => {
              popup.close();
              onConfirm?.();
            }}
            onCancel={() => popup.close()}
          />
        ),
      });
    },

    confirmSubmit: ({ onConfirm }) => {
      popup.open({
        title: "",
        size: "sm",
        content: (
          <SubmitConfirmPopup
            onConfirm={() => {
              popup.close();
              onConfirm?.();
            }}
            onCancel={() => popup.close()}
          />
        ),
      });
    },
  };
}
