import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import Button from '@/Components/Button';
import StatusModal from '@/Components/StatusModal';
import { useDosenMaterialEdit } from '@/Features/materials/useDosenMaterialEdit';
import UploadImage from '@/Components/UploadImage';

export default function EditMaterial(props) {
	const materialTitle = props.material?.material_name ?? '';
	return (
		<AppLayout
			title={`Ubah Materi ${materialTitle}`}
			label="Ubah Materi"
			backHref={route('dosen.materials.index')}
			backLabel="Kembali ke daftar materi"
		>
			<EditMaterialContent {...props} />
		</AppLayout>
	);
}

function EditMaterialContent({ material, authUser }) {
	const { state, actions } = useDosenMaterialEdit({ material, authUser });
	const { title, description, orderNumber, sections, creatorName } = state;
	const {
		setTitle,
		setDescription,
		setOrderNumber,
		addSection,
		updateSectionField,
		updateSectionImage,
		saveMaterial,
		deleteSection,
	} = actions;

	const [showConfirm, setShowConfirm] = useState(false);
	const [resultModal, setResultModal] = useState(null);

	const extractValidationMessage = (errors, fallback) => {
		const firstMessage = Object.values(errors || {})?.[0];
		if (Array.isArray(firstMessage)) return firstMessage[0] || fallback;
		if (typeof firstMessage === 'string') return firstMessage;
		return fallback;
	};

	const handlePublish = () => {
		saveMaterial({
			onSuccess: () => {
				console.log(`[Material ID: ${material.id}] Publish SUKSES! Menampilkan modal success.`);
				setResultModal({
					type: 'success',
					title: 'Berhasil',
					message: 'Perubahan materi berhasil disimpan.',
					confirmText: 'Kembali ke daftar',
					onConfirm: () => {
						console.log(`[Material ID: ${material.id}] Modal success ditutup, redirecting...`);
						setResultModal(null);
						router.visit('/dosen/materi');
					},
				});
			},
			onError: (errors) => {
				console.log(`[Material ID: ${material.id}] Publish GAGAL! Menampilkan modal error. Errors:`, errors);
				setResultModal({
					type: 'error',
					title: 'Gagal',
					message: extractValidationMessage(errors, 'Gagal menyimpan perubahan materi. Coba lagi.'),
					confirmText: 'Tutup',
					onConfirm: () => {
						console.log(`[Material ID: ${material.id}] Modal error ditutup.`);
						setResultModal(null);
					},
				});
			},
		});
	};

	return (
		<>
		<div className="max-w-6xl mx-auto flex gap-6">
				<div className="flex-1 space-y-4">
					{/* Main card: title + description */}
					<div className="bg-white rounded-xl border border-green-400 p-5 shadow-sm">
						<input
							type="text"
							className="w-full text-lg font-semibold text-gray-900 border-none focus:ring-0 focus:outline-none placeholder:text-gray-400"
							placeholder="Untitled Learning Material"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
						<textarea
							className="mt-3 w-full text-sm text-gray-700 border-none focus:ring-0 focus:outline-none resize-none placeholder:text-gray-400"
							rows={3}
							placeholder="Add a description for your learning material..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					{/* Sections */}
					{sections.map((section, index) => (
						<div
							key={section.id ? `db-${section.id}` : `new-${index}`}
							className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_10px_25px_rgba(15,23,42,0.08)] space-y-4"
						>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2 text-sm font-semibold text-gray-800 w-full">
									<span className="text-gray-400">{String.fromCharCode(65 + index)}.</span>
									<input
										type="text"
										className="flex-1 border-none focus:ring-0 focus:outline-none placeholder:text-gray-400 text-sm"
										placeholder="Masukkan sub judul"
										value={section.title}
										onChange={(e) =>
											updateSectionField(index, 'title', e.target.value)
										}
									/>
								</div>
							</div>

							<textarea
								className="w-full min-h-[120px] border rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
								placeholder="Masukkan isi konten section"
								value={section.content}
								onChange={(e) =>
									updateSectionField(index, 'content', e.target.value)
								}
							/>

							<div className="mt-3">
								<UploadImage
									label="Upload Image"
									helper="Drag and drop files here or click to upload"
									subHelper="Supported formats: .png, .jpeg"
									file={section.imageFile}
									url={section.previewUrl || section.imagePath}
									onFileChange={(file) => updateSectionImage(index, file)}
								/>
								{section.previewUrl && (
									<div className="mt-3">
										<img
											src={section.previewUrl}
											alt={section.title || `Preview gambar section ${index + 1}`}
											className="max-h-64 rounded-lg border object-contain"
										/>
									</div>
								)}
							</div>

							<div className="mt-3 flex items-center justify-end gap-2">
								<Button
									type="button"
									size="sm"
									color="red"
									variant="outline"
									onClick={() => {
										console.log(`[Material ID: ${material.id}] Menghapus section index ${index} | Section ID: ${section.id || 'Baru ditambahkan'} | Judul: ${section.title || 'Tanpa Judul'}`);
										deleteSection(index);
									}}
									className="text-xs"
								>
									Hapus Section
								</Button>
							</div>
						</div>
					))}

					<Button
						type="button"
						size="md"
						color="blue"
						variant="outline"
						onClick={() => {
							console.log(`[Material ID: ${material.id}] Menambahkan section baru (Section ke-${sections.length + 1})`);
							addSection();
						}}
						className="mt-2 w-full"
					>
						<span className="mr-2 text-lg">+</span>
						Tambah Section
					</Button>
				</div>

				{/* Right sidebar */}
				<aside className="w-72 space-y-4">
					<div className="bg-white rounded-xl border p-4 shadow-sm">
						<h3 className="text-sm font-semibold text-gray-800 mb-3">
							Dibuat Oleh
						</h3>
						<div className="border rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50">
							{creatorName}
						</div>
					</div>

					<Button
						type="button"
						size="md"
						color="yellow"
						variant="solid"
						onClick={() => {
							console.log(`[Material ID: ${material.id}] Tombol 'Publish Perubahan' diklik, menampilkan Modal Konfirmasi...`);
							setShowConfirm(true);
						}}
						className="w-full"
					>
						Publish Perubahan
					</Button>
				</aside>
			</div>

			<StatusModal
				show={showConfirm}
				type="confirm"
				title="Konfirmasi Publish"
				message="Yakin akan mempublish perubahan materi ini?"
				confirmText="Ya, Publish"
				cancelText="Batal"
				onConfirm={() => {
					console.log(`[Material ID: ${material.id}] Modal Konfirmasi -> YAKIN PUBLISH!`);
					setShowConfirm(false);
					handlePublish();
				}}
				onCancel={() => {
					console.log(`[Material ID: ${material.id}] Modal Konfirmasi -> BATAL.`);
					setShowConfirm(false);
				}}
				onClose={() => setShowConfirm(false)}
			/>

			<StatusModal
				show={!!resultModal}
				type={resultModal?.type || 'success'}
				title={resultModal?.title}
				message={resultModal?.message}
				confirmText={resultModal?.confirmText || 'OK'}
				onConfirm={resultModal?.onConfirm}
				onClose={resultModal?.onConfirm}
			/>
		</>
	);
}

