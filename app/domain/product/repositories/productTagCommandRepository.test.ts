import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import type { TransactionDbClient } from "../../../infrastructure/db/client"
import { MAX_STORE_PRODUCT_TAG_COUNT } from "../constants"
import type ProductTag from "../entities/productTag"
import {
  type CreateProductTag,
  createProductTag,
} from "./productTagCommandRepository"
import * as productTagQueryRepository from "./productTagQueryRepository"

const validTag: Omit<ProductTag, "id"> = {
  name: "新しいタグ",
}

describe("createProductTag", () => {
  const mockDbClient = {} as TransactionDbClient
  let countProductTagsSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    countProductTagsSpy = spyOn(
      productTagQueryRepository,
      "countProductTags",
    ).mockImplementation(async () => 0)
  })

  afterEach(() => {
    mock.restore()
  })

  it("バリデーションを通過したタグを作成できる", async () => {
    const mockImpl: CreateProductTag = async ({ productTag }) => ({
      ...productTag,
      id: 123,
    })
    const result = await createProductTag({
      productTag: validTag,
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
        productTag: { name: "" },
        repositoryImpl: async () => ({ id: 1, name: "" }),
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("タグ名は1文字以上50文字以内である必要があります")
  })

  it("タグ数の上限に達している場合はエラーを返す", async () => {
    countProductTagsSpy.mockImplementation(
      async () => MAX_STORE_PRODUCT_TAG_COUNT,
    )

    await expect(
      createProductTag({
        productTag: validTag,
        repositoryImpl: async () => ({ id: 1, name: validTag.name }),
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow(
      `1店舗あたりの商品タグは${MAX_STORE_PRODUCT_TAG_COUNT}個までです`,
    )
    expect(countProductTagsSpy).toHaveBeenCalledTimes(1)
  })

  it("タグ名が51文字以上ならエラーを返す", async () => {
    await expect(
      createProductTag({
        productTag: { name: "あ".repeat(51) },
        repositoryImpl: async () => ({ id: 1, name: "あ".repeat(51) }),
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("タグ名は1文字以上50文字以内である必要があります")
  })
})
