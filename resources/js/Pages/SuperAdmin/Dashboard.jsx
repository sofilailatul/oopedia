import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { FaGraduationCap, FaChalkboardTeacher, FaSchool, FaBookOpen, FaQuestionCircle } from "react-icons/fa";

function StatCard({ icon: Icon, label, value, badgeText = "Active", badgeClass = "bg-green-500" }) {
  return (
    <div className="w-full rounded-2xl border border-gray-300 bg-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-white p-3 shadow">
          <Icon className="text-2xl" />
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${badgeClass}`}>
          {badgeText}
        </span>
      </div>

      <div className="mt-4 text-3xl font-extrabold text-gray-900">
        {Number(value || 0).toLocaleString("id-ID")}
      </div>
      <div className="mt-1 text-sm text-gray-600">{label}</div>
    </div>
  );
}

export default function Dashboard({ stats, usersByRole, recentUsers, recentActivities }) {
  return (
    <AdminLayout title="Dashboard">
      {/* Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={FaGraduationCap}
          label="Total Mahasiswa"
          value={stats?.total_students}
          badgeText="Active"
          badgeClass="bg-green-600"
        />
        <StatCard
          icon={FaChalkboardTeacher}
          label="Total Lecturers"
          value={stats?.total_teachers}
          badgeText="Active"
          badgeClass="bg-green-600"
        />
        <StatCard
          icon={FaSchool}
          label="Total Classes"
          value={stats?.total_classes}
          badgeText="Live"
          badgeClass="bg-green-600"
        />
        <StatCard
          icon={FaBookOpen}
          label="Total Materials"
          value={stats?.total_materials}
          badgeText="Updated"
          badgeClass="bg-blue-600"
        />
        <StatCard
          icon={FaQuestionCircle}
          label="Total Quizzes"
          value={stats?.total_quizzes}
          badgeText="Live"
          badgeClass="bg-green-600"
        />
      </div>

      {/* Content row */}
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Learning Content (ringkas seperti mockup) */}
        <div className="xl:col-span-2 rounded-2xl bg-white p-6 shadow">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-sky-100 flex items-center justify-center">
              <FaBookOpen />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Learning Content</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-gray-100 p-5">
              <div className="font-semibold text-gray-900">Manajemen Materi</div>
              <div className="text-sm text-gray-600">
                {Number(stats?.total_materials || 0).toLocaleString("id-ID")} items
              </div>
            </div>

            <div className="rounded-xl bg-gray-100 p-5">
              <div className="font-semibold text-gray-900">Manajemen Latihan Soal</div>
              <div className="text-sm text-gray-600">
                {/* kalau belum ada count latihan soal, boleh pakai 0 / bikin stat baru */}
                {Number(stats?.total_exercises || 0).toLocaleString("id-ID")} items
              </div>
            </div>

            <div className="rounded-xl bg-gray-100 p-5">
              <div className="font-semibold text-gray-900">Manajemen Kuis</div>
              <div className="text-sm text-gray-600">
                {Number(stats?.total_quizzes || 0).toLocaleString("id-ID")} items
              </div>
            </div>

            <div className="rounded-xl bg-gray-100 p-5">
              <div className="font-semibold text-gray-900">Manajemen Kelas</div>
              <div className="text-sm text-gray-600">
                {Number(stats?.total_classes || 0).toLocaleString("id-ID")} items
              </div>
            </div>
          </div>
        </div>

        {/* Side panel: ringkasan */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h3 className="text-lg font-bold text-gray-900">Ringkasan User</h3>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-gray-100 px-4 py-3">
              <span className="text-gray-700">Admin</span>
              <span className="font-bold">
                {Number(usersByRole?.admin || 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-100 px-4 py-3">
              <span className="text-gray-700">Dosen</span>
              <span className="font-bold">
                {Number(usersByRole?.dosen || 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-100 px-4 py-3">
              <span className="text-gray-700">Mahasiswa</span>
              <span className="font-bold">
                {Number(usersByRole?.mahasiswa || 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-100 px-4 py-3">
              <span className="text-gray-700">Tamu</span>
              <span className="font-bold">
                {Number(usersByRole?.tamu || 0).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h3 className="text-lg font-bold text-gray-900">Recent Registered Users</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(recentUsers || []).map((u) => (
                  <tr key={u.id} className="text-gray-800">
                    <td className="py-2 font-semibold">{u.name}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2 capitalize">{u.role}</td>
                    <td className="py-2">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID") : "-"}
                    </td>
                  </tr>
                ))}
                {(!recentUsers || recentUsers.length === 0) && (
                  <tr>
                    <td className="py-3 text-gray-500" colSpan={4}>
                      Belum ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h3 className="text-lg font-bold text-gray-900">Recent Activities (Quiz Attempts)</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2">Student</th>
                  <th className="py-2">Quiz</th>
                  <th className="py-2">Score</th>
                  <th className="py-2">Finished</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(recentActivities || []).map((a, idx) => (
                  <tr key={idx} className="text-gray-800">
                    <td className="py-2 font-semibold">{a.student_name}</td>
                    <td className="py-2">{a.quiz_title}</td>
                    <td className="py-2">{a.total_score}</td>
                    <td className="py-2">
                      {a.finished_at ? new Date(a.finished_at).toLocaleString("id-ID") : "-"}
                    </td>
                  </tr>
                ))}
                {(!recentActivities || recentActivities.length === 0) && (
                  <tr>
                    <td className="py-3 text-gray-500" colSpan={4}>
                      Belum ada aktivitas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
