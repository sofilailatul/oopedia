// resources/js/Pages/Mahasiswa/Dashboard.jsx

import AppLayout from '@/Layouts/AppLayout';
import { Link, useForm } from '@inertiajs/react';
import Icons from '@/icons';
import Card from '@/Components/Card';
import StatCard from '@/Components/StatCard';
import ActionCard from "@/Components/ActionCard";

export default function MahasiswaDashboard({ auth, stats, recentActivities, recommendations }) {
  console.log("AUTH:", auth);
  console.log("STATS:", stats);

  const hasClass = auth.user?.class_id !== null;
  const nama = auth.user?.name ?? auth.user?.nama ?? "Guest";
  const classes = auth?.user?.classes ?? [];

  const { data, setData, post, processing, errors, reset } = useForm({
    class_code: '',
  });

  return (
  <AppLayout title="Dashboard">
    <div className="p-1">
      <div className=" gap-6 mb-6 items-stretch justify-center">
        {/* Welcome Card (lebih panjang) */}
        <Card
          title={`Selamat Datang, ${nama}!`}
          icon={Icons.WaveHand}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          className=" flex flex-col items-center justify-center"
        >
          {hasClass ? (
            <p className="font-normal text-black text-[15px]">
              Kamu saat ini berada pada Kelas{" "}
              <span className="font-semibold text-slate-700">
                {classes.length > 0 ? classes[0].class_name : "-"}
              </span>
            </p>
          ) : (
            <p className="text-blue-100">
              Kamu belum join kelas. Masukkan kode kelas dari dosen untuk mulai belajar!
            </p>
          )}
        </Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg border-[#9fc4ff] p-6">
          <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <ActionCard
              href="/materials"
              icon={Icons.Materials}
              iconBg="bg-blue-100"
                iconColor="text-blue-600"
                title="Belajar Materi"
                description="Lanjutkan belajar materi OOP"
              rightIcon={Icons.ChevronRight}
            />
            <ActionCard
              href="/practices"
              icon={Icons.Practice}
              iconBg="bg-green-100"
              iconColor="text-green-600"
              title="Latihan Soal"
              description="Kerjakan latihan soal"
              rightIcon={Icons.ChevronRight}
            />
            <ActionCard
              href="/quizzes"
              icon={Icons.Quiz}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              title="Ikuti Quiz"
              description="Test pemahaman kamu"
              rightIcon={Icons.ChevronRight}
            />
           </div>
         </div>
                 <div className="lg:col-span-1 flex flex-col gap-6 h-full">
            <StatCard
              icon={Icons.Materials}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              label="Materi Selesai"
              value={`${stats?.materials_completed || 0}/${stats?.total_materials || 0}`}
              className="flex-1 flex flex-col justify-center font-bold"
            />
            <StatCard
              icon={Icons.Quiz}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              label="Latihan Selesai"
              value={`${stats?.practices_completed || 0}/${stats?.total_practices || 0}`}
              className="flex-1 flex flex-col justify-center font-bold"
            />
            <StatCard
              icon={Icons.Quiz}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              label="Quiz Selesai"
              value={`${stats?.quizzes_completed || 0}/${stats?.total_quizzes || 0}`}
              className="flex-1 flex flex-col justify-center font-bold"
            />
        </div> 
       </div>
     </div>
    </AppLayout>
  );
}