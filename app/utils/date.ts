const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

const dateTimeIsoJstFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
})

/**
 * 日付を日本語の日時形式でフォーマットする
 *
 * @param date - フォーマットしたい日付
 * @returns 日本語の日時表記（例: `2024/01/15 14:30`）
 */
export const formatDateTimeJP = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date

  if (!isValidDate(d)) {
    throw new Error("Invalid date")
  }

  return dateTimeFormatter.format(d)
}

/**
 * 日付を日本語の日付形式でフォーマットする
 *
 * @param date - フォーマットしたい日付
 * @returns 日本語の日付表記（例: `2024/01/15`）
 */
export const formatDateJP = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date

  if (!isValidDate(d)) {
    throw new Error("Invalid date")
  }

  return dateFormatter.format(d)
}

/**
 * 日付を日本語の時刻形式でフォーマットする
 *
 * @param date - フォーマットしたい日付
 * @returns 日本語の時刻表記（例: `14:30:45`）
 */
export const formatTimeJP = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date

  if (!isValidDate(d)) {
    throw new Error("Invalid date")
  }

  return timeFormatter.format(d)
}

/**
 * ISO8601形式かつJST(UTC+09:00)で日時文字列を生成する
 *
 * @param date - フォーマットしたい日付
 * @returns ISO8601形式の日時文字列（例: `2024-01-15T14:30:45+09:00`）
 */
export const formatDateTimeIsoJP = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date

  if (!isValidDate(d)) {
    throw new Error("Invalid date")
  }

  const parts = dateTimeIsoJstFormatter.formatToParts(d)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}+09:00`
}

/**
 * 有効な日付かどうかを判定する
 *
 * @param date - 判定したい日付
 * @returns 有効な日付かどうか
 */
const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !Number.isNaN(date.getTime())
}
