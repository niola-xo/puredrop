/**
 * PureDrop Lagos Timezone Date Utilities
 * All delivery calculations strictly use Africa/Lagos (UTC+1).
 */

const LAGOS_TZ = "Africa/Lagos";

export const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
] as const;

export function getWeekdayName(weekdayNumber: number): string {
  const map: Record<number, string> = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };
  return map[weekdayNumber] ?? "Monday";
}

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
 * Calculate the first subscription delivery date based on PRD Section 6 rules:
 * - Timezone: Africa/Lagos.
 * - No deliveries on Saturday or Sunday.
 * - Cutoff rule: Weekdays before 14:00 require 1 day notice (earliest is tomorrow).
 *   Weekdays at or after 14:00, or Saturday/Sunday, require 2 days notice.
 * - First delivery date is the next occurrence of chosen weekday (1-5) on or after the earliest allowable date.
 */
export function calculateFirstSubscriptionDeliveryDate(
  chosenWeekday: number,
  overrideNow?: Date
): string {
  const lagos = overrideNow ?? getLagosNow();
  const currentDay = lagos.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const currentHour = lagos.getHours();

  // Weekday before 14:00 requires 1 day; after 14:00 or weekends requires 2 days
  const isWeekday = currentDay >= 1 && currentDay <= 5;
  const isBeforeCutoff = isWeekday && currentHour < 14;
  const noticeDays = isBeforeCutoff ? 1 : 2;

  // Earliest possible date
  const earliest = new Date(
    lagos.getFullYear(),
    lagos.getMonth(),
    lagos.getDate() + noticeDays
  );

  // Find the next occurrence of chosenWeekday that is >= earliest
  const candidate = new Date(earliest);
  while (candidate.getDay() !== chosenWeekday) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return formatDateIso(candidate);
}

/**
 * Calculates the next delivery date after a given delivery date:
 * - Weekly: +7 days
 * - Monthly: +28 days (4 weeks, preserving the chosen weekday)
 */
export function calculateNextRecurringDate(
  currentDateIso: string,
  frequency: "weekly" | "monthly"
): string {
  const [year, month, day] = currentDateIso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const daysToAdd = frequency === "weekly" ? 7 : 28;
  date.setDate(date.getDate() + daysToAdd);
  return formatDateIso(date);
}

/**
 * Format a YYYY-MM-DD date into a friendly readable format like "Friday, October 2, 2026"
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
