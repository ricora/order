import { describe, expect, test } from "vitest"
import { app } from "./utils"

describe("ルートページ", () => {
  describe("GET /", () => {
    test("ルートページが/staffへリダイレクトされる", async () => {
      const res = await app.request("/", { redirect: "manual" })
      expect(res.status).toBe(302)
      expect(res.headers.get("Location")).toBe("/staff")
    })
  })
})
