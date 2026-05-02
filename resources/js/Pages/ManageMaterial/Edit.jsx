import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import Button from '@/Components/Button';
import StatusModal from '@/Components/StatusModal';
import { useDosenMaterialEdit } from '@/Features/materials/useDosenMaterialEdit';
import UploadImage from '@/Components/UploadImage';
import Dropdown from '@/Components/Dropdown';
import { FaChevronDown, FaCheck } from 'react-icons/fa';

export default function ManageMaterialEdit(props) {
	const { material, authUser, subTopics = [] } = props;
	const materialTitle = material?.material_name ?? '';
	const role = (authUser?.role || '').toLowerCase();
	const baseRole = role === 'superadmin' ? 'superadmin' : 'dosen';
	const indexRouteName = `${baseRole}.materials.index`;
	const indexUrl = route(indexRouteName);

	return (
		<AppLayout
			title={`Ubah Materi ${materialTitle}`}
			label="Ubah Materi"
			backHref={indexUrl}
			backLabel="Kembali ke daftar materi"
		>
			<EditMaterialContent material={material} authUser={authUser} indexUrl={indexUrl} subTopics={subTopics} />
		</AppLayout>
	);
}

function EditMaterialContent({ material, authUser, indexUrl, subTopics = [] }) {
	const { state, actions } = useDosenMaterialEdit({ material, authUser, subTopics });
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
						router.visit(indexUrl);
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

	const getSubTopicName = (subTopicId) => {
		const selected = subTopics.find((item) => String(item.id) === String(subTopicId));
		return selected?.name || 'Pilih subtopic';
	};

	return (
		<>
			<div className="mx-auto flex gap-6">
				<div className="flex-1 space-y-4">
					{/* Main card: title + description */}
					<div className="bg-white rounded-xl border border-sky-200 p-5 shadow-sm">
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
							<div className="w-full mb-4">
								<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
									Subtopic
								</label>
								<Dropdown className="w-full">
									<Dropdown.Trigger>
										<button
											type="button"
											disabled={subTopics.length === 0}
											className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2 text-sm text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-blue-400"
										>
											<span className="truncate">
												{subTopics.length === 0 ? 'Belum ada subtopic' : getSubTopicName(section.subTopicId)}
											</span>
											<FaChevronDown className="text-[11px] text-gray-400" />
										</button>
									</Dropdown.Trigger>

									{subTopics.length > 0 ? (
										<Dropdown.Content align="left" width="64" contentClasses="py-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-64 overflow-y-auto">
											<Dropdown.Item
												onClick={() => updateSectionField(index, 'subTopicId', '')}
												className={`flex items-center justify-between px-3 py-2.5 ${
													!section.subTopicId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
												}`}
											>
												<span>Pilih subtopic</span>
												{!section.subTopicId ? <FaCheck className="text-[10px]" /> : null}
											</Dropdown.Item>
											{subTopics.map((subTopic) => {
												const active = String(section.subTopicId) === String(subTopic.id);

												return (
													<Dropdown.Item
														key={subTopic.id}
														onClick={() => updateSectionField(index, 'subTopicId', String(subTopic.id))}
														className={`flex items-center justify-between px-3 py-2.5 ${
															active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
														}`}
													>
														<span className="truncate">{subTopic.name}</span>
														{active ? <FaCheck className="text-[10px]" /> : null}
													</Dropdown.Item>
												);
											})}
										</Dropdown.Content>
									) : null}
								</Dropdown>
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
							</div>

							<div className="mt-3 flex items-center justify-end gap-2">
								<Button
									type="button"
									size="sm"
									color="red"
									variant="outline"
									onClick={() => {
										console.log(
											`[Material ID: ${material.id}] Menghapus section index ${index} | Section ID: ${
												section.id || 'Baru ditambahkan'
											} | Judul: ${section.title || 'Tanpa Judul'}`,
										);
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
							console.log(
								`[Material ID: ${material.id}] Menambahkan section baru (Section ke-${
									sections.length + 1
								})`,
							);
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
					{/* Dibuat Oleh */}
					<div className="bg-white rounded-xl border p-4 shadow-sm">
						<h3 className="text-sm font-semibold text-gray-800 mb-3">Dibuat Oleh</h3>
						<div className="border rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50">
							{creatorName}
						</div>
					</div>

					{/* Urutan Materi — read-only */}
					<div className="bg-white rounded-xl border p-4 shadow-sm">
						<h3 className="text-sm font-semibold text-gray-800 mb-1">Urutan Materi</h3>
						<p className="text-[11px] text-slate-400 mb-3">Urutan hanya bisa diubah dari halaman daftar materi.</p>
						<div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-slate-50">
							<span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600">
								{orderNumber}
							</span>
							<span className="text-sm text-slate-500 font-medium">Materi ke-{orderNumber}</span>
						</div>
					</div>

					{/* Lock notice */}
					{material?.is_locked && (
						<div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
							<span className="text-amber-500 mt-0.5 shrink-0">🔒</span>
							<p className="text-[11px] text-amber-700 leading-relaxed">
								Materi ini sudah diakses mahasiswa. Konten tetap bisa diedit, namun urutan dikunci.
							</p>
						</div>
					)}

					<Button
						type="button"
						size="md"
						color="yellow"
						variant="solid"
						onClick={() => {
							console.log(
								`[Material ID: ${material.id}] Tombol 'Publish Perubahan' diklik, menampilkan Modal Konfirmasi...`,
							);
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
