import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import StatCard from "@/Components/StatCard";
import {
  FaGraduationCap,
  FaChalkboardTeacher,
  FaSchool,
  FaBookOpen,
  FaQuestionCircle,
} from "react-icons/fa";

export default function Dashboard({ stats, usersByRole, recentUsers, recentActivities }) {
  return (
    <AppLayout title="Dashboard SuperAdmin">
      <div className="mx-auto space-y-6">
        {/* Hero / header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 p-6 md:p-8 text-white shadow-lg shadow-indigo-200">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs md:text-sm font-medium text-sky-100 mb-1">Control Center 👑</p>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight">
                Dashboard SuperAdmin
              </h1>
              <p className="mt-2 text-xs md:text-sm text-sky-100/90 max-w-xl">
                Pantau seluruh aktivitas user, kelas, materi, dan kuis di satu tempat dengan tampilan yang fresh.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
              <div className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>{Number(stats?.total_users || 0).toLocaleString("id-ID")} User</span>
              </div>
              <div className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                <span>{Number(stats?.total_classes || 0).toLocaleString("id-ID")} Kelas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
          <StatCard
            icon={FaGraduationCap}
            label="Total Mahasiswa"
            value={Number(stats?.total_students || 0).toLocaleString("id-ID")}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            gradientFrom="from-emerald-50"
          />
          <StatCard
            icon={FaChalkboardTeacher}
            label="Total Dosen"
            value={Number(stats?.total_teachers || 0).toLocaleString("id-ID")}
            iconBg="bg-sky-50"
            iconColor="text-sky-600"
            gradientFrom="from-sky-50"
          />
          <StatCard
            icon={FaSchool}
            label="Total Kelas"
            value={Number(stats?.total_classes || 0).toLocaleString("id-ID")}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            gradientFrom="from-violet-50"
          />
          <StatCard
            icon={FaBookOpen}
            label="Total Materi"
            value={Number(stats?.total_materials || 0).toLocaleString("id-ID")}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            gradientFrom="from-amber-50"
          />
          <StatCard
            icon={FaQuestionCircle}
            label="Total Kuis"
            value={Number(stats?.total_quizzes || 0).toLocaleString("id-ID")}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            gradientFrom="from-rose-50"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
          {/* Recent Users */}
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent Registered Users</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="py-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(recentUsers || []).map((u) => (
                    <tr key={u.id} className="text-slate-800 hover:bg-slate-50/60">
                      <td className="py-2 pr-3 font-semibold">{u.name}</td>
                      <td className="py-2 pr-3">{u.email}</td>
                      <td className="py-2 pr-3 capitalize text-slate-600">{u.role}</td>
                      <td className="py-2 text-slate-500">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                    </tr>
                  ))}
                  {(!recentUsers || recentUsers.length === 0) && (
                    <tr>
                      <td className="py-3 text-slate-500" colSpan={4}>
                        Belum ada data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User summary */}
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ringkasan User</h3>

            <div className="mt-3 space-y-4 text-xs md:text-sm">
              <div className="flex items-center justify-between rounded-l bg-slate-50 px-3 py-2">
                <span className="text-slate-700 font-medium">Admin</span>
                <span className="text-xs md:text-sm font-extrabold text-slate-900">
                  {Number((usersByRole?.superadmin || 0) + (usersByRole?.admin || 0)).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-l bg-slate-50 px-3 py-2">
                <span className="text-slate-700 font-medium">Dosen</span>
                <span className="text-xs md:text-sm font-extrabold text-slate-900">
                  {Number(usersByRole?.dosen || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-slate-700 font-medium">Mahasiswa</span>
                <span className="text-xs md:text-sm font-extrabold text-slate-900">
                  {Number(usersByRole?.mahasiswa || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-slate-700 font-medium">Tamu</span>
                <span className="text-xs md:text-sm font-extrabold text-slate-900">
                  {Number(usersByRole?.tamu || 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
