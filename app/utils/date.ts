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
 * 日付に指定した日数を加算する
 *
 * @param date - 基準となる日付
 * @param days - 加算する日数（負の値も可）
 * @returns 日数を加算した新しい日付
 */
export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/**
 * 日付の開始時刻（0時0分0秒0ミリ秒）を取得する
 *
 * @param date - 基準となる日付
 * @returns 開始時刻に設定された新しい日付
 */
export const startOfDay = (date: Date): Date => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

/**
 * 日付の終了時刻（23時59分59秒999ミリ秒）を取得する
 *
 * @param date - 基準となる日付
 * @returns 終了時刻に設定された新しい日付
 */
export const endOfDay = (date: Date): Date => {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

/**
 * 指定した開始日から連続した日付の配列を生成する
 *
 * @param start - 開始日
 * @param days - 生成する日数
 * @returns 連続した日付の配列
 */
export const buildDateRange = (start: Date, days: number): Date[] => {
  return Array.from({ length: days }, (_, index) => addDays(start, index))
}

/**
 * 日付をISO形式の日付文字列（YYYY-MM-DD）にフォーマットする
 *
 * @param date - フォーマットしたい日付
 * @returns ISO形式の日付文字列（例: `2024-01-15`）
 */
export const formatDateKey = (date: Date): string => {
  return date.toISOString().slice(0, 10)
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
