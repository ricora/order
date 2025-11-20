import { describe, expect, test } from "vitest"
import { app, assertBasicHtmlResponse, assertSuccessRedirect } from "./utils"

describe("商品削除", () => {
  describe("GET", () => {
    test("削除ページが表示される", async () => {
      const res = await app.request("/staff/products/1/delete")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/商品削除/)
      expect(text).toMatch(/削除する/)
      expect(text).toMatch(/商品「/)
    })
  })

  describe("POST", () => {
    test("不正な商品IDの場合は404を返す", async () => {
      const res = await app.request("/staff/products/0/delete", {
        method: "POST",
      })
      expect(res.status).toBe(404)
      expect(res.headers.get("set-cookie")).toBeNull()
    })

    test("存在しない商品IDの場合は302でリダイレクトされる", async () => {
      const res = await app.request("/staff/products/9999/delete", {
        method: "POST",
      })
      expect(res.status).toBe(302)
      const setCookie = res.headers.get("set-cookie")
      expect(setCookie).toBeTruthy()
      expect(setCookie).toMatch(/toastType=(success|error)/)
    })

    test("商品を正常に削除できる", async () => {
      const res = await app.request("/staff/products/24/delete", {
        method: "POST",
      })
      assertSuccessRedirect(res, "商品を削除しました")
    })
  })
})
