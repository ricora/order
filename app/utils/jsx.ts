import type { RefObject } from "hono/jsx"

export const isRefObject = <T>(value: unknown): value is RefObject<T> =>
  typeof value === "object" && value !== null && "current" in value
