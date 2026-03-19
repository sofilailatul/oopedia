// resources/js/Pages/Mahasiswa/Dashboard.jsx

import AppLayout from '@/Layouts/AppLayout';
import { Link, useForm } from '@inertiajs/react';
import Icons from '@/icons';
import Card from '@/Components/Card';
import StatCard from '@/Components/StatCard';
import ActionCard from "@/Components/ActionCard";

function DigitBox({ digit, digitBg }) {
  return (
    <span className={`inline-flex h-7 w-6 items-center justify-center rounded-md text-xs font-bold text-white ${digitBg}`}>
      {digit}
    </span>
  );
}

function renderDigits(number, digitBg, length = 2) {
  return number
    .toString()
    .padStart(length, "0")
    .split("")
    .map((d, i) => <DigitBox key={i} digit={d} digitBg={digitBg} />);
}

export default function MahasiswaDashboard({ auth, stats}) {
  const hasClass = auth.user?.class_id !== null;
  const nama = auth.user?.name ?? auth.user?.nama ?? "Guest";
  const classes = auth?.user?.classes ?? [];

  const statThemes = {
    green: {
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      digitBg: "bg-green-600",
    },
    blue: {
      iconBg: "bg-blue-100",
      iconColor: "text-blue-700",
      digitBg: "bg-blue-700",
    },
    yellow: {
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      digitBg: "bg-yellow-500",
    },
    red: {
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
      digitBg: "bg-red-500",
    },
    purple: {
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      digitBg: "bg-purple-600",
    },
  };

  return (
  <AppLayout title="Dashboard">
    <div className="p-1">
      <div className=" gap-6 mb-6 items-stretch justify-center">
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
      <div className="grid lg:grid-cols-2 gap-6 mb-6 ">
        {/* Quick Actions */}
        <div className="bg-white border rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3 ">
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
              iconBg={statThemes.red.iconBg}
              iconColor={statThemes.red.iconColor}
              label="Materi Selesai"
              value={
                <div className="flex items-center gap-1">
                  {renderDigits(stats?.materials_completed || 0, statThemes.red.digitBg)}
                  <span className="mx-1 text-xs font-semibold text-gray-500">/</span>
                  {renderDigits(stats?.total_materials || 0, statThemes.red.digitBg)}
                </div>
              }
            />
            <StatCard
              icon={Icons.Quiz}
              iconBg={statThemes.green.iconBg}
              iconColor={statThemes.green.iconColor}
              label="Latihan Selesai"
              value=
              {
                <div className="flex items-center gap-1">
                  {renderDigits(stats?.practices_completed || 0, statThemes.green.digitBg)}
                  <span className="mx-1 text-xs font-semibold text-gray-500">/</span>
                  {renderDigits(stats?.total_practices || 0, statThemes.green.digitBg)}
                </div>
              }
            />
            <StatCard
              icon={Icons.Quiz}
              iconBg={statThemes.purple.iconBg}
              iconColor={statThemes.purple.iconColor}
              label="Quiz Selesai"
              value=
              {          
                <div className="flex items-center gap-1">
                  {renderDigits(stats?.quizzes_completed || 0, statThemes.purple.digitBg)}
                  <span className="mx-1 text-xs font-semibold text-gray-500">/</span>
                  {renderDigits(stats?.total_quizzes || 0, statThemes.purple.digitBg)}
                </div>
              }
            />
        </div> 
       </div>
     </div>
    </AppLayout>
  );
}