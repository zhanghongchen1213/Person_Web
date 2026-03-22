/**
 * Shared date formatting utilities.
 */

/** Format a date for display in zh-CN locale (e.g. "2024年3月22日"). */
export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Convert a date to ISO 8601 string for datetime attributes. */
export function toISODate(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}
