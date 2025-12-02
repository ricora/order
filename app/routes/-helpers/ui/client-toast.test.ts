import { describe, expect, it } from "bun:test"
import { offToast, onToast, showToast } from "./client-toast"

describe("client-toast", () => {
  it("登録されたハンドラーが呼び出される", () => {
    const calls: Array<[string, string]> = []
    const handler = (type: string, message: string) =>
      calls.push([type, message])
    onToast(handler)
    showToast("success", "hello")
    expect(calls.length).toBe(1)
    const first = calls[0]
    expect(first).not.toBeUndefined()
    const [t, m] = first as [string, string]
    expect(t).toBe("success")
    expect(m).toBe("hello")
    offToast(handler)
  })

  it("解除されたハンドラーは呼び出されない", () => {
    const calls: Array<[string, string]> = []
    const handler = (type: string, message: string) =>
      calls.push([type, message])
    onToast(handler)
    offToast(handler)
    showToast("error", "oops")
    expect(calls.length).toBe(0)
  })
})
