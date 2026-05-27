import React from "react";
import { Link, usePage } from "@inertiajs/react";
import {
  FaThLarge,
  FaBook,
  FaClipboardList,
  FaFileAlt,
  FaTrophy,
  FaChartBar,
  FaUsers,
  FaUserCog,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const NAV_BY_ROLE = {
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: FaThLarge },
    { label: "Kelola Materi", href: "/superadmin/materials", icon: FaBook },
    { label: "Kelola Latihan Soal", href: "/superadmin/latihan-soal", icon: FaClipboardList },
    { label: "Kelola Kuis", href: "/superadmin/kuis", icon: FaFileAlt },
    { label: "Leaderboard", href: "/superadmin/nilai-mahasiswa", icon: FaTrophy },
    { label: "Kelola User", href: "/users", icon: FaUserCog },
    { label: "Kelola Kelas", href: "/superadmin/kelas", icon: FaUsers },
  ],
  dosen: [
    { label: "Dashboard", href: "/dashboard", icon: FaThLarge },
    { label: "Kelola Materi", href: "/dosen/materi", icon: FaBook },
    { label: "Kelola Kelas", href: "/dosen/kelas", icon: FaUsers },
    { label: "Kelola Latihan Soal", href: "/dosen/latihan-soal", icon: FaClipboardList },
    { label: "Kelola Kuis", href: "/dosen/kuis", icon: FaFileAlt },
    { label: "Nilai Mahasiswa", href: "/dosen/nilai-mahasiswa", icon: FaChartBar },
  ],
  mahasiswa: [
    { label: "Dashboard", href: "/dashboard", icon: FaThLarge },
    { label: "Materi", href: "/materi", icon: FaBook },
    { label: "Latihan Soal", href: "/daftar-latihan-soal", icon: FaClipboardList },
    { label: "Kuis", href: "/kuis", icon: FaFileAlt },
    { label: "Leaderboard", href: "/leaderboard/index", icon: FaTrophy },
  ],
  tamu: [
    { label: "Dashboard", href: "/dashboard", icon: FaThLarge },
    { label: "Materi", href: "/materi", icon: FaBook },
    { label: "Latihan Soal", href: "/daftar-latihan-soal", icon: FaClipboardList },
  ],
};

function normalizeRole(role) {
  const r = String(role || "").toLowerCase();
  if (r === "superadmin") return "admin";
  if (r === "admin" || r === "dosen" || r === "mahasiswa" || r === "tamu") return r;
  return "tamu";
}

function isActive(currentUrl, targetHref) {
  const [path] = currentUrl.split("?");
  return path === targetHref || path.startsWith(targetHref + "/");
}

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const { url, props } = usePage();
  const role = normalizeRole(props?.auth?.user?.role);
  const items = NAV_BY_ROLE[role] || NAV_BY_ROLE.tamu;
  const roleLabel = role === "admin" ? "superadmin" : role;
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("oopedia.sidebar.collapsed");
    if (stored === "1") {
      setIsCollapsed(true);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("oopedia.sidebar.collapsed", isCollapsed ? "1" : "0");
  }, [isCollapsed]);

  return (
    <>
    {mobileOpen && (
      <div
        className="fixed inset-0 z-40 bg-slate-950/30 md:hidden"
        onClick={onCloseMobile}
      />
    )}

    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 flex h-dvh shrink-0 flex-col border border-sky-200 bg-gradient-to-b from-sky-50 to-white py-4 shadow-xl transition-transform duration-200 md:static md:z-20 md:h-auto md:rounded-3xl md:shadow-sm",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        isCollapsed ? "w-[60px] px-2.5 md:w-[60px]" : "w-[min(84vw,260px)] px-4 md:w-[220px]",
      ].join(" ")}
    >
      <header
        className={[
          "shadow-xs",
          isCollapsed
            ? "flex flex-col items-center gap-2  py-2.5"
            : "flex items-center justify-between gap-3 px-3 py-3",
        ].join(" ")}
      >
        <div className={isCollapsed ? "flex items-center justify-center" : "flex min-w-0 items-center gap-3"}>
        <img
          className="h-10 w-7 object-contain"
          src="/images/logo.png"
          alt="OOpedia"
        />

          {!isCollapsed ? (
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight text-slate-900">
                OOpedia
              </h1>

              <div className="mt-1 inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5">
                <span className="text-[11px] font-medium capitalize text-sky-700">
                  {roleLabel}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="hidden inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 md:inline-flex"
          aria-label={isCollapsed ? "Perbesar sidebar" : "Perkecil sidebar"}
          title={isCollapsed ? "Perbesar sidebar" : "Perkecil sidebar"}
        >
          {isCollapsed ? <FaChevronRight className="text-xs" /> : <FaChevronLeft className="text-xs" />}
        </button>
      </header>

      {!isCollapsed ? (
        <div className="mt-5 px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Menu</p>
        </div>
      ) : null}

      <nav className="mt-2 flex flex-1 flex-col gap-1.5 overflow-y-auto px-1 md:px-0">
        {items.map((item) => {
          const active = isActive(url, item.href);
          const Icon = item.icon;

          return (
          <Link
            key={item.href}
            href={item.href}
            title={isCollapsed ? item.label : undefined}
            className={[
              "group relative flex items-center transition",
              isCollapsed
                ? "justify-center rounded-2xl px-2 py-2"
                : "gap-3 rounded-xl px-2.5 py-2",
              active
                ? "bg-sky-100 text-sky-900 shadow-sm ring-1 ring-sky-200"
                : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900",
            ].join(" ")}
          >
            <span
              className={[
                "inline-flex items-center justify-center transition",
                isCollapsed ? "h-7 w-7 rounded-xl" : "h-8 w-8 rounded-lg",
                active
                  ? "bg-white text-sky-700"
                  : "bg-slate-100 text-slate-500 group-hover:bg-white",
              ].join(" ")}
            >
              <Icon className={isCollapsed ? "text-xs" : "text-sm"} />
            </span>

            {!isCollapsed ? (
              <span className="truncate text-[13px] font-medium">{item.label}</span>
            ) : null}

            {!isCollapsed && active ? (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-500" />
            ) : null}
          </Link>
          );
        })}
      </nav>
    </aside>
    </>
  );
}
