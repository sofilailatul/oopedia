import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import { usePopup } from '@/Components/PopUp/PopUpProvider';
import { useDosenMaterialCreate } from '@/Features/materials/useDosenMaterialCreate';
import UploadImage from '@/Components/UploadImage';
import BackToListHeader from '@/Components/Shared/BackToListHeader';

export default function CreateMaterial(props) {
	return (
		<AppLayout title="Buat Materi Baru" label="Buat Materi Baru">
			<CreateMaterialContent {...props} />
		</AppLayout>
	);
}

function CreateMaterialContent({ authUser }) {
	const { state, actions } = useDosenMaterialCreate({ authUser });
	const { title, description, sections, isSubmitting, creatorName } = state;
	const {
		setTitle,
		setDescription,
		addSection,
		updateSectionField,
		updateSectionImage,
		publish,
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
						key={section.id}
						className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_10px_25px_rgba(15,23,42,0.08)] space-y-4"
					>
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
								<span className="text-gray-400">{String.fromCharCode(65 + index)}.</span>
								<input
									type="text"
									className="flex-1 border-none focus:ring-0 focus:outline-none placeholder:text-gray-400 text-sm"
									placeholder="Masukkan sub judul"
									value={section.title}
									onChange={(e) =>
										updateSectionField(section.id, 'title', e.target.value)
									}
								/>
							</div>
						</div>

						<textarea
							className="w-full min-h-[120px] border rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
							placeholder="Masukkan isi konten section"
							value={section.content}
							onChange={(e) =>
								updateSectionField(section.id, 'content', e.target.value)
							}
						/>

						<div className="mt-3">
							<UploadImage
								label="Upload Image"
								helper="Drag and drop files here or click to upload"
								subHelper="Supported formats: .png, .jpeg"
								file={section.imageFile}
								url={section.previewUrl}
								onFileChange={(file) => updateSectionImage(section.id, file)}
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
					</div>
				))}

				<Button
					type="button"
					size="md"
					color="blue"
					variant="outline"
					className="mt-2 w-full"
					onClick={addSection}
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
					color={isSubmitting ? 'gray' : 'yellow'}
					variant="solid"
					onClick={() => {
						if (isSubmitting) return;
						popup.confirm({
							title: 'Konfirmasi Publish',
							message: 'Yakin akan mempublish materi ini?',
							confirmText: 'Ya, Publish',
							cancelText: 'Batal',
							onConfirm: () => publish(),
						});
					}}
					disabled={isSubmitting}
					className="w-full"
				>
					{isSubmitting ? 'Menyimpan...' : 'Publish'}
				</Button>
			</aside>
		</div>
	);
}

