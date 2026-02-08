import { PASSING_SCORE } from "./constants";

export const hintToneClass = (tone) =>
  ({
    success: "bg-green-100 text-green-800 border-green-200",
    warn: "bg-yellow-50 text-yellow-700 border-yellow-100",
    ok: "bg-green-50 text-green-700 border-green-100",
    info: "bg-blue-50 text-blue-700 border-blue-100",
  }[tone] ?? "bg-blue-50 text-blue-700 border-blue-100");

export const scoreBadgeClass = (score) => {
  if (score == null) return "bg-gray-100 text-gray-600";
  return score < PASSING_SCORE ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";
};
