import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { FaArrowLeft, FaChevronDown, FaUser, FaSignOutAlt, FaUserCircle } from "react-icons/fa";

function useOutsideClick(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export default function Navbar({
  title = "Dashboard",
  backHref = "",
  backLabel = "Kembali",
  onBackClick,
}) {
  const { auth } = usePage().props;

  const user = auth?.user ?? null;

  const role = useMemo(() => (user?.role ? String(user.role) : "tamu"), [user]);
  const nama = user?.name ?? user?.nama ?? "Guest";

  const avatar =
    user?.avatar || user?.photo_url || "https://i.pravatar.cc/100?img=5";

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useOutsideClick(menuRef, () => setOpen(false));

  const logout = () => {
    setOpen(false);
    router.post("/logout");
  };

  const showBack = !!backHref || typeof onBackClick === "function";

  return (
<div className="relative">
  {/* Outer shell */}
    {/* Inner glass bar */}
    <div className="relative z-20 flex items-center justify-between rounded-full border border-sky-200 bg-sky-50 px-5 py-3 text-slate-800 shadow-[0_10px_30px_rgba(148,163,184,0.12)] backdrop-blur-xl">
      
      {/* LEFT */}
      <div className="flex items-center gap-3">
        {showBack && (
          backHref ? (
            <Link
              href={backHref}
              onClick={onBackClick}
              aria-label={backLabel}
              title={backLabel}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/70 text-slate-600 transition hover:bg-white"
            >
              <FaArrowLeft aria-hidden="true" className="text-[14px]" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onBackClick}
              aria-label={backLabel}
              title={backLabel}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/70 text-slate-600 transition hover:bg-white"
            >
              <FaArrowLeft aria-hidden="true" className="text-[14px]" />
            </button>
          )
        )}

        <div>
          <h1 className="text-[17px] ml-2 font-semibold tracking-tight text-slate-700">
            {title}
          </h1>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/75 px-3 py-2 transition hover:bg-white"
          >
            {/* Ganti foto jadi icon */}
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              <FaUserCircle className="text-[22px]" />
            </div>

            <div className="text-left leading-tight">
              <div className="text-[13px] font-medium text-slate-800">{nama}</div>
            </div>

            <FaChevronDown
              className={`text-sm text-slate-500 transition ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {open && (
            <div className="absolute right-0 z-30 mt-3 w-56 overflow-hidden rounded-2xl border border-white/60 bg-white/90 text-gray-900 shadow-xl backdrop-blur-xl">
              <div className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                    <FaUserCircle className="text-[22px]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium">{nama}</div>
                    <div className="text-xs capitalize text-gray-500">{role}</div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="p-2">
                <button
                  type="button"
                  onClick={logout}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-sky-50"
                >
                  <FaSignOutAlt />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
