import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import { MAX_STORE_PRODUCT_TAG_COUNT } from "../domain/product/constants"
import type ProductTag from "../domain/product/entities/productTag"
import * as productTagQueryRepository from "../domain/product/repositories/productTagQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import { getProductRegistrationFormComponentData } from "./getProductRegistrationFormComponentData"

const mockTags: ProductTag[] = [
  { id: 1, name: "人気" },
  { id: 2, name: "メイン" },
  { id: 3, name: "限定" },
]

const dbClient = {} as DbClient

describe("getProductRegistrationFormComponentData", () => {
  beforeAll(() => {
    spyOn(productTagQueryRepository, "findAllProductTags").mockImplementation(
      async () => mockTags,
    )
  })
  afterAll(() => {
    mock.restore()
  })

  it("すべてのタグを取得できる", async () => {
    const result = await getProductRegistrationFormComponentData({ dbClient })
    expect(result.tags.length).toBe(3)
    expect(result.tags).toEqual(mockTags)
  })

  it("ページネーションで1000件のlimitを指定している", async () => {
    const spy = spyOn(
      productTagQueryRepository,
      "findAllProductTags",
    ).mockImplementation(async (params) => {
      expect(params.pagination.limit).toBe(MAX_STORE_PRODUCT_TAG_COUNT)
      expect(params.pagination.offset).toBe(0)
      return mockTags
    })

    await getProductRegistrationFormComponentData({ dbClient })
    expect(spy).toHaveBeenCalled()
  })

  it("タグが空の場合も正しく返す", async () => {
    spyOn(
      productTagQueryRepository,
      "findAllProductTags",
    ).mockImplementationOnce(async () => [])

    const result = await getProductRegistrationFormComponentData({ dbClient })
    expect(result.tags).toEqual([])
  })
})
