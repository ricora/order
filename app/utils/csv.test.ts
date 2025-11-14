import { describe, expect, it } from "bun:test"
import { toCsv } from "./csv"

describe("toCsv", () => {
  it("converts rows into CSV format", () => {
    const csv = toCsv([
      ["id", "name"],
      [1, "Alice"],
      [2, "Bob"],
    ])
    expect(csv).toBe("id,name\n1,Alice\n2,Bob")
  })

  it("escapes commas, quotes, and line breaks", () => {
    const csv = toCsv([
      ["note", "value"],
      ["needs,comma", '"quoted"'],
      ["multi\nline", "simple"],
    ])
    expect(csv).toBe(
      'note,value\n"needs,comma","""quoted"""\n"multi\nline",simple',
    )
  })

  it("handles null, undefined, booleans, and dates", () => {
    const date = new Date("2024-01-01T00:00:00.000Z")
    const csv = toCsv([
      ["null", "undefined", "bool", "date"],
      [null, undefined, true, date],
    ])
    expect(csv).toBe(
      "null,undefined,bool,date\n,,true,2024-01-01T00:00:00.000Z",
    )
  })
})
