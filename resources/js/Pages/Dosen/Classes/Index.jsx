import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import Card from '@/Components/Card';
import { usePopup } from '@/Components/PopUp/PopUpProvider';
import { usePage, router } from '@inertiajs/react';
import { FaPlus } from 'react-icons/fa';

export default function DosenClassesIndex(props) {
	return (
		<AppLayout title="Kelola Kelas" label="Kelola Kelas">
			<DosenClassesContent {...props} />
		</AppLayout>
	);
}

function DosenClassesContent({ classes = [], authUser }) {
	const popup = usePopup();
	const { props } = usePage();
	const user = authUser || props?.auth?.user || {};
	const lecturerName = user.nama || user.name || 'Dosen';

	const handleOpenCreate = () => {
		popup.open({
			title: 'Tambah Kelas',
			size: 'lg',
			content: <CreateClassModal lecturerName={lecturerName} onSuccess={() => router.reload({ only: ['classes'] })} />,
		});
	};

	const handleOpenDetail = (cls) => {
		popup.open({
			title: 'Detail Kelas',
			size: 'lg',
			content: <ShowClassModal classId={cls.id} lecturerName={lecturerName} />,
		});
	};

	const handleOpenEdit = (cls) => {
		popup.open({
			title: 'Edit Kelas',
			size: 'lg',
			content: (
				<EditClassModal
					initialClass={cls}
					lecturerName={lecturerName}
					onSuccess={() => router.reload({ only: ['classes'] })}
				/>
			),
		});
	};

	return (
		<div className="max-w-6xl mx-auto space-y-6">
			{/* Header bar */}
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold text-slate-900">Daftar Kelas</h1>
				<Button
					color="green"
					variant="solid"
					size="md"
					leftIcon={<FaPlus className="h-3.5 w-3.5" />}
					className="rounded-full shadow-sm"
					onClick={handleOpenCreate}
				>
					Tambah kelas
				</Button>
			</div>

			{/* Cards grid */}
			<div className="mt-2 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
				{classes.length ? (
					classes.map((cls) => (
						<ClassCard
							key={cls.id}
							cls={cls}
							lecturerName={lecturerName}
							onDetail={() => handleOpenDetail(cls)}
							onEdit={() => handleOpenEdit(cls)}
						/>
					))
				) : (
					<div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-slate-400">
						<p className="text-sm">Belum ada kelas</p>
					</div>
				)}
			</div>
		</div>
	);
}

function ClassCard({ cls, lecturerName, onDetail, onEdit }) {
	const studentsCount = cls.users_count ?? cls.students_count ?? 0;
	return (
		<Card className="group relative flex flex-col rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300">
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-start gap-3 flex-1 min-w-0">
					<span className="mt-1 h-9 w-0.5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-400" />
					<div className="space-y-1 min-w-0">
						<p className="text-sm font-semibold text-slate-900 line-clamp-2">{cls.class_name}</p>
						<p className="text-[11px] text-slate-500">{lecturerName}</p>
						{cls.description && (
							<p className="text-[11px] text-slate-500/90 line-clamp-2">{cls.description}</p>
						)}
					</div>
				</div>
				<div className="flex flex-col items-end gap-1 text-[11px] text-slate-500">
					<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
						<span className="font-mono text-[11px]">{cls.class_code}</span>
					</span>
					<span className="text-slate-400">{studentsCount} siswa</span>
				</div>
			</div>
			<div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
				<span className="inline-flex items-center gap-1 text-slate-400">
					<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
					<span>Kelas aktif</span>
				</span>
				<div className="inline-flex gap-2">
					<button
						type="button"
						onClick={onDetail}
						className="rounded-full px-3 py-1 text-[11px] font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition"
					>
						Detail
					</button>
					<button
						type="button"
						onClick={onEdit}
						className="rounded-full px-3 py-1 text-[11px] font-medium bg-slate-900 text-white hover:bg-slate-800 transition"
					>
						Edit
					</button>
				</div>
			</div>
		</Card>
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

function ShowClassModal({ classId, lecturerName }) {
	const popup = usePopup();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	React.useEffect(() => {
		let mounted = true;
		setLoading(true);
		window.axios
			.get(`/classes/${classId}`)
			.then((res) => {
				if (!mounted) return;
				setData(res.data);
			})
			.catch(() => {
				if (!mounted) return;
				setError('Gagal memuat detail kelas');
			})
			.finally(() => {
				if (!mounted) return;
				setLoading(false);
			});
		return () => {
			mounted = false;
		};
	}, [classId]);

	if (loading) {
		return <p className="text-sm text-slate-500">Memuat...</p>;
	}
	if (error || !data) {
		return <p className="text-sm text-red-500">{error || 'Data tidak ditemukan'}</p>;
	}

	const students = data.users || [];
	const className = data.class_name;
	const classCode = data.class_code;

	return (
		<div className="space-y-5">
			<div className="grid gap-4 md:grid-cols-2">
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
					<p className="text-[11px] font-medium text-slate-500">Kode Kelas</p>
					<div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-sm text-slate-800 flex items-center justify-between">
						<span className="font-mono text-[12px]">{classCode}</span>
					</div>
				</div>
			</div>

			<div className="space-y-1">
				<p className="text-[11px] font-medium text-slate-500">Nama Kelas</p>
				<div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
					{className}
				</div>
			</div>

			<div className="space-y-2">
				<p className="text-[11px] font-medium text-slate-500">Nama Mahasiswa</p>
				{students.length ? (
					<ol className="max-h-64 overflow-y-auto space-y-1 text-sm text-slate-800">
						{students.map((s, idx) => (
							<li
								key={s.id ?? idx}
								className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5"
							>
								<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
								<span>{s.nama || s.name}</span>
							</li>
						))}
					</ol>
				) : (
					<p className="text-sm text-slate-500">Belum ada mahasiswa di kelas ini.</p>
				)}
			</div>

			<div className="flex items-center justify-end pt-2">
				<Button
					type="button"
					color="blue"
					variant="solid"
					size="sm"
					onClick={() => popup.close()}
				>
					Tutup
				</Button>
			</div>
		</div>
	);
}

function EditClassModal({ initialClass, lecturerName, onSuccess }) {
	const popup = usePopup();
	const [name, setName] = useState(initialClass.class_name || '');
	const [description, setDescription] = useState(initialClass.description || '');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e) => {
		e?.preventDefault();
		if (isSubmitting) return;
		setIsSubmitting(true);
		setError('');
		try {
			await window.axios.put(`/classes/${initialClass.id}`, {
				class_name: name,
				description,
			});
			onSuccess?.();
			popup.close();
		} catch (err) {
			setError('Gagal mengubah kelas. Coba lagi.');
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
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
			</div>

			<div className="space-y-1">
				<p className="text-[11px] font-medium text-slate-500">Deskripsi</p>
				<textarea
					className="w-full min-h-[100px] rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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

