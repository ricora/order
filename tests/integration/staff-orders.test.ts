import { describe, expect, test } from "vitest"
import { app, assertBasicHtmlResponse } from "./utils"

describe("注文一覧", () => {
  describe("GET", () => {
    test("注文一覧ページが表示される", async () => {
      const res = await app.request("/staff/orders")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/注文一覧/)
    })

    test("page=1でデフォルトの注文を取得できる", async () => {
      const res = await app.request("/staff/orders?page=1")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      // page=1では1-20番目の注文が表示される
      expect(text).toMatch(/#1/)
      expect(text).toMatch(/#2/)
      // 21番目の注文は表示されない
      expect(text).not.toMatch(/#21/)
    })

    test("page=2で次のページの注文を取得できる", async () => {
      const res = await app.request("/staff/orders?page=2")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/テスト顧客/)
      expect(text).not.toMatch(/顧客A/)
    })

    test("page=3では空になる", async () => {
      const res = await app.request("/staff/orders?page=3")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/注文が登録されていません/)
    })

    test("無効なページパラメータはpage=1として処理される", async () => {
      const res = await app.request("/staff/orders?page=0")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/#1/)
      expect(text).toMatch(/#2/)
    })

    test("ページネーション情報が正しく表示される", async () => {
      const res = await app.request("/staff/orders?page=1")
      const text = await res.text()
      expect(text).toMatch(/ページ\s*1/)
      expect(text).toMatch(/href="[^"]*page=2/)
    })

    test("page=2では「前へ」ボタンが有効で「次へ」ボタンが無効", async () => {
      const res = await app.request("/staff/orders?page=2")
      const text = await res.text()
      expect(text).toMatch(/ページ\s*2/)
      expect(text).toMatch(/href="[^"]*page=1/)
      expect(text).toMatch(/aria-disabled="true"/)
    })
  })
})
