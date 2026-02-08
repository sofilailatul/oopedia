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
} from "react-icons/fa";

const NAV_BY_ROLE = {
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: FaThLarge },
    { label: "Kelola Materi", href: "/superadmin/materi", icon: FaBook },
    { label: "Kelola Latihan Soal", href: "/superadmin/latihan-soal", icon: FaClipboardList },
    { label: "Kelola Kuis", href: "/superadmin/kuis", icon: FaFileAlt },
    { label: "Leaderboard", href: "/superadmin/leaderboard", icon: FaTrophy },
    { label: "Nilai Mahasiswa", href: "/superadmin/nilai-mahasiswa", icon: FaChartBar },
    { label: "Kelola User", href: "/superadmin/users", icon: FaUserCog },
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
    { label: "Kuis", href: "/mahasiswa/kuis", icon: FaFileAlt },
    { label: "Leaderboard", href: "/mahasiswa/leaderboard", icon: FaTrophy },
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
  return currentUrl === targetHref || currentUrl.startsWith(targetHref + "/");
}

export default function Sidebar() {
  const { url, props } = usePage();
  const role = normalizeRole(props?.auth?.user?.role);
  const items = NAV_BY_ROLE[role] || NAV_BY_ROLE.tamu;

  return (
    <aside className="flex flex-col w-[180px] items-start gap-5 relative bg-[#e0f1fe]">
      <header className="flex items-center gap-[11px] px-[5px] py-[10px] self-stretch w-full border-b [border-bottom-style:solid] border-[#1e1e1e70] relative flex-[0_0_auto]">
        <img
          className="relative w-[34px] h-[49px] aspect-[0.71] object-cover" src="/images/logo.png" alt="Oopedia"/>

        <div className="inline-flex flex-col items-start justify-center gap-[3px] relative flex-[0_0_auto]">
          <h1 className="relative w-fit mt-[-1.00px] [ font-medium text-black text-[16px] tracking-[0] leading-[normal]">
            OOpedia
          </h1>

          <div className="inline-flex items-center justify-center gap-2.5 px-1 py-[3px] bg-[#ffd13ec7] rounded-[7px]">
            <span className="relative w-fit [font-medium text-[#1e1e1e] text-[11px] tracking-[0] leading-[normal] capitalize">
              {role}
            </span>
          </div>
        </div>
      </header>

      {/* Nav */}
    <nav className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
      {items.map((item) => {
        const active = isActive(url, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              `flex items-center gap-[10px] pl-2 pr-2 py-[7px] self-stretch w-full rounded-[7px] transition`,
              active
                ? "bg-blue-300/70 shadow-sm"
                : "hover:bg-blue-200/60",
            ].join(" ")}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-l group-hover:bg-white">
              <Icon className="text-lg text-gray-900" />
            </span>

              <span className="text-[13px] font-medium text-gray-900">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
