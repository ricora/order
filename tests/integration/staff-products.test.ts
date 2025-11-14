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

    test("page=1でデフォルトの商品を取得できる", async () => {
      const res = await app.request("/staff/products?page=1")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/テスト商品1/)
      expect(text).toMatch(/テスト商品2/)
      // page=1では1-20番目の商品が表示される
      expect(text).not.toMatch(/テスト商品21/)
    })

    test("page=2で次のページの商品を取得できる", async () => {
      const res = await app.request("/staff/products?page=2")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/テスト商品21/)
      expect(text).toMatch(/テスト商品25/)
      expect(text).not.toMatch(/テスト商品1/)
    })

    test("page=3では空になる", async () => {
      const res = await app.request("/staff/products?page=3")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/商品が登録されていません/)
    })

    test("無効なページパラメータはpage=1として処理される", async () => {
      const res = await app.request("/staff/products?page=0")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/テスト商品1/)
      expect(text).toMatch(/テスト商品2/)
    })

    test("ステータスカードが表示される", async () => {
      const res = await app.request("/staff/products?page=1")
      const text = await res.text()
      expect(text).toMatch(/総商品数/)
      expect(text).toMatch(/在庫十分/)
      expect(text).toMatch(/在庫わずか/)
      expect(text).toMatch(/在庫切れ/)
    })

    test("ページネーション情報が正しく表示される", async () => {
      const res = await app.request("/staff/products?page=1")
      const text = await res.text()
      expect(text).toMatch(/ページ\s*1/)
      expect(text).toMatch(/href="[^"]*page=2/)
    })

    test("page=2では「前へ」ボタンが有効で「次へ」ボタンが無効", async () => {
      const res = await app.request("/staff/products?page=2")
      const text = await res.text()
      expect(text).toMatch(/ページ\s*2/)
      expect(text).toMatch(/href="[^"]*page=1/)
      expect(text).toMatch(/aria-disabled="true"/)
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
        encodeURIComponent("不正なリクエストです"),
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
        encodeURIComponent("商品名は1文字以上50文字以内である必要があります"),
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

    test("価格が空の場合はエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("価格空"))
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
        encodeURIComponent("不正なリクエストです"),
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
        encodeURIComponent("不正なリクエストです"),
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
        encodeURIComponent("不正なリクエストです"),
      )
    })
    test("在庫数が空の場合はエラーを返す", async () => {
      const form = new URLSearchParams()
      form.append("name", generateUniqueName("在庫空"))
      form.append("price", "1000")
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
        encodeURIComponent("不正なリクエストです"),
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
        encodeURIComponent("不正なリクエストです"),
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
        encodeURIComponent("不正なリクエストです"),
      )
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
    test("画像ファイルサイズが7.5MBを超える場合にエラーを返す", async () => {
      const form = new FormData()
      form.append("name", generateUniqueName("大きい画像"))
      form.append("price", "1000")
      form.append("stock", "10")
      const oversizeData = "A".repeat(10 * 1024 * 1024)
      const blob = new Blob([oversizeData], { type: "image/png" })
      form.append("image", blob, "large-image.png")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("画像データのサイズは"),
      )
    })
    test("許可されていない画像のMIMEタイプの場合にエラーを返す", async () => {
      const form = new FormData()
      form.append("name", generateUniqueName("不正なMIME"))
      form.append("price", "1000")
      form.append("stock", "10")
      const blob = new Blob(["fake image data"], { type: "image/svg+xml" })
      form.append("image", blob, "image.svg")
      const res = await app.request(endpoint, {
        method: "POST",
        body: form,
      })
      expect(res.status).toBe(302)
      expect(res.headers.get("set-cookie")).toMatch(/error/)
      expect(res.headers.get("set-cookie")).toMatch(
        encodeURIComponent("画像のMIMEタイプは"),
      )
    })
  })
})
