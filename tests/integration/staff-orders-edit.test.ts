import { describe, expect, test } from "vitest"
import {
  app,
  assertBasicHtmlResponse,
  assertErrorRedirect,
  assertSuccessRedirect,
} from "./utils"

describe("注文編集", () => {
  describe("GET", () => {
    test("編集ページが表示される", async () => {
      const res = await app.request("/staff/orders/1/edit")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/注文編集/)
      expect(text).toMatch(/#1/)
      expect(text).toMatch(/顧客/)
    })
  })

  describe("POST", () => {
    test("注文を正常に編集できる", async () => {
      const form = new URLSearchParams()
      form.append("customerName", "編集後顧客名")
      const comment = "テストコメント編集"
      form.append("comment", comment)
      form.append("status", "processing")
      const res = await app.request("/staff/orders/6/edit", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      assertSuccessRedirect(res, "注文を更新しました")

      const getRes = await app.request("/staff/orders/6/edit")
      const html = await getRes.text()
      expect(html).toContain(comment)
    })

    test("存在しない注文IDの場合はエラークッキーを返す", async () => {
      const form = new URLSearchParams()
      form.append("customerName", "テスト")
      form.append("status", "processing")
      const res = await app.request("/staff/orders/9999/edit", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      assertErrorRedirect(res, "注文が見つかりません")
    })

    test("不正なステータスの場合はエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("customerName", "テスト")
      form.append("status", "invalid_status")
      const res = await app.request("/staff/orders/6/edit", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      assertErrorRedirect(res, "不正なリクエストです")
    })

    test("顧客名が51文字以上の場合はエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("customerName", "あ".repeat(51))
      form.append("status", "processing")
      const res = await app.request("/staff/orders/6/edit", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      assertErrorRedirect(res, "顧客名は50文字以内である必要があります")
    })
  })
})
