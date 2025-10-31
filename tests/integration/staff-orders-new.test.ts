import { describe, expect, test } from "vitest"
import { app, assertBasicHtmlResponse } from "./utils"

describe("注文登録", () => {
  describe("GET", () => {
    test("注文登録ページが表示される", async () => {
      const res = await app.request("/staff/orders/new")
      const html = await res.text()
      assertBasicHtmlResponse(res, html)

      expect(html).toMatch(/<h1[^>]*>\s*注文登録\s*<\/h1>/)

      expect(html).toContain("テスト商品1")
      expect(html).toContain("テスト商品2")
      expect(html).toContain("テスト商品3")
      expect(html).toContain("テスト商品4")

      expect(html).toContain("タグA")
      expect(html).toContain("タグB")
      expect(html).toContain("タグC")
      expect(html).toContain("タグD")

      expect(html).toMatch(/<form[^>]*id="order-form"/)
      expect(html).toContain("注文を登録")
    })
  })
  describe("POST", () => {
    test("注文を正常に登録できる", async () => {
      const form = new URLSearchParams()
      form.append("items[][productId]", "1")
      form.append("items[][quantity]", "2")
      form.append("customerName", "テスト顧客")

      const res = await app.request("/staff/orders/new", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })

      expect(res.status).toBe(302)
      expect(res.headers.get("location")).toMatch(/\/staff\/orders\/new$/)
      expect(res.headers.get("set-cookie")).toMatch(/success/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("注文を登録しました"),
      )
    })
    test("存在しない商品IDのときにエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("items[][productId]", "9999")
      form.append("items[][quantity]", "1")
      form.append("customerName", "テスト顧客")
      const res = await app.request("/staff/orders/new", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("注文に存在しない商品が含まれています"),
      )
    })
    test("数量が0のときにエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("items[][productId]", "1")
      form.append("items[][quantity]", "0")
      form.append("customerName", "テスト顧客")
      const res = await app.request("/staff/orders/new", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("注文項目の数量は1以上である必要があります"),
      )
    })
    test("数量が在庫を超えているときにエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("items[][productId]", "1")
      form.append("items[][quantity]", "9999")
      form.append("customerName", "テスト顧客")
      const res = await app.request("/staff/orders/new", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("注文の個数が在庫を上回っています"),
      )
    })
    test("注文項目が空のときにエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("customerName", "テスト顧客")
      const res = await app.request("/staff/orders/new", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("注文項目は1種類以上20種類以下である必要があります"),
      )
    })
    test("顧客名が51文字以上のときにエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("items[][productId]", "1")
      form.append("items[][quantity]", "1")
      form.append("customerName", "あ".repeat(51))
      const res = await app.request("/staff/orders/new", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("顧客名は50文字以内である必要があります"),
      )
    })
    test("Content-Typeが不正なときにエラーを返す", async () => {
      const res = await app.request("/staff/orders/new", {
        method: "POST",
        body: JSON.stringify({
          items: [{ productId: 1, quantity: 1 }],
          customerName: "テスト顧客",
        }),
        headers: { "content-type": "application/json" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent(
          'TypeError: Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded"',
        ),
      )
    })
    test("FormDataでbodyが不正な場合にエラーを返す", async () => {
      const malformedBody = "this is not a valid form body"
      const res = await app.request("/staff/orders/new", {
        method: "POST",
        body: malformedBody,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      const cookie = res.headers.get("set-cookie")
      expect(cookie).toMatch(
        encodeURIComponent("注文項目は1種類以上20種類以下である必要があります"),
      )
    })
    test("FormDataで商品IDが整数でない場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("items[][productId]", "abc")
      form.append("items[][quantity]", "1")
      form.append("customerName", "テスト顧客")
      const res = await app.request("/staff/orders/new", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("不正なリクエストです"),
      )
    })
    test("FormDataで数量が整数でない場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("items[][productId]", "1")
      form.append("items[][quantity]", "abc")
      form.append("customerName", "テスト顧客")
      const res = await app.request("/staff/orders/new", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("不正なリクエストです"),
      )
    })
    test("FormDataで数量が負数の場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("items[][productId]", "1")
      form.append("items[][quantity]", "-1")
      form.append("customerName", "テスト顧客")
      const res = await app.request("/staff/orders/new", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("注文項目の数量は1以上である必要があります"),
      )
    })
    test("注文項目が21種類以上の場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      for (let i = 0; i < 21; i++) {
        const pid = String((i % 4) + 1)
        form.append("items[][productId]", pid)
        form.append("items[][quantity]", "1")
      }
      form.append("customerName", "テスト顧客")
      const res = await app.request("/staff/orders/new", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("注文項目は1種類以上20種類以下である必要があります"),
      )
    })
    test("FormDataで注文項目が配列でない場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("items[][productId]", "1")
      form.append("customerName", "テスト顧客")
      const res = await app.request("/staff/orders/new", {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("不正なリクエストです"),
      )
    })
  })
})
