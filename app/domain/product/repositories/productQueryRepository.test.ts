import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import type Product from "../entities/product"
import { findAllProducts, findProductById } from "./productQueryRepository"
import * as productTagQueryRepository from "./productTagQueryRepository"

const mockTags = [
  { id: 1, name: "人気" },
  { id: 2, name: "メイン" },
]

const mockProducts: Product[] = [
  {
    id: 1,
    name: "テスト商品A",
    image: "https://example.com/a.png",
    tagIds: [1, 2, 999],
    price: 100,
    stock: 10,
  },
  {
    id: 2,
    name: "テスト商品B",
    image: "https://example.com/b.png",
    tagIds: [2],
    price: 200,
    stock: 5,
  },
]

describe("findProductById", () => {
  let findAllProductTagsSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    findAllProductTagsSpy = spyOn(
      productTagQueryRepository,
      "findAllProductTags",
    ).mockImplementation(async () => mockTags)
  })

  afterEach(() => {
    mock.restore()
  })

  it("存在する商品を取得し、存在しないタグIDは除外される", async () => {
    const mockImpl = async ({ id }: { id: number }) =>
      mockProducts.find((p) => p.id === id) ?? null

    const result = await findProductById({
      id: 1,
      repositoryImpl: mockImpl,
    })
    expect(result).not.toBeNull()
    expect(result?.id).toBe(1)
    expect(result?.tagIds).toEqual([1, 2])
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
  })

  it("存在しない商品IDならnullを返す", async () => {
    const mockImpl = async () => null
    const result = await findProductById({
      id: 999,
      repositoryImpl: mockImpl,
    })
    expect(result).toBeNull()
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
  })
})

describe("findAllProducts", () => {
  let findAllProductTagsSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    findAllProductTagsSpy = spyOn(
      productTagQueryRepository,
      "findAllProductTags",
    ).mockImplementation(async () => mockTags)
  })

  afterEach(() => {
    mock.restore()
  })

  it("全商品を取得し、各商品で存在しないタグIDは除外される", async () => {
    const mockImpl = async () => mockProducts
    const results = await findAllProducts({
      repositoryImpl: mockImpl,
    })
    expect(results.length).toBe(2)
    expect(results.map((p) => p.tagIds)).toEqual([[1, 2], [2]])
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
  })
})
