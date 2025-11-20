import { describe, expect, it } from "bun:test"
import {
  addDays,
  buildDateRange,
  endOfDay,
  formatDateJP,
  formatDateKey,
  formatDateTimeJP,
  formatTimeJP,
  startOfDay,
} from "./date"

describe("formatDateTimeJP", () => {
  it("日付を日本語の日時形式でフォーマットできる", () => {
    const date = new Date("2024-01-15T14:30:45")
    const result = formatDateTimeJP(date)
    expect(result).toBe("2024/01/15 14:30")
  })

  it("文字列の日付を受け取れる", () => {
    const result = formatDateTimeJP("2024-01-15T14:30:45")
    expect(result).toBe("2024/01/15 14:30")
  })

  it("無効な日付の場合はエラーをスローする", () => {
    expect(() => formatDateTimeJP(new Date("invalid"))).toThrow("Invalid date")
  })
})

describe("formatDateJP", () => {
  it("日付を日本語の日付形式でフォーマットできる", () => {
    const date = new Date("2024-01-15T14:30:45")
    const result = formatDateJP(date)
    expect(result).toBe("2024/01/15")
  })

  it("文字列の日付を受け取れる", () => {
    const result = formatDateJP("2024-01-15T14:30:45")
    expect(result).toBe("2024/01/15")
  })

  it("無効な日付の場合はエラーをスローする", () => {
    expect(() => formatDateJP(new Date("invalid"))).toThrow("Invalid date")
  })
})

describe("formatTimeJP", () => {
  it("日付を日本語の時刻形式でフォーマットできる", () => {
    const date = new Date("2024-01-15T14:30:45")
    const result = formatTimeJP(date)
    expect(result).toBe("14:30:45")
  })

  it("文字列の日付を受け取れる", () => {
    const result = formatTimeJP("2024-01-15T14:30:45")
    expect(result).toBe("14:30:45")
  })

  it("無効な日付の場合はエラーをスローする", () => {
    expect(() => formatTimeJP(new Date("invalid"))).toThrow("Invalid date")
  })
})

describe("addDays", () => {
  it("指定した日数を加算した新しい日付を返す", () => {
    const date = new Date("2024-01-15T00:00:00Z")
    const result = addDays(date, 3)

    expect(result.toISOString()).toBe("2024-01-18T00:00:00.000Z")
    expect(date.toISOString()).toBe("2024-01-15T00:00:00.000Z")
  })

  it("負の値を加算できる", () => {
    const date = new Date("2024-01-15T00:00:00Z")
    const result = addDays(date, -2)

    expect(result.toISOString()).toBe("2024-01-13T00:00:00.000Z")
  })
})

describe("startOfDay", () => {
  it("日付の開始時刻を持つ新しい日付を返す", () => {
    const date = new Date("2024-01-15T14:30:45.123Z")
    const result = startOfDay(date)

    expect(result.toISOString()).toBe("2024-01-15T00:00:00.000Z")
    expect(date.toISOString()).toBe("2024-01-15T14:30:45.123Z")
  })
})

describe("endOfDay", () => {
  it("日付の終了時刻を持つ新しい日付を返す", () => {
    const date = new Date("2024-01-15T14:30:45.123Z")
    const result = endOfDay(date)

    expect(result.toISOString()).toBe("2024-01-15T23:59:59.999Z")
    expect(date.toISOString()).toBe("2024-01-15T14:30:45.123Z")
  })
})

describe("buildDateRange", () => {
  it("開始日から連続した日付の配列を生成する", () => {
    const start = new Date("2024-01-10T00:00:00Z")
    const result = buildDateRange(start, 3)

    expect(result.map((date) => date.toISOString())).toEqual([
      "2024-01-10T00:00:00.000Z",
      "2024-01-11T00:00:00.000Z",
      "2024-01-12T00:00:00.000Z",
    ])
    expect(start.toISOString()).toBe("2024-01-10T00:00:00.000Z")
  })
})

describe("formatDateKey", () => {
  it("日付をISO形式の日付文字列にフォーマットする", () => {
    const date = new Date("2024-01-15T14:30:45.123Z")
    const result = formatDateKey(date)

    expect(result).toBe("2024-01-15")
  })
})
