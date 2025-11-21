import { describe, expect, test } from "vitest"
import { app, assertBasicHtmlResponse } from "./utils"

describe("サイドバー", () => {
  test("サイドバーにコミットハッシュが埋め込まれている", async () => {
    const res = await app.request("/staff")
    const html = await res.text()
    assertBasicHtmlResponse(res, html)
  expect(html).toMatch(/Version\s*[0-9a-f]{7}/)
  })
})
