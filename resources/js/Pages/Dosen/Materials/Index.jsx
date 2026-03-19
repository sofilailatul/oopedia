import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Link } from "@inertiajs/react";
import { FaPlus, FaPen, FaEye, FaChevronUp, FaChevronDown, FaLock } from "react-icons/fa";
import Button from "@/Components/Button";
import Card from "@/Components/Card";
import StatusModal from "@/Components/StatusModal";
import { useDosenMaterialsIndex } from "@/Features/materials/useDosenMaterialsIndex";
import { useState } from "react";

export default function KelolaMateri({ materials = [] }) {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleOrderSuccess = () => {
    setShowSuccessModal(true);
  };

  const handleOrderError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const { state, view, actions } = useDosenMaterialsIndex({ 
    materials, 
    onOrderSuccess: handleOrderSuccess,
    onOrderError: handleOrderError
  });
  const { currentPage, perPage, isSavingOrder, totalMaterials } = state;
  const { paginated, pageNumbers, totalPages } = view;
  const { handlePerPageChange, goToPage, moveUp, moveDown } = actions;

  return (
    <AppLayout title="Kelola Materi" label="Kelola Materi">
		<div className="mx-auto max-w-6xl space-y-6">
			<div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]  p-5 sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="space-y-1">
						<h1 className="text-xl font-semibold tracking-tight text-slate-900">Daftar Materi</h1>
						<p className="text-sm text-slate-500">Atur materi, lihat dan update detail materi.</p>
					</div>

            <Button
              as={Link}
              href="/dosen/materi/create"
              color="blue"
              variant="solid"
              size="md"
              leftIcon={<FaPlus className="h-3.5 w-3.5" />}
              className="rounded-full shadow-sm"
              onClick={() => console.log('Tombol Tambah Materi diklik')}
            >
              Tambah Materi
            </Button>
          </div>
        </div>

        {/* Table card */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 w-24 text-center">Urutan</th>
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
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              console.log('Tombol Geser ke Atas diklik untuk index:', idx, 'material:', material.material_name);
                              moveUp((currentPage - 1) * perPage + idx);
                            }}
                            disabled={(currentPage - 1) * perPage + idx === 0 || isSavingOrder || material.is_locked || (paginated[idx - 1]?.is_locked)}
                            className="text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded active:scale-75 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all p-1"
                            title={material.is_locked ? "Terkunci" : "Geser ke Atas"}
                          >
                            <FaChevronUp className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              console.log('Tombol Geser ke Bawah diklik untuk index:', idx, 'material:', material.material_name);
                              moveDown((currentPage - 1) * perPage + idx);
                            }}
                            disabled={(currentPage - 1) * perPage + idx === totalMaterials - 1 || isSavingOrder || material.is_locked || (paginated[idx + 1]?.is_locked)}
                            className="text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded active:scale-75 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all p-1"
                            title={material.is_locked ? "Terkunci" : "Geser ke Bawah"}
                          >
                            <FaChevronDown className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100/80 text-[11px] font-bold text-slate-600 shadow-sm border border-slate-200/50">
                          {(currentPage - 1) * perPage + idx + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 group-hover:text-slate-950 flex items-center gap-2">
                          {material.material_name}
                          {material.is_locked && (
                            <span title="Sudah diakses mahasiswa - Tidak bisa diedit" className="text-slate-400">
                              <FaLock className="w-2.5 h-2.5" />
                            </span>
                          )}
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
                        <Button
                          as={Link}
                          href={route("dosen.materials.show", material.id)}
                          color="green"
                          variant="outline"
                          size="sm"
                          leftIcon={<FaEye className="h-3 w-3" />}
                          onClick={() => console.log('Tombol Lihat diklik untuk material:', material.material_name)}
                        >
                          Lihat
                        </Button>
                        {!material.is_locked && (
                          <Button
                            as={Link}
                            href={route("dosen.materials.edit", material.id)}
                            color="blue"
                            variant="outline"
                            size="sm"
                            leftIcon={<FaPen className="h-3 w-3" />}
                            onClick={() => console.log('Tombol Edit diklik untuk material:', material.material_name)}
                          >
                            Edit
                          </Button>
                        )}
                        {material.is_locked && (
                          <Button
                            disabled
                            color="gray"
                            variant="outline"
                            size="sm"
                            leftIcon={<FaLock className="h-3 w-3" />}
                            title="Terkunci karena sudah diakses"
                          >
                            Edit
                          </Button>
                        )}
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

        <StatusModal
          show={showSuccessModal}
          type="success"
          title="Susunan Diperbarui"
          message="Urutan materi telah berhasil diubah dan tersimpan pada sistem."
          onClose={() => setShowSuccessModal(false)}
          onConfirm={() => setShowSuccessModal(false)}
          confirmText="Mengerti"
        />

        <StatusModal
          show={showErrorModal}
          type="danger"
          title="Oops, Gagal Mengubah Urutan!"
          message={errorMessage}
          onClose={() => setShowErrorModal(false)}
          onConfirm={() => setShowErrorModal(false)}
          confirmText="Tutup"
        />
    </AppLayout>
  );
}
