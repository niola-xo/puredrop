/**
 * PureDrop Lagos Timezone Date Utilities
 * All delivery calculations strictly use Africa/Lagos (UTC+1).
 */

const LAGOS_TZ = "Africa/Lagos";

/**
 * Returns a Date object representing the current instant in Africa/Lagos
 */
export function getLagosNow(): Date {
  const now = new Date();
  const lagosTimeString = now.toLocaleString("en-US", { timeZone: LAGOS_TZ });
  return new Date(lagosTimeString);
}

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Earliest delivery date for one-time order: Tomorrow in Lagos time
 */
export function getEarliestOneTimeDate(): string {
  const lagos = getLagosNow();
  lagos.setDate(lagos.getDate() + 1);
  return formatDateIso(lagos);
}

/**
 * Latest delivery date for one-time order: 30 days from today in Lagos time
 */
export function getLatestOneTimeDate(): string {
  const lagos = getLagosNow();
  lagos.setDate(lagos.getDate() + 30);
  return formatDateIso(lagos);
}

/**
 * Validates whether a date string (YYYY-MM-DD) is between tomorrow and 30 days from today
 */
export function isValidOneTimeDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const min = getEarliestOneTimeDate();
  const max = getLatestOneTimeDate();
  return dateStr >= min && dateStr <= max;
}

/**
 * Format a YYYY-MM-DD date into a friendly readable format like "Thursday, October 2, 2026"
 */
export function formatFriendlyDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
