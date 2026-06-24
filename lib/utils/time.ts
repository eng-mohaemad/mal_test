const MINUTE = 60_000;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;

export function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const rtf  = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (diff < HOUR)  return rtf.format(-Math.round(diff / MINUTE), "minute");
  if (diff < DAY)   return rtf.format(-Math.round(diff / HOUR),   "hour");
  return rtf.format(-Math.round(diff / DAY), "day");
}
