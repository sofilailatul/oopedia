import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { FaBell, FaChevronDown, FaUser, FaSignOutAlt } from "react-icons/fa";

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

function cap(str) {
  const s = String(str || "");
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default function Navbar({ title = "Dashboard" }) {
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

  return (
    <div className="px-1">
      <div className="flex  items-center justify-between px-[30px] py-[7px] relative bg-[#224172] rounded-[15px] border border-solid border-[#224172] text-white shadow">
        <h1 className="text-l tracking-[0] leading-[normal] font-semibold text-white">{title}</h1>

        {/* Right */}
        <div className="flex items-center gap-5">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/10"
            >
              <img
                src={avatar}
                alt="avatar"
                className="h-8 w-8 rounded-full object-cover"
              />

              <div className="text-left leading-tight">
                <div className="text-[13px] font-medium">{nama}</div>
              </div>

              <FaChevronDown
                className={`text-sm opacity-80 transition ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-lg bg-white text-gray-900 shadow-lg ring-1 ring-black/5">
                <div className="px-4 py-3">
                  {/* ✅ ganti {nama} jadi {name} */}
                  <div className="text-[14px] font-medium">{nama}</div>
                  <div className="text-xs text-gray-500 capitalize">{role}</div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="p-2">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    <FaUser />
                    Profile
                  </Link>

                  <button
                    type="button"
                    onClick={logout}
                    className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
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
