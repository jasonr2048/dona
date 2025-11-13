/**
 * Converts time from 12-hour format to 24-hour format.
 * @param time - The time string in 12-hour format (e.g., "01:45:30").
 * @param ampm - The period indicator ("AM" or "PM").
 * @returns The time in 24-hour format (e.g., "13:45:30").
 */
export function convertTime12to24(time: string, ampm: string): string {
  let [hours, minutes, seconds] = time.split(/[:.]/);

  if (hours === "12") {
    hours = "00";
  }

  if (ampm === "PM") {
    hours = (parseInt(hours, 10) + 12).toString();
  }

  return `${hours}:${minutes}${seconds ? `:${seconds}` : ""}`;
}

/**
 * Normalizes a time string to the format "hh:mm:ss".
 * @param time - The time string (e.g., "1:5" or "1:05:2").
 * @returns The normalized time in the format "hh:mm:ss".
 */
export function normalizeTime(time: string): string {
  const [hours, minutes, seconds] = time.split(/[:.]/);

  const normalizedHours = hours.length === 1 ? `0${hours}` : hours;
  const normalizedMinutes = minutes || "00";
  const normalizedSeconds = seconds || "00";

  return `${normalizedHours}:${normalizedMinutes}:${normalizedSeconds}`;
}

/**
 * Normalizes variations of "am", "a.m.", etc., to "AM" (uppercase).
 * @param ampm - The AM/PM string.
 * @returns The normalized string in uppercase ("AM" or "PM").
 */
export function normalizeAMPM(ampm: string): string {
  return ampm.replace(/[^apm]/gi, "").toUpperCase();
}
