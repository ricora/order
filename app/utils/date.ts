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
 * 有効な日付かどうかを判定する
 *
 * @param date - 判定したい日付
 * @returns 有効な日付かどうか
 */
const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !Number.isNaN(date.getTime())
}
