// Local YYYY-MM-DD for the browser (uses browser clock — call only in client code).
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Reconstruct the user's local YYYY-MM-DD on the server given their UTC offset in minutes.
// tzOffset = new Date().getTimezoneOffset() from the browser (negative east of UTC).
export function todayInOffset(tzOffset: number): string {
  const d = new Date(Date.now() - tzOffset * 60_000);
  return d.toISOString().slice(0, 10);
}

// Calendar-day count inclusive of both endpoints (e.g. Mon–Fri = 5).
export function calcDays(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / 86400000) + 1;
}

export function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const days = calcDays(start, end);
  return `${fmt(start)} – ${fmt(end)} · ${days} day${days === 1 ? "" : "s"}`;
}
