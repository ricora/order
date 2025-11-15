import { describe, expect, test } from "vitest"
import { app } from "./utils"

describe("商品画像", () => {
  describe("GET", () => {
    test("有効な商品IDで画像を取得できる", async () => {
      const res = await app.request("/images/products/1")
      expect(res.status).toBe(200)
      const contentType = res.headers.get("content-type")
      expect(contentType).toBeTruthy()
      expect(["image/jpeg", "image/png"]).toContain(contentType)
      const buffer = await res.arrayBuffer()
      expect(buffer.byteLength).toBeGreaterThan(0)
    })

    test("存在しない商品IDではデフォルト画像を返す", async () => {
      const res = await app.request("/images/products/99999")
      expect(res.status).toBe(200)
      const contentType = res.headers.get("content-type")
      expect(contentType).toBeTruthy()
      expect(["image/jpeg", "image/png"]).toContain(contentType)
      const buffer = await res.arrayBuffer()
      expect(buffer.byteLength).toBeGreaterThan(0)
    })

    test("無効なID（NaN）で400を返す", async () => {
      const res = await app.request("/images/products/invalid")
      expect(res.status).toBe(400)
      const text = await res.text()
      expect(text).toContain("Invalid product ID")
    })

    test("負の数のIDで400を返す", async () => {
      const res = await app.request("/images/products/-1")
      expect(res.status).toBe(400)
      const text = await res.text()
      expect(text).toContain("Invalid product ID")
    })

    test("小数のIDで400を返す", async () => {
      const res = await app.request("/images/products/1.5")
      expect(res.status).toBe(400)
      const text = await res.text()
      expect(text).toContain("Invalid product ID")
    })

    test("Content-Typeヘッダが正しく設定される", async () => {
      const res = await app.request("/images/products/1")
      expect(res.status).toBe(200)
      const contentType = res.headers.get("content-type")
      expect(contentType).toMatch(/image\/(jpeg|png|webp)/)
    })

    test("複数回同じ画像IDをリクエストすると一貫した結果を返す", async () => {
      const res1 = await app.request("/images/products/1")
      const buffer1 = await res1.arrayBuffer()

      const res2 = await app.request("/images/products/1")
      const buffer2 = await res2.arrayBuffer()

      expect(res1.status).toBe(res2.status)
      expect(buffer1.byteLength).toBe(buffer2.byteLength)
    })
  })
})
