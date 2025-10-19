import crypto from "node:crypto"
import { createApp } from "honox/server"
import { describe, expect, test } from "vitest"

const assertBasicHtmlResponse = (res: Response, html: string) => {
  expect(res.status).toBe(200)
  expect(res.headers.get("content-type")).toMatch(/text\/html/)
  expect(html).toMatch(/<!DOCTYPE html>/i)
  expect(html).toMatch(/<html[^>]*>/i)
  expect(html).toMatch(/<body[^>]*>/i)
}

const generateUniqueName = (prefix: string = "") => {
  const name = `${prefix}_${crypto.randomUUID()}`
  const hash = crypto.createHash("sha1").update(name).digest("hex")
  return `${prefix}_${hash}`
}

const app = createApp()

describe("Integration tests", () => {
  describe("トップページ", () => {
    test("GET /", async () => {
      const res = await app.request("/")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/<h1[^>]*>\s*Hello, Hono!\s*<\/h1>/)
    })
  })
  describe("スタッフページ", () => {
    describe("商品", () => {
      describe("商品管理", () => {
        describe("GET", () => {
          test("商品管理ページが表示される", async () => {
            const res = await app.request("/staff/products")
            const text = await res.text()
            assertBasicHtmlResponse(res, text)
            expect(text).toMatch(/商品管理/)
            expect(text).toMatch(/商品登録/)
            expect(text).toMatch(/商品一覧/)
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
              encodeURIComponent(
                "商品名は1文字以上50文字以内で入力してください",
              ),
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

          test("価格が空の場合にエラーを返す", async () => {
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
              encodeURIComponent("価格は0以上の整数で入力してください"),
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
          test("価格が小数の場合小数が切り捨てされ正常に登録される", async () => {
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
            expect(res.headers.get("set-cookie")).toMatch(/success/)
            expect(res.headers.get("set-cookie")).toMatch(
              encodeURIComponent("商品を登録しました"),
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
          test("在庫数が空の場合にエラーを返す", async () => {
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
              encodeURIComponent("在庫数は0以上の整数で入力してください"),
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
          test("在庫数が小数の場合に小数が切り捨てされ正常に登録される", async () => {
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
            expect(res.headers.get("set-cookie")).toMatch(/success/)
            expect(res.headers.get("set-cookie")).toMatch(
              encodeURIComponent("商品を登録しました"),
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
    })
    describe("注文", () => {
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
              encodeURIComponent(
                "注文項目は1種類以上20種類以下である必要があります",
              ),
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
              encodeURIComponent(
                "注文項目は1種類以上20種類以下である必要があります",
              ),
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
              encodeURIComponent(
                "注文項目は1種類以上20種類以下である必要があります",
              ),
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
      describe("注文進捗管理", () => {
        describe("GET", () => {
          test("注文進捗管理ページが表示される", async () => {
            const res = await app.request("/staff/orders/progress")
            const html = await res.text()
            assertBasicHtmlResponse(res, html)
            expect(html).toMatch(/注文進捗管理/)
            expect(html).toMatch(/<form[^>]*method="post"/)
            expect(html).toContain("顧客A")
            expect(html).toContain("顧客B")
            expect(html).toContain("顧客C")
            expect(html).toContain("顧客D")
          })
        })
        describe("POST", () => {
          test("注文の状態を正常に更新できる", async () => {
            const form = new URLSearchParams()
            form.append("orderId", "1")
            form.append("status", "processing")
            const res = await app.request("/staff/orders/progress", {
              method: "POST",
              body: form,
              headers: { "content-type": "application/x-www-form-urlencoded" },
            })
            expect(res.status).toBe(302)
            expect(res.headers.get("set-cookie")).toMatch(/success/)
            expect(res.headers.get("set-cookie")).toMatch(
              encodeURIComponent("注文の状態を更新しました"),
            )
          })
          test("存在しない注文IDのときにエラーを返す", async () => {
            const form = new URLSearchParams()
            form.append("orderId", "9999")
            form.append("status", "processing")
            const res = await app.request("/staff/orders/progress", {
              method: "POST",
              body: form,
              headers: { "content-type": "application/x-www-form-urlencoded" },
            })
            expect(res.status).toBe(302)
            expect(res.headers.get("set-cookie")).toMatch(/error/)
          })
          test("注文IDが整数でない場合にエラーを返す", async () => {
            const form = new URLSearchParams()
            form.append("orderId", "abc")
            form.append("status", "processing")
            const res = await app.request("/staff/orders/progress", {
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
          test("注文IDが空の場合にエラーを返す", async () => {
            const form = new URLSearchParams()
            form.append("status", "processing")
            const res = await app.request("/staff/orders/progress", {
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
          test("注文IDが負数の場合にエラーを返す", async () => {
            const form = new URLSearchParams()
            form.append("orderId", "-1")
            form.append("status", "processing")
            const res = await app.request("/staff/orders/progress", {
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
          test("statusが不正な値の場合にエラーを返す", async () => {
            const form = new URLSearchParams()
            form.append("orderId", "1")
            form.append("status", "invalid_status")
            const res = await app.request("/staff/orders/progress", {
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
          test("statusが空の場合にエラーを返す", async () => {
            const form = new URLSearchParams()
            form.append("orderId", "1")
            const res = await app.request("/staff/orders/progress", {
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
          test("Content-Typeが不正なときにエラーを返す", async () => {
            const res = await app.request("/staff/orders/progress", {
              method: "POST",
              body: JSON.stringify({ orderId: 1, status: "processing" }),
              headers: { "content-type": "application/json" },
            })
            expect(res.status).toBe(302)
            expect(res.headers.get("set-cookie")).toMatch(/error/)
          })
          test("FormDataでbodyが不正な場合にエラーを返す", async () => {
            const malformedBody = "this is not a valid form body"
            const res = await app.request("/staff/orders/progress", {
              method: "POST",
              body: malformedBody,
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
    })
  })
})
