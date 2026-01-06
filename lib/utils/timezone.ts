import { toZonedTime, format } from "date-fns-tz"

/**
 * Philippine timezone constant
 * Asia/Manila is UTC+8 (Philippine Standard Time)
 */
export const PHILIPPINE_TIMEZONE = "Asia/Manila"

/**
 * Get current time in Philippine timezone
 * @returns {Date} Current date and time in Philippine timezone
 */
export function getPhilippineTime(): Date {
  return toZonedTime(new Date(), PHILIPPINE_TIMEZONE)
}

/**
 * Get time-based greeting based on Philippine time
 * - 5:00 AM - 11:59 AM → "Good Morning"
 * - 12:00 PM - 5:59 PM → "Good Afternoon"
 * - 6:00 PM - 4:59 AM → "Good Evening"
 * @returns {string} Greeting string based on current Philippine time
 */
export function getGreeting(): string {
  const phTime = getPhilippineTime()
  const hour = phTime.getHours()

  if (hour >= 5 && hour < 12) {
    return "Good Morning"
  } else if (hour >= 12 && hour < 18) {
    return "Good Afternoon"
  } else {
    return "Good Evening"
  }
}

/**
 * Format date/time in Philippine timezone
 * @param {Date | string} date - Date to format
 * @param {string} formatString - date-fns format string (default: "PPP")
 * @returns {string} Formatted date string
 */
export function formatPhilippineDate(date: Date | string, formatString: string = "PPP"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(toZonedTime(dateObj, PHILIPPINE_TIMEZONE), formatString, {
    timeZone: PHILIPPINE_TIMEZONE,
  })
}
