import AppLayout from "@/Layouts/AppLayout";
import {
  FaBookOpen,
  FaLayerGroup,
  FaRegClock,
  FaUserAlt,
} from "react-icons/fa";

export default function ManageMaterialShow({ authUser, material }) {
  const role = (authUser?.role || "").toLowerCase();
  const baseRole = role === "superadmin" ? "superadmin" : "dosen";
  const indexRouteName = `${baseRole}.materials.index`;
  const indexUrl = route(indexRouteName);

  const contentCount = material?.contents?.length || 0;
  const displayDate = material?.created_at
    ? new Date(material.created_at).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

  return (
    <AppLayout
      title={`Lihat Materi ${material.material_name}`}
      label="Kelola Materi"
      backHref={indexUrl}
      backLabel="Kembali ke daftar materi"
    >
      <div className="mx-auto space-y-9">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 p-6  sm:p-8">
          <div className="relative space-y-8">
            <div>
              <h1 className="text-[18px] font-black leading-tight tracking-tight text-slate-900 sm:text-[18px]">
                {material.material_name}
              </h1>
              {material.description ? (
                <p className="mt-3   text-[12px] leading-relaxed text-slate-600 sm:text-[12px]">
                  {material.description}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {material.contents && material.contents.length > 0 ? (
            material.contents.map((content, index) => (
              <section
                key={content.id}
                className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:shadow-[0_14px_40px_rgba(15,23,42,0.1)]"
              >
                <div className="border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-cyan-50/60 px-8 py-5 sm:px-6">
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-2xl bg-slate-900 px-2 text-[11px] font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <h2 className="truncate text-[12px] font-bold tracking-tight text-slate-900 sm:text-[12px]">
                        {content.title || `Bagian ${index + 1}`}
                      </h2>
                      {content.sub_topic ? (
                        <span className="inline-flex shrink-0 items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">
                          {content.sub_topic}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="space-y-5 px-8 py-8 sm:px-8 sm:py-8">
                  {(content.image_url || content.image_path) && (
                    <div className="mx-auto w-full   overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100/50 shadow-sm">
                      <img
                        src={
                          content.image_url || `/storage/${content.image_path}`
                        }
                        alt={content.title || `Gambar bagian ${index + 1}`}
                        className="max-h-[260px] w-full object-contain sm:max-h-[320px]"
                      />
                    </div>
                  )}

                  <div className="whitespace-pre-line text-[12px] leading-relaxed text-slate-700">
                    {content.content_text || ""}
                  </div>
                </div>
              </section>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <p className="text-[12px] font-medium text-slate-500">
                Konten materi belum tersedia.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
