import crypto from "node:crypto"
import { createApp } from "honox/server"
import { expect } from "vitest"

export const app = createApp()

export const assertBasicHtmlResponse = (res: Response, html: string) => {
  expect(res.status).toBe(200)
  expect(res.headers.get("content-type")).toMatch(/text\/html/)
  expect(html).toMatch(/<!DOCTYPE html>/i)
  expect(html).toMatch(/<html[^>]*>/i)
  expect(html).toMatch(/<body[^>]*>/i)
}

export const generateUniqueName = (prefix: string = "") => {
  const name = `${prefix}_${crypto.randomUUID()}`
  const hash = crypto.createHash("sha1").update(name).digest("hex")
  return `${prefix}_${hash}`
}

export const assertSuccessRedirect = (
  res: Response,
  expectedMessage: string,
) => {
  expect(res.status).toBe(302)
  expect(res.headers.get("set-cookie")).toMatch(/success/)
  expect(res.headers.get("set-cookie")).toMatch(
    encodeURIComponent(expectedMessage),
  )
}

export const assertErrorRedirect = (res: Response, expectedMessage: string) => {
  expect(res.status).toBe(302)
  expect(res.headers.get("set-cookie")).toMatch(/error/)
  expect(res.headers.get("set-cookie")).toMatch(
    encodeURIComponent(expectedMessage),
  )
}

type CreateHonoClient =
  typeof import("../../app/helpers/api/hono-client").createHonoClient
type HonoClient = ReturnType<CreateHonoClient>
export type ApiResponse<T extends keyof HonoClient> = Awaited<
  ReturnType<Awaited<ReturnType<HonoClient[T]["$get"]>>["json"]>
>
