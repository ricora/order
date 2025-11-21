import { describe, expect, it } from "bun:test"
import { getGitCommitHash } from "./git"

describe("getGitCommitHash", () => {
  it("7文字の短縮ハッシュを取得できる", () => {
    const h = getGitCommitHash()
    expect(typeof h).toBe("string")
    expect(h as string).toMatch(/^[0-9a-f]{7}$/)
  })
})
