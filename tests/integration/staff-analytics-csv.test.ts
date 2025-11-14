import { describe, expect, test } from "vitest"
import { ORDER_HISTORY_HEADER } from "../../app/usecases/exportOrderHistoryCsv"
import { PRODUCT_CATALOG_HEADER } from "../../app/usecases/exportProductCatalogCsv"
import { app } from "./utils"

const escapeForRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const assertCsvResponseHeaders = (res: Response, prefix: string) => {
  expect(res.status).toBe(200)
  expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8")
  expect(res.headers.get("cache-control")).toBe("no-store")
  const disposition = res.headers.get("content-disposition")
  expect(disposition).not.toBeNull()
  expect(disposition).toMatch(
    new RegExp(
      `^attachment; filename="${escapeForRegex(prefix)}-[0-9-]+\\.csv"$`,
    ),
  )
}

const normalizeCsv = (text: string) => text.replace(/^\ufeff/, "")

describe("スタッフ分析のCSV出力", () => {
  describe("GET /staff/analytics/orders/csv", () => {
    test("注文履歴CSVをダウンロードできる", async () => {
      const res = await app.request("/staff/analytics/orders/csv")
      assertCsvResponseHeaders(res, "order-history")

      const text = await res.text()
      expect(text.charCodeAt(0)).toBe(0xfeff)
      const csv = normalizeCsv(text)
      const lines = csv.split("\n")
      expect(lines[0]).toBe(ORDER_HISTORY_HEADER.join(","))
      expect(lines.length).toBeGreaterThan(1)
      expect(csv).toContain("顧客A")
      expect(csv).toContain("テスト商品1")
    })
  })

  describe("GET /staff/analytics/products/csv", () => {
    test("商品カタログCSVをダウンロードできる", async () => {
      const res = await app.request("/staff/analytics/products/csv")
      assertCsvResponseHeaders(res, "product-catalog")

      const text = await res.text()
      expect(text.charCodeAt(0)).toBe(0xfeff)
      const csv = normalizeCsv(text)
      const lines = csv.split("\n")
      expect(lines[0]).toBe(PRODUCT_CATALOG_HEADER.join(","))
      expect(lines.length).toBeGreaterThan(1)
      expect(csv).toContain("テスト商品1")
      expect(csv).toContain("タグA|タグB")
      expect(csv).toContain("1|2")
    })
  })
})
