// resources/js/Pages/Dosen/Dashboard.jsx

import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import { usePopup } from '@/Components/PopUp/PopUpProvider';
import { Link, usePage, router } from '@inertiajs/react';
import Icons from '@/icons';
import CreateClassModal from '@/Components/CreateClassModal';
import OverviewCard from '@/Components/OverviewCard';
import StatCard from '@/Components/StatCard';

export default function DosenDashboard(props) {
	return (
		<AppLayout title="Dashboard Dosen">
			<DosenDashboardContent {...props} />
		</AppLayout>
	);
}

function DosenDashboardContent({ stats = {}, classes = [], recentActivities = [], topStudents = [] }) {
	const popup = usePopup();
	const { props } = usePage();
	const user = props?.auth?.user || {};
	const lecturerName = user.nama || user.name || 'Dosen';

	const [isClassModalOpen, setIsClassModalOpen] = useState(false);

	const handleOpenCreateClass = () => {
		setIsClassModalOpen(true);
	};

	// Format current date
	const today = new Date();
	const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
	const formattedDate = today.toLocaleDateString('id-ID', options);

	return (
		<div className="max-w-7xl mx-auto space-y-10 font-sans pb-10 px-2">
			{/* Header Section */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div className="animate-fade-in-up">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[11px] uppercase font-bold mb-4 tracking-wider">
						<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
						{formattedDate}
					</div>
					<h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
						Halo, {lecturerName} 👋
					</h1>
				</div>
				<div className="shrink-0 flex">
					<Button
						onClick={handleOpenCreateClass}
						className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-[0_8px_20px_rgb(0,0,0,0.12)] active:translate-y-0"
					>
						<Icons.Add className="w-5 h-5" />
						Buat Kelas
					</Button>
				</div>
			</div>

			{/* Bento Grid Stats Section */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
				<StatCard
					icon={Icons.Class}
					iconBg="bg-blue-50"
					iconColor="text-blue-600"
					gradientFrom="from-blue-50"
					value={stats.total_classes || 0}
					label="Total Kelas"
				/>

				<StatCard
					icon={Icons.Users}
					iconBg="bg-emerald-50"
					iconColor="text-emerald-600"
					gradientFrom="from-emerald-50"
					value={stats.total_students || 0}
					label="Mahasiswa"
				/>

				<StatCard
					icon={Icons.Materials}
					iconBg="bg-violet-50"
					iconColor="text-violet-600"
					gradientFrom="from-violet-50"
					value={stats.total_materials || 0}
					label="Total Materi"
				/>

				<StatCard
					icon={Icons.Quiz}
					iconBg="bg-amber-50"
					iconColor="text-amber-500"
					gradientFrom="from-amber-50"
					value={stats.total_quizzes || 0}
					label="Total Quiz"
				/>
			</div>

			{/* Main Content Area */}
			<div className="grid lg:grid-cols-3 gap-6 md:gap-8">
				{/* Classes Section */}
				<div className="lg:col-span-2 space-y-5">
					<div className="flex items-center justify-between px-1">
						<h2 className="text-xl font-bold text-slate-900">Kelas Aktif</h2>
						<Link href={route('dosen.classes.index')} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors inline-flex items-center gap-1">
							Lihat Semua <Icons.ChevronRight className="w-4 h-4" />
						</Link>
					</div>

					{classes && classes.length > 0 ? (
						<div className="grid sm:grid-cols-2 gap-4 md:gap-5">
							{classes.slice(0, 4).map((classItem) => (
								<OverviewCard
									key={classItem.id}
									href={route('dosen.classes.index')}
									badge={classItem.class_code}
									title={classItem.name || classItem.class_name}
									actionText="Kelola"
								/>
							))}
						</div>
					) : (
						<div className="bg-slate-50/50 border border-dashed border-slate-300 rounded-3xl p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
							<div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-5 shadow-[0_4px_20px_rgb(0,0,0,0.05)]">
								<span className="text-4xl">📭</span>
							</div>
							<h3 className="text-xl font-black text-slate-900 mb-2">Belum ada kelas</h3>
							<p className="text-slate-500 max-w-sm mb-8 font-medium">Mulai perjalanan mengajarmu dengan membuat kelas pertama untuk mahasiswa.</p>
							<button
								onClick={handleOpenCreateClass}
								className="bg-slate-900 text-white px-8 py-3.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
							>
								Buat Kelas Sekarang
							</button>
						</div>
					)}
				</div>

				{/* Quick Actions Sidebar */}
				<div className="space-y-5">
					<h2 className="text-xl font-bold text-slate-900 px-1">Aksi Cepat</h2>
					<div className="bg-white rounded-[2rem] p-3 border border-slate-200/60 shadow-sm flex flex-col gap-2">
						<Link
							href={route('dosen.materials.create')}
							className="flex items-center p-4 rounded-3xl hover:bg-slate-50 transition-colors group"
						>
							<div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shrink-0">
								<Icons.Materials className="w-6 h-6" />
							</div>
							<div>
								<p className="font-bold text-slate-900 text-[15px]">Upload Materi</p>
								<p className="text-[13px] font-medium text-slate-500 mt-0.5">Bagikan bahan ajar</p>
							</div>
						</Link>

						<Link
							href="/quizzes/create"
							className="flex items-center p-4 rounded-3xl hover:bg-slate-50 transition-colors group"
						>
							<div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shrink-0">
								<Icons.Quiz className="w-6 h-6" />
							</div>
							<div>
								<p className="font-bold text-slate-900 text-[15px]">Buat Quiz</p>
								<p className="text-[13px] font-medium text-slate-500 mt-0.5">Evaluasi mahasiswa</p>
							</div>
						</Link>
					</div>
				</div>
			</div>
			<CreateClassModal
				show={isClassModalOpen}
				onClose={() => setIsClassModalOpen(false)}
				lecturerName={lecturerName}
				onSuccess={() => router.reload({ only: ['stats', 'classes'] })}
			/>
		</div>
	);
}
