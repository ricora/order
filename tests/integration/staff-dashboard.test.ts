import { describe, expect, test } from "vitest"
import { app, assertBasicHtmlResponse } from "./utils"

describe("スタッフダッシュボード", () => {
  describe("GET /staff", () => {
    test("静的な要素が表示される", async () => {
      const res = await app.request("/staff")
      const html = await res.text()

      assertBasicHtmlResponse(res, html)

      const summaryHeadingIndex = html.indexOf("サマリー")
      const quickAccessHeadingIndex = html.indexOf("クイックアクセス")
      expect(summaryHeadingIndex).toBeGreaterThan(-1)
      expect(quickAccessHeadingIndex).toBeGreaterThan(-1)
      expect(summaryHeadingIndex).toBeLessThan(quickAccessHeadingIndex)

      expect(html).toContain("本日の注文数")
      expect(html).toContain("本日の売上")
      expect(html).toContain("未処理の注文")
      expect(html).toContain("7日間の平均客単価")
      expect(html).toContain("ステータス別注文数")
      expect(html).toContain("7日間の推移")

      const quickAccessLinks = [
        "/staff/orders",
        "/staff/orders/new",
        "/staff/orders/progress",
        "/staff/products",
        "/staff/analytics",
        "/staff/settings",
      ]
      quickAccessLinks.forEach((href) => {
        expect(html).toContain(`href="${href}"`)
      })
    })
  })
})
