import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import Card from '@/Components/Card';
import StatusModal from '@/Components/StatusModal';
import { usePopup } from '@/Components/PopUp/PopUpProvider';
import { usePage, router } from '@inertiajs/react';
import { FaPlus } from 'react-icons/fa';
import Field from '@/Components/Field';
import Dropdown from '@/Components/Dropdown';

function getApiErrorMessage(err, fallbackMessage) {
	const payloadMessage = err?.response?.data?.message;
	if (payloadMessage) return payloadMessage;

	const firstValidationMessage = Object.values(err?.response?.data?.errors || {})?.[0]?.[0];
	if (firstValidationMessage) return firstValidationMessage;

	return fallbackMessage;
}

export default function ManageClassesIndex(props) {
	const { authUser } = props;

	return (
		<AppLayout title="Kelola Kelas" label="Kelola Kelas">
			<DosenClassesContent {...props} />
		</AppLayout>
	);
}

function DosenClassesContent({ classes = [], authUser, lecturers = [] }) {
	const popup = usePopup();
	const { props } = usePage();
	const user = authUser || props?.auth?.user || {};
	const lecturerName = user.nama || user.name || 'Dosen';
	const role = String(user.role || '').toLowerCase();
	const isSuperadmin = role === 'superadmin';

	const handleOpenCreate = () => {
		popup.open({
			title: 'Buat Kelas Baru',
			size: 'lg',
			content: (
				<CreateClassModal
					lecturerName={lecturerName}
					lecturers={lecturers}
					isSuperadmin={isSuperadmin}
					onSuccess={() => router.reload({ only: ['classes'] })}
				/>
			),
		});
	};

	const handleOpenDetail = (cls, lecturerLabel) => {
		popup.open({
			title: 'Detail Kelas',
			size: 'lg',
			content: <ShowClassModal classId={cls.id} lecturerName={lecturerLabel || lecturerName} />,
		});
	};

	const handleOpenEdit = (cls, lecturerLabel) => {
		popup.open({
			title: 'Edit Kelas',
			size: 'lg',
			content: (
				<EditClassModal
					initialClass={cls}
					lecturers={lecturers}
					isSuperadmin={isSuperadmin}
					lecturerName={lecturerLabel || lecturerName}
					onSuccess={() => router.reload({ only: ['classes'] })}
				/>
			),
		});
	};

	return (
		<div className="mx-auto max-w-6xl rounded-2xl space-y-6">
			<div className="rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="space-y-1">
						<h1 className="text-xl font-semibold tracking-tight text-slate-900">Daftar Kelas</h1>
						<p className="text-sm text-slate-500">Atur kelas, lihat detail mahasiswa, dan update informasi kelas.</p>
					</div>
					<Button
						color="green"
						variant="solid"
						size="md"
						leftIcon={<FaPlus className="h-3.5 w-3.5" />}
						className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-200"
						onClick={handleOpenCreate}
					>
						Tambah kelas
					</Button>
				</div>
			</div>

			{/* Cards grid */}
			<div className="mt-1 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{classes.length ? (
					classes.map((cls) => (
						<ClassCard
							key={cls.id}
							cls={cls}
							lecturerName={
								isSuperadmin
									? cls.lecturer?.nama || cls.lecturer?.name || 'Dosen'
									: lecturerName
							}
							onDetail={() =>
								handleOpenDetail(
									cls,
									isSuperadmin
										? cls.lecturer?.nama || cls.lecturer?.name || 'Dosen'
										: lecturerName
								)
							}
							onEdit={() =>
								handleOpenEdit(
									cls,
									isSuperadmin
										? cls.lecturer?.nama || cls.lecturer?.name || 'Dosen'
										: lecturerName
								)
							}
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
		<Card className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-start gap-3 flex-1 min-w-0">
					<span className="mt-0.5 h-10 w-0.5 rounded-full bg-gradient-to-b from-slate-700 to-slate-300" />
					<div className="space-y-1 min-w-0">
						<p className="line-clamp-2 text-base font-semibold leading-tight text-slate-900">{cls.class_name}</p>
						<p className="text-[11px] font-medium text-slate-500">{lecturerName}</p>
						{cls.description && (
							<p className="line-clamp-2 text-[11px] text-slate-500/90">{cls.description}</p>
						)}
					</div>
				</div>
				<div className="flex flex-col items-end gap-1 text-[11px] text-slate-500">
					<span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
						<span className="font-mono text-[11px]">{cls.class_code}</span>
					</span>
					<span className="text-slate-400">{studentsCount} siswa</span>
				</div>
			</div>
			<div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
				<span className="inline-flex items-center gap-1 text-slate-400">
					<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
					<span>Kelas aktif</span>
				</span>
				<div className="inline-flex gap-2">
					<button
						type="button"
						onClick={onDetail}
						className="rounded-lg border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
					>
						Detail
					</button>
					<button
						type="button"
						onClick={onEdit}
						className="rounded-lg bg-slate-900 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-slate-800"
					>
						Edit
					</button>
				</div>
			</div>
		</Card>
	);
}

function CreateClassModal({ lecturerName, lecturers = [], isSuperadmin = false, onSuccess }) {
	const popup = usePopup();
	const [name, setName] = useState('');
	const [classCode, setClassCode] = useState('');
	const [description, setDescription] = useState('');
	const [selectedLecturerId, setSelectedLecturerId] = useState(
		isSuperadmin && lecturers.length ? lecturers[0].id : null,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');

	const submitCreate = async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		setError('');

		if (isSuperadmin && !selectedLecturerId) {
			setError('Silakan pilih dosen penanggung jawab kelas.');
			setIsSubmitting(false);
			return;
		}

		// Validasi Kode Kelas: max 6 kombinasi huruf dan angka
		const codeRegex = /^[A-Z0-9]+$/;
		if (classCode.length > 6) {
			setError('Kode kelas maksimal 6 karakter.');
			setIsSubmitting(false);
			return;
		}
		if (!codeRegex.test(classCode)) {
			setError('Kode kelas hanya boleh berisi kombinasi huruf dan angka.');
			setIsSubmitting(false);
			return;
		}
		try {
			await window.axios.post('/classes', {
				class_name: name,
				class_code: classCode,
				description,
				...(isSuperadmin && selectedLecturerId
					? { lecturer_id: selectedLecturerId }
					: {}),
			});
			onSuccess?.();
			popup.alert({
				type: 'success',
				title: 'Berhasil',
				message: 'Kelas berhasil ditambahkan.',
				onClose: () => popup.close(),
			});
		} catch (err) {
			const message = getApiErrorMessage(err, 'Gagal menyimpan kelas. Coba lagi.');
			setError(message);
			popup.alert({
				type: 'error',
				title: 'Gagal',
				message,
			});
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleSubmit = (e) => {
		e?.preventDefault();
		if (isSubmitting) return;

		popup.confirm({
			title: 'Konfirmasi',
			message: 'Yakin ingin menyimpan kelas baru ini?',
			confirmText: 'Ya, simpan',
			onConfirm: () => submitCreate(),
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5 rounded-2xl">
			{isSuperadmin ? (
				<div className="mb-4">
					<label className="block mb-1 text-xs font-medium text-gray-700">
						DOSEN PENANGGUNG JAWAB
						<span className="text-red-500 ml-1">*</span>
					</label>
					<Dropdown>
						<Dropdown.Trigger>
							<div className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-[12px] shadow-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-300 transition-colors">
								<span className={selectedLecturerId ? 'text-slate-800' : 'text-slate-400'}>
									{selectedLecturerId
										? lecturers.find((l) => l.id === selectedLecturerId)?.nama || lecturers.find((l) => l.id === selectedLecturerId)?.name || 'Pilih dosen...'
										: 'Pilih dosen...'}
								</span>
								<span className="text-slate-400 text-[10px]">▼</span>
							</div>
						</Dropdown.Trigger>
						<Dropdown.Content width="full">
							{lecturers.map((lec) => (
								<Dropdown.Item
									key={lec.id}
									onClick={() => setSelectedLecturerId(lec.id)}
									className={selectedLecturerId === lec.id ? 'bg-blue-50 text-blue-700 font-semibold' : ''}
								>
									{lec.nama || lec.name || lec.email}
								</Dropdown.Item>
							))}
						</Dropdown.Content>
					</Dropdown>
				</div>
			) : (
				<div className="mb-4 space-y-1">
					<p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
						Dosen Penanggung Jawab
					</p>
					<div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
						<span className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-500">👤</span>
						<span className="truncate">{lecturerName}</span>
					</div>
				</div>
			)}

			<Field
				label="NAMA KELAS"
				placeholder="Masukkan Nama Kelas"
				value={name}
				onChange={(e) => setName(e.target.value)}
				required
			/>

			<Field
				label="KODE KELAS"
				placeholder="Masukkan Kode Kelas - Maksimal 6 Kombinasi Huruf dan Angka (contoh: IF101A)"
				value={classCode}
				onChange={(e) => setClassCode(e.target.value.toUpperCase())}
				required
				maxLength={6}
			/>

			<Field
				label="DESKRIPSI"
				as="textarea"
				placeholder="Deskripsi Kelas"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				rows={3}
			/>

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

	const students = (data.users || []).filter((user) => {
		const directRole = String(user?.role || '').toLowerCase();
		if (directRole) return directRole === 'mahasiswa';

		if (Array.isArray(user?.roles)) {
			return user.roles.some((roleItem) => {
				if (typeof roleItem === 'string') {
					return roleItem.toLowerCase() === 'mahasiswa';
				}
				return String(roleItem?.name || '').toLowerCase() === 'mahasiswa';
			});
		}

		return false;
	});
	const className = data.class_name;
	const classCode = data.class_code;

	return (
		<div className="space-y-5 rounded-2xl">
			<div className="rounded-2xl grid gap-4 md:grid-cols-2">
				<div className="space-y-1">
					<p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Nama Dosen</p>
					<div className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-700">
						<span className="truncate">{lecturerName}</span>
					</div>
				</div>
				<div className="space-y-1">
					<p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Kode Kelas</p>
					<div className="flex min-h-[44px] items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-800">
						<span className="font-mono text-[12px]">{classCode}</span>
					</div>
				</div>
			</div>

			<div className="space-y-1">
				<p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Nama Kelas</p>
				<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-800">
					{className}
				</div>
			</div>

			<div className="space-y-2">
				<p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Nama Mahasiswa</p>
				{students.length ? (
					<ol className="max-h-64 space-y-1 overflow-y-auto text-[12px] text-slate-800">
						{students.map((s, idx) => (
							<li
								key={s.id ?? idx}
								className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5"
							>
								<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
								<span>{s.nama || s.name}</span>
							</li>
						))}
					</ol>
				) : (
					<p className="text-[12px] text-slate-500">Belum ada mahasiswa di kelas ini.</p>
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

function EditClassModal({ initialClass, lecturerName, lecturers = [], isSuperadmin = false, onSuccess }) {
	const popup = usePopup();
	const [name, setName] = useState(initialClass.class_name || '');
	const [classCode, setClassCode] = useState(initialClass.class_code || '');
	const [description, setDescription] = useState(initialClass.description || '');
	const [selectedLecturerId, setSelectedLecturerId] = useState(initialClass.lecturer_id || null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');

	const submitEdit = async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		setError('');

		// Validasi Kode Kelas: max 6 kombinasi huruf dan angka
		const codeRegex = /^[A-Z0-9]+$/;
		if (classCode.length > 6) {
			setError('Kode kelas maksimal 6 karakter.');
			setIsSubmitting(false);
			return;
		}
		if (!codeRegex.test(classCode)) {
			setError('Kode kelas hanya boleh berisi kombinasi huruf dan angka.');
			setIsSubmitting(false);
			return;
		}
		try {
			await window.axios.put(`/classes/${initialClass.id}`, {
				class_name: name,
				class_code: classCode,
				description,
				...(isSuperadmin && selectedLecturerId ? { lecturer_id: selectedLecturerId } : {}),
			});
			onSuccess?.();
			popup.alert({
				type: 'success',
				title: 'Berhasil',
				message: 'Kelas berhasil diperbarui.',
				onClose: () => popup.close(),
			});
		} catch (err) {
			const message = getApiErrorMessage(err, 'Gagal mengubah kelas. Coba lagi.');
			setError(message);
			popup.alert({
				type: 'error',
				title: 'Gagal',
				message,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSubmit = (e) => {
		e?.preventDefault();
		if (isSubmitting) return;

		popup.confirm({
			title: 'Konfirmasi',
			message: 'Yakin ingin menyimpan perubahan kelas ini?',
			confirmText: 'Ya, simpan',
			onConfirm: () => submitEdit(),
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			{isSuperadmin ? (
				<div className="mb-4">
					<label className="block mb-1 text-xs font-medium text-gray-700">
						DOSEN PENANGGUNG JAWAB
						<span className="text-red-500 ml-1">*</span>
					</label>
					<Dropdown>
						<Dropdown.Trigger>
							<div className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-[12px] shadow-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-300 transition-colors">
								<span className={selectedLecturerId ? 'text-slate-800' : 'text-slate-400'}>
									{selectedLecturerId
										? lecturers.find((l) => l.id === selectedLecturerId)?.nama || lecturers.find((l) => l.id === selectedLecturerId)?.name || 'Pilih dosen...'
										: 'Pilih dosen...'}
								</span>
								<span className="text-slate-400 text-[10px]">▼</span>
							</div>
						</Dropdown.Trigger>
						<Dropdown.Content width="full">
							{lecturers.map((lec) => (
								<Dropdown.Item
									key={lec.id}
									onClick={() => setSelectedLecturerId(lec.id)}
									className={selectedLecturerId === lec.id ? 'bg-blue-50 text-blue-700 font-semibold' : ''}
								>
									{lec.nama || lec.name || lec.email}
								</Dropdown.Item>
							))}
						</Dropdown.Content>
					</Dropdown>
				</div>
			) : (
				<div className="mb-4 space-y-1">
					<p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Nama Dosen</p>
					<div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
						<span className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-500">👤</span>
						<span className="truncate">{lecturerName}</span>
					</div>
				</div>
			)}

			<Field
				label="NAMA KELAS"
				placeholder="Masukkan Nama Kelas"
				value={name}
				onChange={(e) => setName(e.target.value)}
				required
			/>

			<Field
				label="KODE KELAS"
				placeholder="Masukkan Kode Kelas"
				value={classCode}
				onChange={(e) => setClassCode(e.target.value.toUpperCase())}
				required
				maxLength={6}
			/>

			<Field
				label="DESKRIPSI"
				as="textarea"
				placeholder="Deskripsi Kelas"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				rows={3}
			/>

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
