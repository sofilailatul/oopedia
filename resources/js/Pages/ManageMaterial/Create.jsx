import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import Button from '@/Components/Button';
import StatusModal from '@/Components/StatusModal';
import Dropdown from '@/Components/Dropdown';
import { useDosenMaterialCreate } from '@/Features/materials/useDosenMaterialCreate';
import UploadImage from '@/Components/UploadImage';
import { FaPlus, FaCheck, FaBookOpen, FaChevronDown } from 'react-icons/fa';

export default function ManageMaterialCreate(props) {
	const { authUser, material = null, subTopics = [] } = props;
	const role = (authUser?.role || '').toLowerCase();
	const baseRole = role === 'superadmin' ? 'superadmin' : 'dosen';
	const indexRouteName = `${baseRole}.materials.index`;
	const indexUrl = route(indexRouteName);

	const { state, actions } = useDosenMaterialCreate({ authUser, material, subTopics });
	const { title, description, sections, isSubmitting, creatorName } = state;
	const {
		setTitle,
		setDescription,
		addSection,
		updateSectionField,
		updateSectionImage,
		publish,
	} = actions;

	const [showConfirm, setShowConfirm] = useState(false);
	const [showBackConfirm, setShowBackConfirm] = useState(false);
	const [resultModal, setResultModal] = useState(null);
	const [showResult, setShowResult] = useState(false);

	const titleRef = useRef(null);
	const descriptionRef = useRef(null);

	const autoResize = (ref) => {
		if (ref.current) {
			ref.current.style.height = 'auto';
			ref.current.style.height = ref.current.scrollHeight + 'px';
		}
	};

	useEffect(() => {
		autoResize(titleRef);
	}, [title]);
	useEffect(() => {
		autoResize(descriptionRef);
	}, [description]);

	const hasChanges = title || description || sections.some((s) => s.title || s.subTopicId || s.content || s.imageFile);

	const handleBackClick = (e) => {
		if (hasChanges && !isSubmitting) {
			if (e && typeof e.preventDefault === 'function') {
				e.preventDefault();
			}
			setShowBackConfirm(true);
		} else {
			router.visit(indexUrl);
		}
	};

	const handlePrePublishValidate = () => {
		if (!title || title.trim() === '') {
			setResultModal({
				type: 'error',
				title: 'Validasi Gagal',
				message: 'Judul materi wajib diisi sebelum dipublish.',
				confirmText: 'Tutup',
				onConfirm: () => setShowResult(false),
			});
			setShowResult(true);
			return;
		}

		if (!description || description.trim() === '') {
			setResultModal({
				type: 'error',
				title: 'Validasi Gagal',
				message: 'Deskripsi materi wajib diisi agar gambaran pembelajaran lebih jelas.',
				confirmText: 'Tutup',
				onConfirm: () => setShowResult(false),
			});
			setShowResult(true);
			return;
		}

		const hasValidSection = sections.some((s) => {
			const textFilled = s.content && s.content.trim() !== '';
			const titleFilled = s.title && s.title.trim() !== '';
			const hasImage = !!s.imageFile;
			return textFilled || titleFilled || hasImage;
		});

		if (!hasValidSection) {
			setResultModal({
				type: 'error',
				title: 'Materi Kosong',
				message: 'Minimal kamu harus mengisi satu bagian materi sebelum mempublish.',
				confirmText: 'Siap',
				onConfirm: () => setShowResult(false),
			});
			setShowResult(true);
			return;
		}

		setShowConfirm(true);
	};

	const extractValidationMessage = (errors, fallback) => {
		const firstMessage = Object.values(errors || {})?.[0];
		if (Array.isArray(firstMessage)) return firstMessage[0] || fallback;
		if (typeof firstMessage === 'string') return firstMessage;
		return fallback;
	};

	const handlePublish = () => {
		if (isSubmitting) return;
		publish(null, {
			onSuccess: () => {
				setResultModal({
					type: 'success',
					title: 'Berhasil',
					message: 'Materi  telah diterbitkan dan sekarang bisa diakses.',
					confirmText: 'Kembali ke daftar',
					onConfirm: () => {
						setShowResult(false);
						router.visit(indexUrl);
					},
				});
				setShowResult(true);
			},
			onError: (errors) => {
				setResultModal({
					type: 'error',
					title: 'Gagal',
					message: extractValidationMessage(errors, 'Ups, ada kesalahan ketika mempublish materi. Coba lagi ya!'),
					confirmText: 'Tutup',
					onConfirm: () => setShowResult(false),
				});
				setShowResult(true);
			},
		});
	};

	const getSubTopicName = (subTopicId) => {
		const selected = subTopics.find((item) => String(item.id) === String(subTopicId));
		return selected?.name || 'Pilih subtopic';
	};

	return (
		<AppLayout
			title="Buat Materi Baru"
			label="Buat Materi"
			backHref={hasChanges ? '' : indexUrl}
			onBackClick={handleBackClick}
			backLabel="Kembali"
		>
			<div className="mx-auto flex flex-col lg:flex-row gap-4 pb-16 px-2">
				{/* -- Form Area -- */}
				<div className="flex-1 w-full space-y-4">
					{/* Header Text Input */}
					<div className="px-2 py-2">
						<textarea
							ref={titleRef}
							className="w-full text-xl font-extrabold text-slate-900 border-none focus:ring-0 focus:outline-none placeholder:text-slate-300 resize-none overflow-hidden bg-transparent tracking-tight leading-tight py-1"
							placeholder="Beri judul materi"
							value={title}
							rows={1}
							onChange={(e) => setTitle(e.target.value)}
						/>
						<textarea
							ref={descriptionRef}
							className="mt-2 w-full text-sm text-slate-500 border-none focus:ring-0 focus:outline-none resize-none overflow-hidden bg-transparent placeholder:text-slate-400 font-medium leading-relaxed py-1"
							rows={1}
							placeholder="Deskripsikan secara singkat apa yang akan dipelajari..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					<hr className="border-slate-400/60" />

					{/* Sections Iterator */}
					<div className="space-y-1">
						{sections.map((section, index) => (
							<div
								key={section.id}
								className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group"
							>
								{/* Card Title Box */}
								<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-5">
									<div className="inline-flex items-center justify-center shrink-0 w-10 h-10 bg-slate-900 text-white rounded-2xl font-bold text-sm">
										{String.fromCharCode(65 + index)}
									</div>
									<input
										type="text"
										className="flex-1 border-none focus:ring-0 focus:outline-none placeholder:text-slate-300 text-sm font-bold text-slate-800 bg-transparent px-0 transition-opacity"
										placeholder="	Tuliskan Sub-judul"
										value={section.title}
										onChange={(e) => updateSectionField(section.id, 'title', e.target.value)}
									/>
								</div>

								<div className="mb-4">
									<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
										Subtopic
									</label>
									<Dropdown className="w-full">
										<Dropdown.Trigger>
											<button
												type="button"
												disabled={subTopics.length === 0}
												className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
											>
												<span className="truncate">
													{subTopics.length === 0 ? 'Belum ada subtopic' : getSubTopicName(section.subTopicId)}
												</span>
												<FaChevronDown className="text-[11px] text-slate-400" />
											</button>
										</Dropdown.Trigger>

										{subTopics.length > 0 ? (
											<Dropdown.Content align="left" width="64" contentClasses="py-2 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-64 overflow-y-auto">
												<Dropdown.Item
													onClick={() => updateSectionField(section.id, 'subTopicId', '')}
													className={`flex items-center justify-between px-3 py-2.5 ${
														!section.subTopicId ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
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
															onClick={() => updateSectionField(section.id, 'subTopicId', String(subTopic.id))}
															className={`flex items-center justify-between px-3 py-2.5 ${
																active ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
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

								{/* Content Textarea Container */}
								<div className="group-focus-within:ring-4 ring-blue-50 transition-all rounded-2xl mb-4">
									<textarea
										className="w-full min-h-[180px] bg-slate-50/50 border-transparent rounded-2xl p-5 text-xs leading-relaxed text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-200 focus:ring-0 transition-all resize-y"
										placeholder="Tuliskan materi pembelajaran"
										value={section.content}
										onChange={(e) => updateSectionField(section.id, 'content', e.target.value)}
									/>
								</div>

								{/* Hidden / Subtle Image Upload */}
								<div className="mt-2">
									<UploadImage
											label="Tambah Visual/Gambar"
											helper="Tarik file gambar ke sini atau klik."
											subHelper="Format PNG/JPG, maks 2MB."
											file={section.imageFile}
											url={section.previewUrl}
											onFileChange={(file) => updateSectionImage(section.id, file)}
											className="rounded-2xl border-dashed border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
										/>
										{section.previewUrl && (
											<div className="mt-4 rounded-2xl overflow-hidden border border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.05)] inline-block">
												<img
													src={section.previewUrl}
													alt={section.title || `Preview gambar section ${index + 1}`}
													className="max-h-72 object-cover object-center w-full block hover:scale-105 transition-transform duration-500"
												/>
											</div>
										)}
								</div>
							</div>
						))}
					</div>

					{/* Ghost Add Section Button */}
					<Button
						color="grey"
						variant="outline"
						onClick={addSection}
						className="w-full py-6 rounded-3xl border-2 border-dashed border-slate-200/80 text-slate-400 font-bold hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50/50 transition-all flex flex-col items-center justify-center gap-3 group"
					>
						<div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-[0_4px_15px_rgb(0,0,0,0.05)] group-hover:scale-110 transition-all duration-300">
							<FaPlus className="w-4 h-4 text-slate-500" />
						</div>
						<span className="text-sm tracking-wide">TAMBAH BAGIAN BARU</span>
					</Button>
				</div>

				{/* -- Sticky Publish Controller (Sidebar) -- */}
				<aside className="w-full lg:w-[320px] shrink-0">
					<div className="sticky top-[100px] space-y-5">
						{/* Publish Card Area */}
						<div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden group">
							<div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-125 transition-transform duration-700" />

							<div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
								<FaBookOpen className="w-5 h-5" />
							</div>

							<h3 className="text-[17px] font-bold text-slate-900 tracking-tight">Siap disebarkan?</h3>
							<p className="text-[13px] text-slate-500 mt-1.5 mb-6 leading-relaxed">
								Pastikan semua sub-materi dan gambarnya sudah benar sebelum mahasiswa mulai belajar.
							</p>

							<Button
								color="blue"
								className="w-full"
								onClick={handlePrePublishValidate}
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<span>Menyimpan...</span>
								) : (
									<>
										<FaCheck className="w-3.5 h-3.5" />
										<span>Publish Sekarang</span>
									</>
								)}
							</Button>
						</div>

						{/* Author Badge Minimalist */}
						<div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4 hover:-translate-y-0.5 transition-transform">
							<div className="w-12 h-12 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-[18px] flex items-center justify-center text-xl shadow-inner">
								👤
							</div>
							<div>
								<p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">Author</p>
								<p className="text-sm font-bold text-slate-800 line-clamp-1">{creatorName}</p>
							</div>
						</div>
					</div>
				</aside>
			</div>

			{/* -- Modals -- */}
			<StatusModal
				show={showConfirm}
				type="confirm"
				title="Konfirmasi Publish"
				message="Apakah materi ini udah final dan siap dipelajari mahasiswa?"
				confirmText="Ya, Publish!"
				cancelText="Cek Lagi"
				onConfirm={() => {
					setShowConfirm(false);
					handlePublish();
				}}
				onCancel={() => setShowConfirm(false)}
				onClose={() => setShowConfirm(false)}
			/>

			<StatusModal
				show={showBackConfirm}
				type="confirm"
				title="Yah, progresmu belum disimpan"
				message="Masih ada teks atau gambar yang belum kamu Publish. Yakin mau keluar halaman sekarang? Perubahanmu bakalan hilang lho."
				confirmText="Biarin, Keluar Aja"
				cancelText="Tetap di Sini"
				onConfirm={() => {
					setShowBackConfirm(false);
					router.visit(indexUrl);
				}}
				onCancel={() => setShowBackConfirm(false)}
				onClose={() => setShowBackConfirm(false)}
			/>

			<StatusModal
				show={showResult}
				type={resultModal?.type || 'success'}
				title={resultModal?.title}
				message={resultModal?.message}
				confirmText={resultModal?.confirmText || 'OK'}
				onConfirm={resultModal?.onConfirm}
				onClose={resultModal?.onConfirm}
			/>
		</AppLayout>
	);
}
