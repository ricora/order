import { describe, expect, it } from "bun:test"
import { formatDateJP, formatDateTimeJP, formatTimeJP } from "./date"

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
