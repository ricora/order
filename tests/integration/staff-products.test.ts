import { describe, expect, test } from "vitest"
import type { ApiResponse } from "./utils"
import { app, assertBasicHtmlResponse, generateUniqueName } from "./utils"

type ApiJson = ApiResponse<"product-registration-form">

describe("商品管理", () => {
  describe("GET", () => {
    test("商品管理ページが表示される", async () => {
      const res = await app.request("/staff/products")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/商品管理/)
      expect(text).toMatch(/商品登録/)
      expect(text).toMatch(/商品一覧/)
      expect(text).toContain("読み込み中...")
    })

    test("クライアント用のAPIが利用できる", async () => {
      const res = await app.request("/api/product-registration-form")
      expect(res.status).toBe(200)
      const apiJson = (await res.json()) as ApiJson
      const tagNames = apiJson.tags.map((t) => t.name)
      expect(tagNames).toContain("タグA")
      expect(tagNames).toContain("タグB")
      expect(tagNames).toContain("タグC")
      expect(tagNames).toContain("タグD")
    })
  })
  describe("POST", () => {
    const endpoint = "/staff/products"
    test("商品を正常に登録できる", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("新規商品"))
      form.append("price", "1500")
      form.append("stock", "20")
      form.append("image", "https://example.com/image.jpg")
      form.append("tags", "タグA")
      form.append("tags", "タグB")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/success/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("商品を登録しました"),
      )
    })
    test("商品名が空の場合にエラーを返す", async () => {
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
        encodeURIComponent("商品名は必須です"),
      )
    })
    test("商品名が51文字以上の場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", "あ".repeat(51))
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
        encodeURIComponent("商品名は1文字以上50文字以内で入力してください"),
      )
    })
    test("同じ名前の商品が既に存在する場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", "テスト商品1")
      form.append("price", "9999")
      form.append("stock", "99")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("同じ名前の商品が既に存在します"),
      )
    })

    test("価格が空の場合は0が設定され正常に登録される", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("価格空"))
      form.append("stock", "10")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/success/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("商品を登録しました"),
      )
    })
    test("価格が負数の場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("価格負数"))
      form.append("price", "-1")
      form.append("stock", "10")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("価格は0以上の整数で入力してください"),
      )
    })
    test("価格が小数の場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("価格小数"))
      form.append("price", "1000.5")
      form.append("stock", "10")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("価格は0以上の整数で入力してください"),
      )
    })
    test("価格が文字列の場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("価格文字列"))
      form.append("price", "abc")
      form.append("stock", "10")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("価格は0以上の整数で入力してください"),
      )
    })
    test("在庫数が空の場合は0が設定され正常に登録される", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("在庫空"))
      form.append("price", "1000")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/success/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("商品を登録しました"),
      )
    })
    test("在庫数が負数の場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("在庫負数"))
      form.append("price", "1000")
      form.append("stock", "-1")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("在庫数は0以上の整数で入力してください"),
      )
    })
    test("在庫数が小数の場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("在庫小数"))
      form.append("price", "1000")
      form.append("stock", "10.5")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("在庫数は0以上の整数で入力してください"),
      )
    })
    test("在庫数が文字列の場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("在庫文字列"))
      form.append("price", "1000")
      form.append("stock", "abc")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("在庫数は0以上の整数で入力してください"),
      )
    })
    test("画像URLが501文字以上の場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("画像長大"))
      form.append("price", "1000")
      form.append("stock", "10")
      form.append("image", `https://${"a".repeat(495)}`)
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent(
          "画像URLは500文字以内かつhttp(s)で始まる必要があります",
        ),
      )
    })
    test("画像URLがhttp/httpsで始まらない場合にエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("画像不正"))
      form.append("price", "1000")
      form.append("stock", "10")
      form.append("image", "ftp://example.com/image.jpg")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent(
          "画像URLは500文字以内かつhttp(s)で始まる必要があります",
        ),
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
