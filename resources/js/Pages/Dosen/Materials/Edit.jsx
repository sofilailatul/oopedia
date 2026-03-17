import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import Button from '@/Components/Button';
import { usePopup } from '@/Components/PopUp/PopUpProvider';
import { useDosenMaterialEdit } from '@/Features/materials/useDosenMaterialEdit';
import UploadImage from '@/Components/UploadImage';
import BackToListHeader from '@/Components/Shared/BackToListHeader';

export default function EditMaterial(props) {
	const materialTitle = props.material?.material_name ?? '';
	return (
		<AppLayout title={`Ubah Materi ${materialTitle}`} label="Ubah Materi">
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

	const popup = usePopup();

	return (
		<div className="max-w-6xl mx-auto flex gap-6">
				<div className="flex-1 space-y-4">
					{/* Back link */}
					<div className="mb-2">
						<BackToListHeader href="/dosen/materi" label="Kembali ke Daftar" />
					</div>

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
							key={section.id ?? index}
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
									onClick={() => deleteSection(index)}
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
						onClick={addSection}
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
							popup.confirm({
								title: 'Konfirmasi Publish',
								message: 'Yakin akan mempublish perubahan materi ini?',
								confirmText: 'Ya, Publish',
								cancelText: 'Batal',
								onConfirm: () =>
									saveMaterial({
										onSuccess: () => {
											popup.alert({
												title: 'Berhasil',
												message: 'Perubahan materi berhasil disimpan.',
												confirmText: 'Kembali ke daftar',
												onClose: () => router.visit('/dosen/materi'),
											});
										},
									}),
							});
						}}
						className="w-full"
					>
						Publish Perubahan
					</Button>
				</aside>
			</div>
	);
}

