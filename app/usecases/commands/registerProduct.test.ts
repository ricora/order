import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import { MAX_STORE_PRODUCT_TAG_COUNT } from "../../domain/product/constants"
import type ProductImage from "../../domain/product/entities/productImage"
import type ProductTag from "../../domain/product/entities/productTag"
import type { DbClient, TransactionDbClient } from "../../libs/db/client"

const mockTags: ProductTag[] = [
  { id: 1, name: "人気" },
  { id: 2, name: "メイン" },
]

const orderRepository = {} satisfies Partial<
  typeof import("../repositories").orderRepository
>

const productRepository = {
  findAllProductTags: mock(async () => mockTags),
  createProductTag: mock(async ({ productTag }) => ({
    id: 3,
    name: productTag.name,
  })),
  findProductImageByProductId: mock(
    async (): Promise<ProductImage | null> => null,
  ),
  createProductImage: mock(async ({ productImage }) => ({
    id: 999,
    productId: productImage.productId,
    data: productImage.data,
    mimeType: productImage.mimeType,
    createdAt: productImage.createdAt,
    updatedAt: productImage.updatedAt,
  })),
  updateProductImageByProductId: mock(async ({ productImage }) => ({
    id: productImage.productId,
    productId: productImage.productId,
    data: productImage.data ?? "updated-data",
    mimeType: productImage.mimeType ?? "image/png",
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  deleteProductImageByProductId: mock(async () => undefined),
  createProduct: mock(async ({ product }) => ({
    ...product,
    id: 99,
  })),
  updateProduct: mock(async ({ product }) => ({
    id: product.id,
    name: product.name ?? "name",
    tagIds: product.tagIds ?? [1, 2],
    price: product.price ?? 100,
    stock: product.stock ?? 1,
  })),
} satisfies Partial<typeof import("../repositories").productRepository>

mock.module("../repositories", () => ({
  orderRepository,
  productRepository,
}))

const { registerProduct } = await import("./registerProduct")

describe("registerProduct", () => {
  let transactionSpy: ReturnType<typeof spyOn>
  let txMock: TransactionDbClient
  let dbClient: DbClient

  beforeEach(() => {
    productRepository.findAllProductTags.mockClear()
    productRepository.createProductTag.mockClear()
    productRepository.findProductImageByProductId.mockClear()
    productRepository.createProductImage.mockClear()
    productRepository.updateProductImageByProductId.mockClear()
    productRepository.deleteProductImageByProductId.mockClear()
    productRepository.createProduct.mockClear()
    productRepository.updateProduct.mockClear()

    productRepository.findAllProductTags.mockImplementation(
      async () => mockTags,
    )
    productRepository.findProductImageByProductId.mockImplementation(
      async () => null,
    )

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
  })

  afterEach(() => {
    mock.restore()
  })

  it("既存タグのみで商品を登録できる", async () => {
    await registerProduct({
      dbClient,
      product: {
        name: "新商品",
        image: {
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          mimeType: "image/png",
        },
        tags: ["人気", "メイン"],
        price: 500,
        stock: 20,
      },
    })
    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(productRepository.findAllProductTags).toHaveBeenCalledTimes(1)
    expect(productRepository.createProductTag).not.toHaveBeenCalled()
    expect(productRepository.createProduct).toHaveBeenCalledTimes(1)
    expect(productRepository.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        product: expect.objectContaining({ tagIds: [1, 2] }),
      }),
    )
    expect(productRepository.createProductImage).toHaveBeenCalledTimes(1)
    expect(productRepository.createProductImage).toHaveBeenCalledWith(
      expect.objectContaining({
        productImage: expect.objectContaining({
          productId: 99,
          mimeType: "image/png",
        }),
      }),
    )
    expect(
      productRepository.updateProductImageByProductId,
    ).not.toHaveBeenCalled()
    expect(productRepository.findProductImageByProductId).not.toHaveBeenCalled()
  })

  it("新規タグを含めて商品を登録できる", async () => {
    await registerProduct({
      dbClient,
      product: {
        name: "新商品2",
        image: {
          data: "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2P4//8/AyMDIwMhwOgAAI9/Bv6zbsz/AAAAAElFTkSuQmCC",
          mimeType: "image/jpeg",
        },
        tags: ["人気", "新規タグ"],
        price: 800,
        stock: 5,
      },
    })
    expect(productRepository.findAllProductTags).toHaveBeenCalledTimes(1)
    expect(productRepository.createProductTag).toHaveBeenCalledWith(
      expect.objectContaining({ productTag: { name: "新規タグ" } }),
    )
    expect(productRepository.createProduct).toHaveBeenCalledTimes(1)
    expect(productRepository.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        product: expect.objectContaining({ tagIds: [1, 3] }),
      }),
    )
  })

  it("タグが空や空白のみの場合は無視される", async () => {
    await registerProduct({
      dbClient,
      product: {
        name: "空タグ商品",
        image: {
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          mimeType: "image/png",
        },
        tags: ["", "   "],
        price: 100,
        stock: 1,
      },
    })
    expect(productRepository.findAllProductTags).toHaveBeenCalledTimes(1)
    expect(productRepository.createProductTag).toHaveBeenCalledTimes(0)
    expect(productRepository.createProduct).toHaveBeenCalledTimes(1)
    expect(productRepository.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        product: expect.objectContaining({ tagIds: [] }),
      }),
    )
  })

  it("商品作成で例外が発生した場合はエラーを投げる", async () => {
    productRepository.createProduct.mockImplementationOnce(async () => {
      throw new Error("DBで商品の作成に失敗しました")
    })
    await expect(
      registerProduct({
        dbClient,
        product: {
          name: "失敗商品",
          image: {
            data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            mimeType: "image/png",
          },
          tags: ["人気"],
          price: 100,
          stock: 1,
        },
      }),
    ).rejects.toThrow("DBで商品の作成に失敗しました")
    expect(productRepository.createProductImage).not.toHaveBeenCalled()
  })

  it("既存タグのみで商品を更新できる", async () => {
    const mockExistingImage = {
      id: 1,
      productId: 10,
      data: "old",
      mimeType: "image/png",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    productRepository.findProductImageByProductId.mockImplementationOnce(
      async () => mockExistingImage,
    )
    const result = await registerProduct({
      dbClient,
      product: {
        id: 10,
        name: " 更新後商品 ",
        image: {
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          mimeType: "image/png",
        },
        tags: ["人気", "メイン"],
        price: 600,
        stock: 10,
      },
    })
    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(productRepository.findAllProductTags).toHaveBeenCalledTimes(1)
    expect(productRepository.createProductTag).not.toHaveBeenCalled()
    expect(productRepository.updateProduct).toHaveBeenCalledTimes(1)
    expect(result).not.toBeNull()
    expect(result?.id).toBe(10)
    expect(result?.name).toBe("更新後商品")
    expect(result?.tagIds).toEqual([1, 2])
    expect(result?.price).toBe(600)
    expect(result?.stock).toBe(10)
    expect(productRepository.findProductImageByProductId).toHaveBeenCalledTimes(
      1,
    )
    expect(
      productRepository.updateProductImageByProductId,
    ).toHaveBeenCalledTimes(1)
    expect(productRepository.createProductImage).not.toHaveBeenCalled()
    expect(
      productRepository.deleteProductImageByProductId,
    ).not.toHaveBeenCalled()
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
    expect(productRepository.findAllProductTags).toHaveBeenCalledTimes(0)
    expect(productRepository.createProductTag).not.toHaveBeenCalled()
    expect(productRepository.updateProduct).toHaveBeenCalledTimes(1)
    expect(result).not.toBeNull()
    expect(result?.id).toBe(12)
    expect(result?.name).toBe("部分更新商品")
    expect(result?.tagIds).toEqual([1, 2])
    expect(result?.price).toBe(750)
    expect(result?.stock).toBe(1)
    expect(productRepository.findProductImageByProductId).not.toHaveBeenCalled()
    expect(productRepository.createProductImage).not.toHaveBeenCalled()
    expect(
      productRepository.updateProductImageByProductId,
    ).not.toHaveBeenCalled()
    expect(
      productRepository.deleteProductImageByProductId,
    ).not.toHaveBeenCalled()
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
        image: null,
      },
    })
    expect(productRepository.updateProduct).toHaveBeenCalledTimes(1)
    expect(
      productRepository.deleteProductImageByProductId,
    ).toHaveBeenCalledTimes(1)
    expect(
      productRepository.deleteProductImageByProductId,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        productImage: expect.objectContaining({ productId: 13 }),
      }),
    )
    expect(productRepository.createProductImage).not.toHaveBeenCalled()
    expect(
      productRepository.updateProductImageByProductId,
    ).not.toHaveBeenCalled()
  })

  it("tagsが空配列の場合はtagIdsが空配列で更新される", async () => {
    const result = await registerProduct({
      dbClient,
      product: {
        id: 14,
        tags: [],
      },
    })
    expect(productRepository.updateProduct).toHaveBeenCalledTimes(1)
    expect(productRepository.updateProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        product: expect.objectContaining({ tagIds: [] }),
      }),
    )
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
    expect(productRepository.findAllProductTags).toHaveBeenCalledTimes(1)
    expect(productRepository.updateProduct).toHaveBeenCalledTimes(1)
    expect(productRepository.updateProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        product: expect.objectContaining({ tagIds: [] }),
      }),
    )
    expect(result?.tagIds).toEqual([])
  })

  it("新規タグを含めて商品を更新できる", async () => {
    const result = await registerProduct({
      dbClient,
      product: {
        id: 20,
        name: "更新商品2",
        image: {
          data: "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2P4//8/AyMDIwMhwOgAAI9/Bv6zbsz/AAAAAElFTkSuQmCC",
          mimeType: "image/jpeg",
        },
        tags: ["人気", "新規タグ2"],
        price: 900,
        stock: 15,
      },
    })
    expect(productRepository.findAllProductTags).toHaveBeenCalledTimes(1)
    expect(productRepository.createProductTag).toHaveBeenCalledWith(
      expect.objectContaining({ productTag: { name: "新規タグ2" } }),
    )
    expect(result).not.toBeNull()
    expect(result?.id).toBe(20)
    expect(result?.tagIds).toEqual([1, 3])
    expect(productRepository.createProductImage).toHaveBeenCalledTimes(1)
    expect(
      productRepository.updateProductImageByProductId,
    ).not.toHaveBeenCalled()
  })

  it("商品更新で例外が発生した場合はエラーを投げる", async () => {
    productRepository.updateProduct.mockImplementationOnce(async () => {
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

  it("findAllProductTagsに正しいページネーションパラメータを渡している", async () => {
    await registerProduct({
      dbClient,
      product: {
        name: "新商品",
        image: {
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          mimeType: "image/png",
        },
        tags: ["人気"],
        price: 500,
        stock: 20,
      },
    })

    expect(productRepository.findAllProductTags).toHaveBeenCalledTimes(1)
    expect(productRepository.findAllProductTags).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: { offset: 0, limit: MAX_STORE_PRODUCT_TAG_COUNT },
      }),
    )
  })

  it("商品更新時もfindAllProductTagsに正しいページネーションパラメータを渡している", async () => {
    await registerProduct({
      dbClient,
      product: {
        id: 10,
        name: "更新商品",
        tags: ["メイン"],
      },
    })

    expect(productRepository.findAllProductTags).toHaveBeenCalledTimes(1)
    expect(productRepository.findAllProductTags).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: { offset: 0, limit: MAX_STORE_PRODUCT_TAG_COUNT },
      }),
    )
  })
})
