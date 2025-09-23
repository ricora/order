import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import type { DbClient } from "../../../infrastructure/db/client"
import type Product from "../entities/product"
import {
  type FindAllProducts,
  type FindProductByName,
  findAllProducts,
  findProductById,
  findProductByName,
} from "./productQueryRepository"
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
  const mockDbClient = {} as DbClient

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
    const mockImpl = async ({ product }: { product: { id: number } }) =>
      mockProducts.find((p) => p.id === product.id) ?? null

    const result = await findProductById({
      product: { id: 1 },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.id).toBe(1)
    expect(result?.tagIds).toEqual([1, 2])
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
  })

  it("存在しない商品IDならnullを返す", async () => {
    const mockImpl = async () => null
    const result = await findProductById({
      product: { id: 999 },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).toBeNull()
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
  })
})

describe("findProductByName", () => {
  let findAllProductTagsSpy: ReturnType<typeof spyOn>
  const mockDbClient = {} as DbClient

  beforeEach(() => {
    findAllProductTagsSpy = spyOn(
      productTagQueryRepository,
      "findAllProductTags",
    ).mockImplementation(async () => mockTags)
  })

  afterEach(() => {
    mock.restore()
  })

  it("存在する商品名で商品を取得し、存在しないタグIDは除外される", async () => {
    const mockImpl: FindProductByName = async ({ product }) =>
      mockProducts.find((p) => p.name === product.name) ?? null

    const result = await findProductByName({
      product: { name: "テスト商品A" },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.id).toBe(1)
    expect(result?.name).toBe("テスト商品A")
    expect(result?.tagIds).toEqual([1, 2])
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
  })

  it("存在しない商品名ならnullを返す", async () => {
    const mockImpl: FindProductByName = async ({ product }) =>
      mockProducts.find((p) => p.name === product.name) ?? null

    const result = await findProductByName({
      product: { name: "存在しない商品" },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).toBeNull()
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
  })

  it("商品名で正しい商品が取得される", async () => {
    const mockImpl: FindProductByName = async ({ product }) =>
      mockProducts.find((p) => p.name === product.name) ?? null

    const result = await findProductByName({
      product: { name: "テスト商品B" },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.id).toBe(2)
    expect(result?.name).toBe("テスト商品B")
    expect(result?.price).toBe(200)
    expect(result?.stock).toBe(5)
    expect(result?.tagIds).toEqual([2])
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
  })

  it("大文字小文字を区別して検索される", async () => {
    const caseSensitiveProducts: Product[] = [
      {
        id: 1,
        name: "Product",
        image: null,
        tagIds: [1],
        price: 100,
        stock: 10,
      },
      {
        id: 2,
        name: "product",
        image: null,
        tagIds: [1],
        price: 200,
        stock: 5,
      },
    ]

    const mockImpl: FindProductByName = async ({ product }) =>
      caseSensitiveProducts.find((p) => p.name === product.name) ?? null

    const result1 = await findProductByName({
      product: { name: "Product" },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result1?.id).toBe(1)

    const result2 = await findProductByName({
      product: { name: "product" },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result2?.id).toBe(2)
  })

  it("空文字の商品名でもリポジトリ実装が呼ばれる", async () => {
    const mockImpl: FindProductByName = async () => null

    const result = await findProductByName({
      product: { name: "" },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).toBeNull()
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
  })

  it("特殊文字を含む商品名でも正しく検索される", async () => {
    const specialProducts: Product[] = [
      {
        id: 1,
        name: "商品@#$%",
        image: null,
        tagIds: [1],
        price: 100,
        stock: 10,
      },
      {
        id: 2,
        name: "商品'\"\\",
        image: null,
        tagIds: [1],
        price: 200,
        stock: 5,
      },
    ]

    const mockImpl: FindProductByName = async ({ product }) =>
      specialProducts.find((p) => p.name === product.name) ?? null

    const result1 = await findProductByName({
      product: { name: "商品@#$%" },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result1?.id).toBe(1)

    const result2 = await findProductByName({
      product: { name: "商品'\"\\" },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result2?.id).toBe(2)
  })
})

describe("findAllProducts", () => {
  let findAllProductTagsSpy: ReturnType<typeof spyOn>
  const mockDbClient = {} as DbClient

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
    const mockImpl: FindAllProducts = async ({ dbClient: _dbClient }) =>
      mockProducts
    const results = await findAllProducts({
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(results.length).toBe(2)
    expect(results.map((p) => p.tagIds)).toEqual([[1, 2], [2]])
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
  })
})
