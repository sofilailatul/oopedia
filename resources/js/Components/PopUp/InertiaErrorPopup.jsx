import React, { useEffect, useRef } from "react";
import { usePage } from "@inertiajs/react";
import { usePopup } from "@/Components/PopUp/PopUpProvider";

export default function InertiaErrorPopup() {
  const { errors } = usePage().props;
  const popup = usePopup();

  // biar ga spam popup kalau render ulang
  const lastMsgRef = useRef(null);

  useEffect(() => {
    const msg = errors?.quiz; 
    if (!msg) return;

    // kalau msg sama, jangan munculin lagi
    if (lastMsgRef.current === msg) return;
    lastMsgRef.current = msg;

    popup.alert({
      title: "Gagal",
      message: msg,
      tone: "danger",
    });
  }, [errors, popup]);

  return null;
}
