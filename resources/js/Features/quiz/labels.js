import { QUIZ_STATUS } from "./constants";

export const statusLabel = (status) => {
  if (status === QUIZ_STATUS.DONE) return "Selesai";
  return "Belum Dikerjakan";
};

export const statusBadgeClass = (status) => {
  if (status === QUIZ_STATUS.DONE) return "bg-green-100 text-green-700";
  return "bg-red-100 text-red-600";
};

export const formatDateLabel = (value) => {
  if (!value) return "-";
  // value bisa string timestamp dari backend
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
};
