// resources/js/Pages/Dosen/Dashboard.jsx

import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import { usePopup } from '@/Components/PopUp/PopUpProvider';
import { Link, usePage, router } from '@inertiajs/react';
import Icons from '@/icons';

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

	const handleOpenCreateClass = () => {
		popup.open({
			title: '✨ Tambah Kelas Baru',
			size: 'lg',
			content: (
				<CreateClassModal
					lecturerName={lecturerName}
					onSuccess={() => router.reload({ only: ['stats', 'classes'] })}
				/>
			),
		});
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
					<button
						onClick={handleOpenCreateClass}
						className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-[0_8px_20px_rgb(0,0,0,0.12)] active:translate-y-0"
					>
						<Icons.Add className="w-5 h-5" />
						Buat Kelas
					</button>
				</div>
			</div>

			{/* Bento Grid Stats Section */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
				{/* Stat Card 1 */}
				<div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
					<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
					<div className="flex justify-between items-start mb-4">
						<div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
							<Icons.Class className="w-6 h-6" />
						</div>
					</div>
					<div>
						<p className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">{stats.total_classes || 0}</p>
						<p className="text-sm font-medium text-slate-500">Total Kelas</p>
					</div>
				</div>

				{/* Stat Card 2 */}
				<div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
					<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
					<div className="flex justify-between items-start mb-4">
						<div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
							<Icons.Users className="w-6 h-6" />
						</div>
					</div>
					<div>
						<p className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">{stats.total_students || 0}</p>
						<p className="text-sm font-medium text-slate-500">Mahasiswa</p>
					</div>
				</div>

				{/* Stat Card 3 */}
				<div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
					<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-50 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
					<div className="flex justify-between items-start mb-4">
						<div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
							<Icons.Materials className="w-6 h-6" />
						</div>
					</div>
					<div>
						<p className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">{stats.total_materials || 0}</p>
						<p className="text-sm font-medium text-slate-500">Total Materi</p>
					</div>
				</div>

				{/* Stat Card 4 */}
				<div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
					<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-50 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
					<div className="flex justify-between items-start mb-4">
						<div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
							<Icons.Quiz className="w-6 h-6" />
						</div>
					</div>
					<div>
						<p className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">{stats.total_quizzes || 0}</p>
						<p className="text-sm font-medium text-slate-500">Total Quiz</p>
					</div>
				</div>
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
								<Link
									key={classItem.id}
									href={`/classes/${classItem.id}`}
									className="group block bg-white border border-slate-200/60 p-5 md:p-6 rounded-3xl shadow-sm hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col min-h-[180px]"
								>
									<div className="flex flex-col h-full justify-between">
										<div>
											<div className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-[10px] uppercase font-bold tracking-widest rounded-full mb-3">
												{classItem.class_code}
											</div>
											<h3 className="text-base md:text-lg font-bold text-slate-900 leading-snug line-clamp-2">
												{classItem.name}
											</h3>
										</div>
										<div className="mt-6 flex items-center justify-between text-slate-400">
											<span className="text-sm font-bold group-hover:text-slate-900 transition-colors">Kelola</span>
											<div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
												<Icons.ChevronRight className="w-4 h-4" />
											</div>
										</div>
									</div>
								</Link>
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
		</div>
	);
}

function CreateClassModal({ lecturerName, onSuccess }) {
	const popup = usePopup();
	const [name, setName] = useState('');
	const [classCode, setClassCode] = useState('');
	const [description, setDescription] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e) => {
		e?.preventDefault();
		if (isSubmitting) return;
		setIsSubmitting(true);
		setError('');
		try {
			await window.axios.post('/classes', {
				class_name: name,
				class_code: classCode,
				description,
			});
			onSuccess?.();
			popup.close();
		} catch (err) {
			setError('Gagal menyimpan kelas. Coba lagi.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<div className="space-y-1">
				<p className="text-[11px] font-medium text-slate-500">Nama Dosen</p>
				<div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
					<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-500 mr-1">
						👤
					</span>
					<span className="truncate">{lecturerName}</span>
				</div>
			</div>

			<div className="space-y-1">
				<p className="text-[11px] font-medium text-slate-500">Nama Kelas</p>
				<input
					type="text"
					className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
					placeholder="Masukkan Nama Kelas"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
			</div>

			<div className="space-y-1">
				<p className="text-[11px] font-medium text-slate-500">Kode Kelas</p>
				<input
					type="text"
					className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
					placeholder="Masukkan Kode Kelas (contoh: IF101A)"
					value={classCode}
					onChange={(e) => setClassCode(e.target.value.toUpperCase())}
					required
				/>
			</div>

			<div className="space-y-1">
				<p className="text-[11px] font-medium text-slate-500">Deskripsi</p>
				<textarea
					className="w-full min-h-[100px] rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
					placeholder="Deskripsi Kelas"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
				/>
			</div>

			{error && <p className="text-xs text-red-500">{error}</p>}

			<div className="flex items-center justify-end gap-3 pt-1">
				<Button
					type="button"
					color="red"
					variant="outline"
					size="sm"
					onClick={() => popup.close()}
				>
					Batal
				</Button>
				<Button
					type="submit"
					color="green"
					variant="solid"
					size="sm"
					disabled={isSubmitting}
				>
					{isSubmitting ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</div>
		</form>
	);
}
