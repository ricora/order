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
      const res = await app.request("/api/order-progress-manager/set-status", {
        method: "POST",
        body: JSON.stringify({ orderId: 1, status: "processing" }),
        headers: { "content-type": "application/json" },
      })
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toBe("Success")
    })
    test("存在しない注文IDのときにエラーを返す", async () => {
      const res = await app.request("/api/order-progress-manager/set-status", {
        method: "POST",
        body: JSON.stringify({ orderId: 9999, status: "processing" }),
        headers: { "content-type": "application/json" },
      })
      expect(res.status).toBe(409)
      const text = await res.text()
      expect(text).toBe("Conflict")
    })
    test("注文IDが整数でない場合にエラーを返す", async () => {
      const res = await app.request("/api/order-progress-manager/set-status", {
        method: "POST",
        body: JSON.stringify({ orderId: "abc", status: "processing" }),
        headers: { "content-type": "application/json" },
      })
      expect(res.status).toBe(400)
      const text = await res.text()
      expect(text).toBe("Invalid request")
    })
    test("注文IDが空の場合にエラーを返す", async () => {
      const res = await app.request("/api/order-progress-manager/set-status", {
        method: "POST",
        body: JSON.stringify({ status: "processing" }),
        headers: { "content-type": "application/json" },
      })
      expect(res.status).toBe(400)
      const text = await res.text()
      expect(text).toBe("Invalid request")
    })
    test("注文IDが負数の場合にエラーを返す", async () => {
      const res = await app.request("/api/order-progress-manager/set-status", {
        method: "POST",
        body: JSON.stringify({ orderId: -1, status: "processing" }),
        headers: { "content-type": "application/json" },
      })
      expect(res.status).toBe(400)
      const text = await res.text()
      expect(text).toBe("Invalid request")
    })
    test("statusが不正な値の場合にエラーを返す", async () => {
      const res = await app.request("/api/order-progress-manager/set-status", {
        method: "POST",
        body: JSON.stringify({ orderId: 1, status: "invalid_status" }),
        headers: { "content-type": "application/json" },
      })
      expect(res.status).toBe(400)
      const text = await res.text()
      expect(text).toBe("Invalid request")
    })
    test("statusが空の場合にエラーを返す", async () => {
      const res = await app.request("/api/order-progress-manager/set-status", {
        method: "POST",
        body: JSON.stringify({ orderId: 1 }),
        headers: { "content-type": "application/json" },
      })
      expect(res.status).toBe(400)
      const text = await res.text()
      expect(text).toBe("Invalid request")
    })
    test("Content-Typeが不正なときにエラーを返す", async () => {
      const res = await app.request("/api/order-progress-manager/set-status", {
        method: "POST",
        body: JSON.stringify({ orderId: 1, status: "processing" }),
        headers: { "content-type": "text/plain" },
      })
      expect(res.status).toBe(400)
    })
    test("bodyが不正な場合にエラーを返す", async () => {
      const res = await app.request("/api/order-progress-manager/set-status", {
        method: "POST",
        body: "this is not a valid json body",
        headers: { "content-type": "application/json" },
      })
      expect(res.status).toBe(400)
    })
  })
})
