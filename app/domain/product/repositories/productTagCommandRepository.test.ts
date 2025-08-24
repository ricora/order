import { describe, expect, it } from "bun:test"
import type { TransactionDbClient } from "../../../infrastructure/db/client"
import type ProductTag from "../entities/productTag"
import { createProductTag } from "./productTagCommandRepository"

const validTag: Omit<ProductTag, "id"> = {
  name: "新しいタグ",
}

describe("createProductTag", () => {
  const mockDbClient = {} as TransactionDbClient
  it("バリデーションを通過したタグを作成できる", async () => {
    const mockImpl = async (params: Omit<ProductTag, "id">) =>
      ({ ...params, id: 123 }) as ProductTag
    const result = await createProductTag({
      ...validTag,
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.name).toBe(validTag.name)
    expect(result?.id).toBe(123)
  })

  it("タグ名が空ならエラーを返す", async () => {
    await expect(
      createProductTag({
        name: "",
        repositoryImpl: async () => ({ id: 1, name: "" }),
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("タグ名は1文字以上50文字以内である必要があります")
  })

  it("タグ名が51文字以上ならエラーを返す", async () => {
    await expect(
      createProductTag({
        name: "あ".repeat(51),
        repositoryImpl: async () => ({ id: 1, name: "あ".repeat(51) }),
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("タグ名は1文字以上50文字以内である必要があります")
  })
})
