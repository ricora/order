import { describe, expect, test } from "vitest"
import type { ApiResponse } from "./utils"
import { app, assertBasicHtmlResponse } from "./utils"

type ApiJson = ApiResponse<"order-progress-manager">

describe("注文進捗管理", () => {
  describe("GET", () => {
    test("注文進捗管理ページが表示される", async () => {
      const res = await app.request("/staff/orders/progress")
      const html = await res.text()
      assertBasicHtmlResponse(res, html)
      expect(html).toMatch(/注文進捗管理/)
      expect(html).toContain("自動更新まであと")
    })

    test("クライアント用のAPIが利用できる", async () => {
      const res = await app.request("/api/order-progress-manager")
      expect(res.status).toBe(200)
      const apiJson = (await res.json()) as ApiJson

      expect(apiJson.pendingOrders.length).toBeGreaterThanOrEqual(2)
      const pendingNames = apiJson.pendingOrders.map((o) => o.customerName)
      expect(pendingNames).toContain("顧客A")
      expect(pendingNames).toContain("顧客B")

      expect(apiJson.processingOrders.length).toBeGreaterThanOrEqual(1)
      expect(
        apiJson.processingOrders.some((o) => o.customerName === null),
      ).toBe(true)

      expect(apiJson.completedOrders.length).toBeGreaterThanOrEqual(1)
      expect(
        apiJson.completedOrders.some((o) => o.customerName === "顧客C"),
      ).toBe(true)

      expect(apiJson.cancelledOrders.length).toBeGreaterThanOrEqual(1)
      expect(
        apiJson.cancelledOrders.some((o) => o.customerName === "顧客D"),
      ).toBe(true)
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
