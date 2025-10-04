import { describe, expect, it } from "bun:test"
import { formatCurrencyJPY } from "./money"

describe("formatCurrencyJPY", () => {
  it("正の整数を日本円表記にフォーマットする", () => {
    expect(formatCurrencyJPY(1234567)).toBe("￥1,234,567")
  })

  it("0を日本円表記にフォーマットする", () => {
    expect(formatCurrencyJPY(0)).toBe("￥0")
  })

  it("負の値を日本円表記にフォーマットする", () => {
    expect(formatCurrencyJPY(-500)).toBe("-￥500")
  })

  it("有限でない値が渡された場合はエラーを投げる", () => {
    expect(() => formatCurrencyJPY(Number.POSITIVE_INFINITY)).toThrow(
      "amount must be a finite number",
    )
  })
})
