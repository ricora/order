import { describe, expect, it } from "bun:test"
import { countStringLength, stripString } from "./text"

describe("countStringLength", () => {
  it("通常の文字列の長さを数える", () => {
    expect(countStringLength("こんにちは世界")).toStrictEqual(7)
  })
  it("サロゲートペア文字列の長さを数える", () => {
    expect(countStringLength("𠮷野家")).toStrictEqual(3)
  })
  it("絵文字文字列の長さを数える", () => {
    expect(countStringLength("👩‍👩‍👧‍👦")).toStrictEqual(1)
  })
})

describe("stripString", () => {
  it("通常の文字列を指定文字数で切り出す", () => {
    expect(stripString("こんにちは世界", 4)).toBe("こんにち")
  })
  it("サロゲートペア文字列を指定文字数で切り出す", () => {
    expect(stripString("𠮷野家", 2)).toBe("𠮷野")
  })
  it("絵文字文字列を指定文字数で切り出す", () => {
    expect(stripString("👩‍👩‍👧‍👦家", 1)).toBe("👩‍👩‍👧‍👦")
    expect(stripString("👩‍👩‍👧‍👦家", 2)).toBe("👩‍👩‍👧‍👦家")
  })
  it("maxLengthが0なら空文字を返す", () => {
    expect(stripString("テスト", 0)).toBe("")
  })
  it("maxLengthが元の長さ以上ならそのまま返す", () => {
    expect(stripString("テスト", 10)).toBe("テスト")
  })
})
