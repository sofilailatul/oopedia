const pad2 = (n) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

export const formatMMSS = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${pad2(mm)}:${pad2(ss)}`;
};
