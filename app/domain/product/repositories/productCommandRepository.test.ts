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
import type Product from "../entities/product"
import {
  type CreateProduct,
  createProduct,
  type UpdateProduct,
  updateProduct,
} from "./productCommandRepository"
import * as productQueryRepository from "./productQueryRepository"
import * as productTagQueryRepository from "./productTagQueryRepository"

const mockTags = [
  { id: 1, name: "人気" },
  { id: 2, name: "メイン" },
]

const validProduct: Omit<Product, "id"> = {
  name: "テスト商品",
  image: "https://example.com/image.png",
  tagIds: [1, 2],
  price: 1000,
  stock: 5,
}

describe("createProduct", () => {
  let findAllProductTagsSpy: ReturnType<typeof spyOn>
  let findProductByNameSpy: ReturnType<typeof spyOn>
  const mockDbClient = {} as TransactionDbClient

  beforeEach(() => {
    findAllProductTagsSpy = spyOn(
      productTagQueryRepository,
      "findAllProductTags",
    ).mockImplementation(async () => mockTags)

    findProductByNameSpy = spyOn(
      productQueryRepository,
      "findProductByName",
    ).mockImplementation(async () => null)
  })

  afterEach(() => {
    mock.restore()
  })

  it("バリデーションを通過した商品を作成できる", async () => {
    const mockImpl: CreateProduct = async ({ product }) => ({
      ...product,
      id: 99,
    })
    const result = await createProduct({
      product: validProduct,
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.name).toBe(validProduct.name)
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
    expect(findProductByNameSpy).toHaveBeenCalledTimes(1)
  })

  it("商品名が既に存在する場合はエラーを返す", async () => {
    findProductByNameSpy.mockImplementation(async () => ({
      id: 1,
      name: validProduct.name,
      image: "https://example.com/existing.png",
      tagIds: [1],
      price: 500,
      stock: 10,
    }))

    await expect(
      createProduct({
        product: validProduct,
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("同じ名前の商品が既に存在します")
    expect(findProductByNameSpy).toHaveBeenCalledTimes(1)
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
  })

  it("商品名が空ならエラーを返す", async () => {
    await expect(
      createProduct({
        product: { ...validProduct, name: "" },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("商品名は1文字以上50文字以内である必要があります")
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
    expect(findProductByNameSpy).not.toHaveBeenCalled()
  })

  it("画像URLが空ならエラーを返す", async () => {
    await expect(
      createProduct({
        product: { ...validProduct, image: "" },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow(
      "画像URLは1文字以上500文字以内かつhttp(s)で始まる必要があります",
    )
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
    expect(findProductByNameSpy).not.toHaveBeenCalled()
  })

  it("画像URLが500文字を超える場合はエラーを返す", async () => {
    const longUrl = `https://example.com/${"a".repeat(490)}`
    await expect(
      createProduct({
        product: { ...validProduct, image: longUrl },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow(
      "画像URLは1文字以上500文字以内かつhttp(s)で始まる必要があります",
    )
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
    expect(findProductByNameSpy).not.toHaveBeenCalled()
  })

  it("画像URLがhttp/httpsで始まらない場合はエラーを返す", async () => {
    await expect(
      createProduct({
        product: { ...validProduct, image: "ftp://example.com/image.png" },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow(
      "画像URLは1文字以上500文字以内かつhttp(s)で始まる必要があります",
    )
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
    expect(findProductByNameSpy).not.toHaveBeenCalled()
  })

  it("タグIDが存在しない場合はエラーを返す", async () => {
    await expect(
      createProduct({
        product: { ...validProduct, tagIds: [999] },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("タグIDは存在するタグのIDを参照する必要があります")
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
    expect(findProductByNameSpy).toHaveBeenCalledTimes(1)
  })
  it("タグが20個を超える場合はエラーを返す", async () => {
    const tagIds = Array.from({ length: 21 }, (_, i) => i + 1)
    await expect(
      createProduct({
        product: { ...validProduct, tagIds },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("商品タグは20個以内である必要があります")
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
    expect(findProductByNameSpy).not.toHaveBeenCalled()
  })
  it("タグがちょうど20個の場合は正常に作成できる", async () => {
    const tagIds = Array.from({ length: 20 }, (_, i) => i + 1)
    const extendedMockTags = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `タグ${i + 1}`,
    }))
    findAllProductTagsSpy.mockImplementation(async () => extendedMockTags)

    const mockImpl: CreateProduct = async ({ product }) => ({
      ...product,
      id: 99,
    })
    const result = await createProduct({
      product: { ...validProduct, tagIds },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.tagIds.length).toBe(20)
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
    expect(findProductByNameSpy).toHaveBeenCalledTimes(1)
  })
})

describe("updateProduct", () => {
  let findAllProductTagsSpy: ReturnType<typeof spyOn>
  let findProductByNameSpy: ReturnType<typeof spyOn>
  const mockDbClient = {} as TransactionDbClient

  beforeEach(() => {
    findAllProductTagsSpy = spyOn(
      productTagQueryRepository,
      "findAllProductTags",
    ).mockImplementation(async () => mockTags)

    findProductByNameSpy = spyOn(
      productQueryRepository,
      "findProductByName",
    ).mockImplementation(async () => null)
  })

  afterEach(() => {
    mock.restore()
  })

  it("バリデーションを通過した商品を更新できる", async () => {
    const mockImpl: UpdateProduct = async ({ product }) => product
    const result = await updateProduct({
      product: { ...validProduct, id: 1 },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.id).toBe(1)
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
    expect(findProductByNameSpy).toHaveBeenCalledTimes(1)
  })

  it("他の商品と名前が重複している場合はエラーを返す", async () => {
    findProductByNameSpy.mockImplementation(async () => ({
      id: 2,
      name: validProduct.name,
      image: "https://example.com/existing.png",
      tagIds: [1],
      price: 500,
      stock: 10,
    }))

    await expect(
      updateProduct({
        product: { ...validProduct, id: 1 },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("同じ名前の商品が既に存在します")
    expect(findProductByNameSpy).toHaveBeenCalledTimes(1)
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
  })

  it("自身と同じ名前での更新は許可される", async () => {
    findProductByNameSpy.mockImplementation(async () => ({
      id: 1,
      name: validProduct.name,
      image: "https://example.com/existing.png",
      tagIds: [1],
      price: 500,
      stock: 10,
    }))

    const mockImpl: UpdateProduct = async ({ product }) => product
    const result = await updateProduct({
      product: { ...validProduct, id: 1 },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.id).toBe(1)
    expect(findProductByNameSpy).toHaveBeenCalledTimes(1)
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
  })
})
