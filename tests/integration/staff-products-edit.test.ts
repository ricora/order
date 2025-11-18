import { describe, expect, test } from "vitest"
import { app, assertBasicHtmlResponse, generateUniqueName } from "./utils"

describe("商品編集", () => {
  describe("GET", () => {
    test("編集ページが表示される", async () => {
      const res = await app.request(`/staff/products/1/edit`)
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/商品編集/)
      expect(text).toMatch(/商品情報の編集/)
      expect(text).toMatch(/商品名/)
      expect(text).toMatch(/価格/)
      expect(text).toMatch(/在庫数/)
    })
  })

  describe("POST", () => {
    const endpoint = "/staff/products/1/edit"

    test("商品を正常に編集できる", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("編集後商品"))
      form.append("price", "2000")
      form.append("stock", "5")
      form.append("image", "https://example.com/edited.jpg")
      form.append("tags", "タグB")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/success/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("商品を更新しました"),
      )
    })

    test("商品名が空の場合はにエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("price", "1000")
      form.append("stock", "10")
      const res = await app.request(endpoint, {
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

    test("価格が負数の場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("編集価格負数"))
      form.append("price", "-1")
      form.append("stock", "10")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
    })

    test("在庫数が小数の場合には整数に丸められて正常に編集できる", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("編集在庫小数"))
      form.append("price", "1000")
      form.append("stock", "10.5")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/success/)
    })

    test("商品タグが21個以上の場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("タグ多"))
      form.append("price", "1000")
      form.append("stock", "10")
      Array.from({ length: 21 }, (_, i) => `タグ${i}`).forEach((tag) =>
        form.append("tags", tag),
      )
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("商品タグは20個以内である必要があります"),
      )
    })

    test("タグ名が51文字以上の場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("タグ長大"))
      form.append("price", "1000")
      form.append("stock", "10")
      form.append("tags", "あ".repeat(51))
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("タグ名は1文字以上50文字以内である必要があります"),
      )
    })

    test("Content-Typeが不正なときにエラーを返す", async () => {
      const res = await app.request(endpoint, {
        method: "POST",
        body: JSON.stringify({
          name: "テスト商品",
          price: 1000,
          stock: 10,
        }),
        headers: { "content-type": "application/json" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
    })

    test("FormDataでbodyが不正な場合にエラーを返す", async () => {
      const malformedBody = "this is not a valid form body"
      const res = await app.request(endpoint, {
        method: "POST",
        body: malformedBody,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
    })
  })
})
