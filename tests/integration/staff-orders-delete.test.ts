import { describe, expect, test } from "vitest"
import { app, assertBasicHtmlResponse, assertSuccessRedirect } from "./utils"

describe("注文削除", () => {
  describe("GET", () => {
    test("削除ページが表示される", async () => {
      const res = await app.request("/staff/orders/23/delete")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/注文削除/)
      expect(text).toMatch(/#23/)
      expect(text).toMatch(/削除する/)
    })
  })

  describe("POST", () => {
    test("不正な注文IDの場合は404を返す", async () => {
      const res = await app.request("/staff/orders/0/delete", {
        method: "POST",
      })
      expect(res.status).toBe(404)
      expect(res.headers.get("set-cookie")).toBeNull()
    })

    test("存在しない注文IDの場合は302でリダイレクトされる", async () => {
      const res = await app.request("/staff/orders/9999/delete", {
        method: "POST",
      })
      expect(res.status).toBe(302)
      const setCookie = res.headers.get("set-cookie")
      expect(setCookie).toBeTruthy()
      expect(setCookie).toMatch(/toastType=(success|error)/)
    })

    test("注文を正常に削除できる", async () => {
      const res = await app.request("/staff/orders/23/delete", {
        method: "POST",
      })
      assertSuccessRedirect(res, "注文を削除しました")
    })
  })
})
