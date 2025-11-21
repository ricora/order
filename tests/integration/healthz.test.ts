import { describe, expect, test } from "vitest"
import { app, assertBasicHtmlResponse } from "./utils"

describe("ヘルスページ", () => {
  describe("GET", () => {
    test("ヘルスページが表示される", async () => {
      const res = await app.request("/healthz")
      const text = await res.text()
      assertBasicHtmlResponse(res, text)
      expect(text).toMatch(/<h1[^>]*>\s*Hello, Hono!\s*<\/h1>/)
    })
  })
})
