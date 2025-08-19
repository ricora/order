import { describe, expect, it } from "bun:test"
import { countStringLength } from "./text"

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
