const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})
const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date)
}

/** "just now", "5 minutes ago", "yesterday", then an absolute date after a month. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const timestamp = new Date(iso).getTime()
  if (Number.isNaN(timestamp)) return ""

  const seconds = Math.round((timestamp - now) / 1000)
  const abs = Math.abs(seconds)

  if (abs < MINUTE) return "just now"
  if (abs < HOUR) return relativeFormatter.format(Math.round(seconds / MINUTE), "minute")
  if (abs < DAY) return relativeFormatter.format(Math.round(seconds / HOUR), "hour")
  if (abs < 30 * DAY) return relativeFormatter.format(Math.round(seconds / DAY), "day")
  return formatDate(iso)
}

export function displayTitle(title: string): string {
  return title.trim() || "Untitled"
}
