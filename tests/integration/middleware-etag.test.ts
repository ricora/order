import { describe, expect, test } from "vitest"
import { app } from "./utils"

describe("ETag Middleware", () => {
  test("HTMLページにETagが設定され、条件付きGETが304を返す", async () => {
    const res = await app.request("/healthz")
    expect(res.status).toBe(200)
    const etag = res.headers.get("etag")
    expect(etag).toBeTruthy()

    const res2 = await app.request("/healthz", {
      headers: { "If-None-Match": String(etag) },
    })
    expect(res2.status).toBe(304)
  })

  test("JSON APIエンドポイントではETagが設定されない", async () => {
    const res = await app.request("/api/order-progress-manager")
    expect(res.status).toBe(200)
    expect(res.headers.get("etag")).toBeNull()

    const json = await res.json()
    expect(json).toBeTruthy()

    const res2 = await app.request("/api/order-progress-manager", {
      headers: { "If-None-Match": "dummy" },
    })
    expect(res2.status).toBe(200)
    const json2 = await res2.json()
    expect(json2).toBeTruthy()
  })

  test("画像エンドポイントにETagが設定され、条件付きGETが304を返す", async () => {
    const res = await app.request("/images/products/1")
    expect(res.status).toBe(200)
    const etag = res.headers.get("etag")
    expect(etag).toBeTruthy()
    const size = (await res.arrayBuffer()).byteLength
    expect(size).toBeGreaterThan(0)

    const res2 = await app.request("/images/products/1", {
      headers: { "If-None-Match": String(etag) },
    })
    expect(res2.status).toBe(304)
  })
})
