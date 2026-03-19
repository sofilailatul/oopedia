import { useMemo, useState, useEffect } from "react";
import axios from "axios";

export function useDosenMaterialsIndex({ materials: initialMaterials = [], onOrderSuccess, onOrderError }) {
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [materials, setMaterials] = useState(initialMaterials);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    setMaterials(initialMaterials);
  }, [initialMaterials]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(materials.length / perPage || 1)),
    [materials.length, perPage],
  );

  const paginated = useMemo(
    () => materials.slice((currentPage - 1) * perPage, currentPage * perPage),
    [materials, currentPage, perPage],
  );

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );

  function handlePerPageChange(value) {
    const next = Number(value) || 10;
    setPerPage(next);
    setCurrentPage(1);
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }

  async function moveUp(globalIndex) {
    if (globalIndex <= 0) return;

    if (materials[globalIndex].is_locked || materials[globalIndex - 1].is_locked) {
        if (onOrderError) {
          onOrderError('Urutan materi tidak dapat diubah karena sudah digunakan oleh mahasiswa.');
        } else {
          alert('Urutan materi tidak dapat diubah karena sudah digunakan oleh mahasiswa.');
        }
        return;
    }

    const previousMaterials = materials;
    const newMaterials = materials.map(m => ({ ...m }));
    const temp = newMaterials[globalIndex - 1];
    newMaterials[globalIndex - 1] = newMaterials[globalIndex];
    newMaterials[globalIndex] = temp;
    
    // Updating order_number for display purposes
    newMaterials.forEach((m, idx) => m.order_number = idx + 1);

    setMaterials(newMaterials);
    await saveOrder(newMaterials, previousMaterials);
  }

  async function moveDown(globalIndex) {
    if (globalIndex >= materials.length - 1) return;

    if (materials[globalIndex].is_locked || materials[globalIndex + 1].is_locked) {
        if (onOrderError) {
          onOrderError('Urutan materi tidak dapat diubah karena sudah digunakan oleh mahasiswa.');
        } else {
          alert('Urutan materi tidak dapat diubah karena sudah digunakan oleh mahasiswa.');
        }
        return;
    }

    const previousMaterials = materials;
    const newMaterials = materials.map(m => ({ ...m }));
    const temp = newMaterials[globalIndex + 1];
    newMaterials[globalIndex + 1] = newMaterials[globalIndex];
    newMaterials[globalIndex] = temp;
    
    // Updating order_number for display purposes
    newMaterials.forEach((m, idx) => m.order_number = idx + 1);

    setMaterials(newMaterials);
    await saveOrder(newMaterials, previousMaterials);
  }

  async function saveOrder(newMaterials, previousMaterials) {
    setIsSavingOrder(true);
    try {
      const material_ids = newMaterials.map(m => m.id);
      await axios.put('/dosen/materi/reorder', { material_ids });
      if (onOrderSuccess) onOrderSuccess();
    } catch (error) {
      console.error('Failed to save order', error);
      const errorMessage = error.response?.data?.message || 'Gagal menyimpan urutan materi.';
      
      // Auto-rollback optimistic update pada UI
      if (previousMaterials) {
        setMaterials(previousMaterials);
      }

      if (onOrderError) {
        onOrderError(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsSavingOrder(false);
    }
  }

  return {
    state: { 
      perPage, 
      currentPage, 
      isSavingOrder, 
      totalMaterials: materials.length 
    },
    view: { totalPages, paginated, pageNumbers },
    actions: { handlePerPageChange, goToPage, moveUp, moveDown },
  };
}
