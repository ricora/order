import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import type ProductTag from "../domain/product/entities/productTag"
import * as productCommandRepository from "../domain/product/repositories/productCommandRepository"
import * as productTagCommandRepository from "../domain/product/repositories/productTagCommandRepository"
import * as productTagQueryRepository from "../domain/product/repositories/productTagQueryRepository"
import type { DbClient, TransactionDbClient } from "../infrastructure/db/client"
import { registerProduct } from "./registerProduct"

const mockTags: ProductTag[] = [
  { id: 1, name: "人気" },
  { id: 2, name: "メイン" },
]

describe("registerProduct", () => {
  let createProductSpy: ReturnType<typeof spyOn>
  let updateProductSpy: ReturnType<typeof spyOn>
  let createProductTagSpy: ReturnType<typeof spyOn>
  let findAllProductTagsSpy: ReturnType<typeof spyOn>
  let transactionSpy: ReturnType<typeof spyOn>
  let txMock: TransactionDbClient
  let dbClient: DbClient

  beforeEach(() => {
    txMock = {} as TransactionDbClient
    const transactionHolder = {
      async transaction<T>(
        callback: (tx: TransactionDbClient) => Promise<T>,
      ): Promise<T> {
        return callback(txMock)
      },
    }
    dbClient = transactionHolder as unknown as DbClient
    transactionSpy = spyOn(transactionHolder, "transaction").mockImplementation(
      async <T>(callback: (tx: TransactionDbClient) => Promise<T>) =>
        callback(txMock),
    )
    findAllProductTagsSpy = spyOn(
      productTagQueryRepository,
      "findAllProductTags",
    ).mockImplementation(async () => mockTags)
    createProductTagSpy = spyOn(
      productTagCommandRepository,
      "createProductTag",
    ).mockImplementation(async ({ productTag }) => ({
      id: 3,
      name: productTag.name,
    }))
    createProductSpy = spyOn(
      productCommandRepository,
      "createProduct",
    ).mockImplementation(async ({ product }) => ({
      ...product,
      id: 99,
    }))
    updateProductSpy = spyOn(
      productCommandRepository,
      "updateProduct",
    ).mockImplementation(async ({ product }) => {
      return {
        id: product.id,
        name: product.name ?? "name",
        image: product.image ?? "https://example.com/image.png",
        tagIds: product.tagIds ?? [1, 2],
        price: product.price ?? 100,
        stock: product.stock ?? 1,
      }
    })
  })
  afterEach(() => {
    mock.restore()
  })

  it("既存タグのみで商品を登録できる", async () => {
    await registerProduct({
      dbClient,
      product: {
        name: "新商品",
        image: "https://example.com/new.png",
        tags: ["人気", "メイン"],
        price: 500,
        stock: 20,
      },
    })
    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
    expect(createProductTagSpy).not.toHaveBeenCalled()
    expect(createProductSpy).toHaveBeenCalledTimes(1)
    expect(createProductSpy.mock.calls[0][0].product.tagIds).toEqual([1, 2])
  })

  it("新規タグを含めて商品を登録できる", async () => {
    await registerProduct({
      dbClient,
      product: {
        name: "新商品2",
        image: "https://example.com/new2.png",
        tags: ["人気", "新規タグ"],
        price: 800,
        stock: 5,
      },
    })
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
    expect(createProductTagSpy).toHaveBeenCalledWith(
      expect.objectContaining({ productTag: { name: "新規タグ" } }),
    )
    expect(createProductSpy).toHaveBeenCalledTimes(1)
    expect(createProductSpy.mock.calls[0][0].product.tagIds).toEqual([1, 3])
  })

  it("タグが空や空白のみの場合は無視される", async () => {
    await registerProduct({
      dbClient,
      product: {
        name: "空タグ商品",
        image: "https://example.com/empty.png",
        tags: ["", "   "],
        price: 100,
        stock: 1,
      },
    })
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
    expect(createProductTagSpy).toHaveBeenCalledTimes(0)
    expect(createProductSpy).toHaveBeenCalledTimes(1)
    expect(createProductSpy.mock.calls[0][0].product.tagIds).toEqual([])
  })

  it("商品作成で例外が発生した場合はエラーを投げる", async () => {
    createProductSpy.mockImplementationOnce(async () => {
      throw new Error("DBで商品の作成に失敗しました")
    })
    await expect(
      registerProduct({
        dbClient,
        product: {
          name: "失敗商品",
          image: "https://example.com/fail.png",
          tags: ["人気"],
          price: 100,
          stock: 1,
        },
      }),
    ).rejects.toThrow("DBで商品の作成に失敗しました")
  })

  it("既存タグのみで商品を更新できる", async () => {
    const result = await registerProduct({
      dbClient,
      product: {
        id: 10,
        name: " 更新後商品 ",
        image: " https://example.com/updated.png ",
        tags: ["人気", "メイン"],
        price: 600,
        stock: 10,
      },
    })
    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
    expect(createProductTagSpy).not.toHaveBeenCalled()
    expect(updateProductSpy).toHaveBeenCalledTimes(1)
    expect(result).not.toBeNull()
    expect(result?.id).toBe(10)
    expect(result?.name).toBe("更新後商品")
    expect(result?.image).toBe("https://example.com/updated.png")
    expect(result?.tagIds).toEqual([1, 2])
    expect(result?.price).toBe(600)
    expect(result?.stock).toBe(10)
  })

  it("商品を部分更新できる", async () => {
    const result = await registerProduct({
      dbClient,
      product: {
        id: 12,
        name: "部分更新商品",
        price: 750,
      },
    })
    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(0)
    expect(createProductTagSpy).not.toHaveBeenCalled()
    expect(updateProductSpy).toHaveBeenCalledTimes(1)
    expect(result).not.toBeNull()
    expect(result?.id).toBe(12)
    expect(result?.name).toBe("部分更新商品")
    expect(result?.price).toBe(750)
    expect(result?.image).toBe("https://example.com/image.png")
    expect(result?.tagIds).toEqual([1, 2])
    expect(result?.price).toBe(750)
    expect(result?.stock).toBe(1)
  })

  it("タグが未指定の場合はtagIdsを更新しない", async () => {
    const result = await registerProduct({
      dbClient,
      product: {
        id: 11,
        name: "部分更新",
      },
    })
    expect(result).not.toBeNull()
    expect(result?.id).toBe(11)
    expect(result?.tagIds).toEqual([1, 2])
  })

  it("imageが空文字列の場合はnullとして更新される", async () => {
    await registerProduct({
      dbClient,
      product: {
        id: 13,
        image: "   ",
      },
    })
    expect(updateProductSpy).toHaveBeenCalledTimes(1)
    const passedImage = updateProductSpy.mock.calls[0][0].product.image
    expect(passedImage).toBeNull()
  })

  it("tagsが空配列の場合はtagIdsが空配列で更新される", async () => {
    const result = await registerProduct({
      dbClient,
      product: {
        id: 14,
        tags: [],
      },
    })
    expect(updateProductSpy).toHaveBeenCalledTimes(1)
    const passed = updateProductSpy.mock.calls[0][0].product
    expect(passed.tagIds).toEqual([])
    expect(result?.tagIds).toEqual([])
  })

  it("tagsが空白のみの配列の場合はtagIdsが空配列で更新される", async () => {
    const result = await registerProduct({
      dbClient,
      product: {
        id: 15,
        tags: ["", "   "],
      },
    })
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
    expect(updateProductSpy).toHaveBeenCalledTimes(1)
    const passedTagIds = updateProductSpy.mock.calls[0][0].product.tagIds
    expect(passedTagIds).toEqual([])
    expect(result?.tagIds).toEqual([])
  })

  it("新規タグを含めて商品を更新できる", async () => {
    const result = await registerProduct({
      dbClient,
      product: {
        id: 20,
        name: "更新商品2",
        image: "https://example.com/updated2.png",
        tags: ["人気", "新規タグ2"],
        price: 900,
        stock: 15,
      },
    })
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
    expect(createProductTagSpy).toHaveBeenCalledWith(
      expect.objectContaining({ productTag: { name: "新規タグ2" } }),
    )
    expect(result).not.toBeNull()
    expect(result?.id).toBe(20)
    expect(result?.tagIds).toEqual([1, 3])
  })

  it("商品更新で例外が発生した場合はエラーを投げる", async () => {
    updateProductSpy.mockImplementationOnce(async () => {
      throw new Error("DBで商品の更新に失敗しました")
    })
    await expect(
      registerProduct({
        dbClient,
        product: {
          id: 21,
          name: "失敗更新商品",
          price: 100,
        },
      }),
    ).rejects.toThrow("DBで商品の更新に失敗しました")
  })
})
