import { describe, expect, it } from "bun:test"
import { setQueryParam } from "./url"

describe("setQueryParam", () => {
  it("既存のクエリにviewパラメータを上書きできる", () => {
    expect(setQueryParam("?page=2&view=table", "view", "card")).toBe(
      "?page=2&view=card",
    )
  })

  it("クエリが空の場合はviewパラメータだけになる", () => {
    expect(setQueryParam("", "view", "table")).toBe("?view=table")
  })

  it("他のパラメータがあってもviewだけ上書きされる", () => {
    expect(setQueryParam("?foo=bar&view=table&baz=1", "view", "card")).toBe(
      "?foo=bar&view=card&baz=1",
    )
  })

  it("viewパラメータが無い場合は追加される", () => {
    expect(setQueryParam("?foo=bar", "view", "table")).toBe(
      "?foo=bar&view=table",
    )
  })

  it("値が空文字の場合も正しくセットされる", () => {
    expect(setQueryParam("?foo=bar", "view", "")).toBe("?foo=bar&view=")
  })

  it("keyが他の値でも正しく動作する", () => {
    expect(setQueryParam("?foo=bar", "baz", "123")).toBe("?foo=bar&baz=123")
  })
})
