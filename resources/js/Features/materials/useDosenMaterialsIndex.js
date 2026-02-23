import { useMemo, useState } from "react";

export function useDosenMaterialsIndex({ materials = [] }) {
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  return {
    state: { perPage, currentPage },
    view: { totalPages, paginated, pageNumbers },
    actions: { handlePerPageChange, goToPage },
  };
}
