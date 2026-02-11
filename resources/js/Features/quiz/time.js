export function pad2(n) {
  const x = Math.max(0, Math.floor(n));
  return String(x).padStart(2, "0");
}

export function formatMMSS(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${pad2(mm)}.${pad2(ss)}`; // sesuai mock kamu "18.00"
}
