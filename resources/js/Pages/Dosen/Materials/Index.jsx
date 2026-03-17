import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link } from "@inertiajs/react";
import { FaPlus, FaPen, FaEye } from "react-icons/fa";
import Button from "@/Components/Button";
import Card from "@/Components/Card";
import { useDosenMaterialsIndex } from "@/Features/materials/useDosenMaterialsIndex";

export default function KelolaMateri({ materials = [] }) {
  const { state, view, actions } = useDosenMaterialsIndex({ materials });
  const { currentPage, perPage } = state;
  const { paginated, pageNumbers, totalPages } = view;
  const { handlePerPageChange, goToPage } = actions;

  return (
    <AppLayout title="Kelola Materi" label="Kelola Materi">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-end">

          <Button
            as={Link}
            href="/dosen/materi/create"
            color="blue"
            variant="solid"
            size="md"
            leftIcon={<FaPlus className="h-3.5 w-3.5" />}
            className="rounded-full shadow-sm"
          >
            Tambah Materi
          </Button>
        </div>

        {/* Table card */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 w-16 text-left">No</th>
                <th className="px-5 py-3 text-left">Materi</th>
                <th className="px-5 py-3 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((material, idx) => (
                  <tr
                    key={material.id}
                    className="group border-t border-slate-100/80 bg-white hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-5 py-3 align-middle text-xs text-slate-500">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                        {(currentPage - 1) * perPage + idx + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 group-hover:text-slate-950">
                          {material.material_name}
                        </span>
                        {typeof material.order_number === 'number' && (
                          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                            <span className="inline-flex h-4 rounded-full bg-slate-100 px-2 text-[10px] uppercase tracking-wide text-slate-600">
                              Materi ke-{material.order_number}
                            </span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 align-middle text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/dosen/materi/${material.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-slate-400 hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-600 transition"
                          title="Lihat"
                        >
                          <FaEye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dosen/materi/${material.id}/edit`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-slate-400 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600 transition"
                          title="Edit"
                        >
                          <FaPen className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-5 py-10 text-center text-sm text-slate-400">
                    Belum ada materi. Yuk mulai buat materi pertamamu ✨
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}
