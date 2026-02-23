import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import ContentCard from '@/Components/ContentCard';

export default function DosenMaterialShow({ material }) {
  return (
    <AppLayout title={`Lihat Materi ${material.material_name}`} label="Kelola Materi">
      <div className="mx-auto space-y-4">
        <Link
          href="/dosen/materi"
          className="text-sm text-gray-600 hover:text-gray-900"
        > ← Kembali ke Daftar Materi
        </Link>

        {/* Header */}
        <ContentCard className="border-[#9fc4ff]" title={null}>
          <div className="flex items-start justify-between gap-4 space-y-4">
            <div className="space-y-4">
              <h1 className="text-lg font-bold text-gray-900">
                {material.material_name}
              </h1>

              {material.description && (
                <p className="text-sm text-gray-600 mt-2">
                  {material.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-3">
                <span>
                  
                  <strong>{material.author}</strong>
                </span>
              </div>
            </div>
          </div>
        </ContentCard>

        {/* Contents */}
        <div className="space-y-4">
          {material.contents && material.contents.length > 0 ? (
            material.contents.map((content) => (
              <ContentCard
                key={content.id}
                title={content.title || ''}
                className="border-[#9fc4ff]"
              >
                {content.image_path && (
                  <img
                    src={`/storage/${content.image_path}`}
                    alt={content.title || 'Gambar materi'}
                    className="w-[500px] max-h-auto rounded-lg shadow-sm mb-4"
                  />
                )}

                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: content.content_text }}
                />
              </ContentCard>
            ))
          ) : (
            <ContentCard title="Konten" className="border-[#9fc4ff]">
              <p className="text-gray-500 italic">
                Konten materi belum tersedia.
              </p>
            </ContentCard>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
