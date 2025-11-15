import { describe, expect, it } from "bun:test"
import { toCsv } from "./csv"

describe("toCsv", () => {
  it("行列をCSV形式に変換する", () => {
    const csv = toCsv([
      ["id", "name"],
      [1, "Alice"],
      [2, "Bob"],
    ])
    expect(csv).toBe("id,name\n1,Alice\n2,Bob\n")
  })

  it("カンマ・引用符・改行をエスケープする", () => {
    const csv = toCsv([
      ["note", "value"],
      ["needs,comma", '"quoted"'],
      ["multi\nline", "simple"],
    ])
    expect(csv).toBe(
      'note,value\n"needs,comma","""quoted"""\n"multi\nline",simple\n',
    )
  })

  it("null/undefined/boolean/Dateを処理する", () => {
    const date = new Date("2024-01-01T00:00:00.000Z")
    const csv = toCsv([
      ["null", "undefined", "bool", "date"],
      [null, undefined, true, date],
    ])
    expect(csv).toBe(
      "null,undefined,bool,date\n,,true,2024-01-01T00:00:00.000Z\n",
    )
  })

  it("出力の末尾が改行で終わる", () => {
    const csv = toCsv([
      ["a", "b"],
      [1, 2],
    ])
    expect(csv.endsWith("\n")).toBe(true)
  })
})
