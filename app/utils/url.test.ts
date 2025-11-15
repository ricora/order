import { describe, expect, it } from "bun:test"
import {
  parseDataUriScheme,
  serializeDataUriScheme,
  setQueryParam,
} from "./url"

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

const mimeType = "image/png"
const data =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
const uri = `data:${mimeType};base64,${data}`

describe("serializeDataUriScheme", () => {
  it("serializeDataUriSchemeは正しいData URIを生成する", () => {
    expect(serializeDataUriScheme({ data, mimeType })).toBe(uri)
  })
})
describe("parseDataUriScheme", () => {
  it("parseDataUriSchemeはData URIからdataとmimeTypeを抽出できる", () => {
    expect(parseDataUriScheme(uri)).toEqual({ mimeType, data })
  })

  it("parseDataUriSchemeは不正な文字列の場合nullを返す", () => {
    expect(parseDataUriScheme("not-a-data-uri")).toBeUndefined()
    expect(parseDataUriScheme("data:;base64,")).toBeUndefined()
    expect(parseDataUriScheme("")).toBeUndefined()
  })
})
