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
			title: 'Tambah Kelas',
			size: 'lg',
			content: (
				<CreateClassModal
					lecturerName={lecturerName}
					onSuccess={() => router.reload({ only: ['stats', 'classes'] })}
				/>
			),
		});
	};

	return (
		<div className="max-w-7xl">
			{/* Welcome Card */}
			<div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-6">
				<h1 className="text-3xl font-bold mb-2">Dashboard Dosen</h1>
				<p className="text-blue-100">
					Kelola kelas, materi, dan monitor progress mahasiswa
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid md:grid-cols-4 gap-6 mb-6">
				<div className="bg-white rounded-lg border p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
							<Icons.Class className="w-6 h-6 text-blue-600" />
						</div>
						<div>
							<p className="text-sm text-gray-600">Total Kelas</p>
							<p className="text-2xl font-bold text-gray-900">{stats.total_classes || 0}</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg border p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
							<Icons.Users className="w-6 h-6 text-green-600" />
						</div>
						<div>
							<p className="text-sm text-gray-600">Total Mahasiswa</p>
							<p className="text-2xl font-bold text-gray-900">{stats.total_students || 0}</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg border p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
							<Icons.Materials className="w-6 h-6 text-purple-600" />
						</div>
						<div>
							<p className="text-sm text-gray-600">Total Materi</p>
							<p className="text-2xl font-bold text-gray-900">{stats.total_materials || 0}</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg border p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
							<Icons.Quiz className="w-6 h-6 text-yellow-600" />
						</div>
						<div>
							<p className="text-sm text-gray-600">Total Quiz</p>
							<p className="text-2xl font-bold text-gray-900">{stats.total_quizzes || 0}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Quick Actions & Classes */}
			<div className="grid lg:grid-cols-2 gap-6 mb-6">
				{/* Quick Actions */}
				<div className="bg-white rounded-lg border p-6">
					<h2 className="text-lg font-bold mb-4">Quick Actions</h2>
					<div className="space-y-3">
						<button
							type="button"
							onClick={handleOpenCreateClass}
							className="w-full flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 border transition text-left"
						>
							<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
								<Icons.Add className="w-5 h-5 text-blue-600" />
							</div>
							<div className="flex-1">
								<p className="font-medium">Buat Kelas Baru</p>
								<p className="text-sm text-gray-600">Tambah kelas untuk mahasiswa</p>
							</div>
						</button>

						<Link
							href={route('dosen.materials.create')}
							className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 border transition"
						>
							<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
								<Icons.Materials className="w-5 h-5 text-green-600" />
							</div>
							<div className="flex-1">
								<p className="font-medium">Tambah Materi</p>
								<p className="text-sm text-gray-600">Upload materi pembelajaran</p>
							</div>
						</Link>

						<Link
							href="/quizzes/create"
							className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 border transition"
						>
							<div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
								<Icons.Quiz className="w-5 h-5 text-purple-600" />
							</div>
							<div className="flex-1">
								<p className="font-medium">Buat Quiz</p>
								<p className="text-sm text-gray-600">Buat quiz untuk mahasiswa</p>
							</div>
						</Link>
					</div>
				</div>

				{/* Classes List */}
				<div className="bg-white rounded-lg border p-6">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-bold">Kelas Saya</h2>
						<Link href={route('dosen.classes.index')} className="text-sm text-blue-600 hover:underline">
							Lihat semua
						</Link>
					</div>

					{classes && classes.length > 0 ? (
						<div className="space-y-3">
							{classes.slice(0, 4).map((classItem) => (
								<Link
									key={classItem.id}
									href={`/classes/${classItem.id}`}
									className="block p-4 border rounded-lg hover:bg-gray-50 transition"
								>
									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium">{classItem.name}</p>
											<p className="text-sm text-gray-600">
												Kode: <span className="font-mono font-bold">{classItem.class_code}</span>
											</p>
										</div>
										<Icons.ChevronRight className="w-5 h-5 text-gray-400" />
									</div>
								</Link>
							))}
						</div>
					) : (
						<div className="text-center py-8">
							<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
								<Icons.Class className="w-8 h-8 text-gray-400" />
							</div>
							<p className="text-gray-600 mb-4">Belum ada kelas</p>
							<Button
								type="button"
								color="blue"
								variant="solid"
								size="sm"
								className="gap-2"
								onClick={handleOpenCreateClass}
								leftIcon={<Icons.Add className="w-4 h-4" />}
							>
								Buat Kelas Pertama
							</Button>
						</div>
					)}
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
