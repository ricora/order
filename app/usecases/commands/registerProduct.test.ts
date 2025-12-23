import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  mock,
  spyOn,
} from "bun:test"
import type { ProductTag } from "../../domain/product/entities"
import type { DbClient, TransactionDbClient } from "../../libs/db/client"

const mockTags: ProductTag[] = [
  { id: 1, name: "人気" },
  { id: 2, name: "メイン" },
]

const orderRepository = {} satisfies Partial<
  typeof import("../repositories-provider").orderRepository
>

type ProductRepository =
  typeof import("../repositories-provider").productRepository
type MockProductRepository = {
  [K in keyof ProductRepository]: Mock<ProductRepository[K]>
}

const productRepository = {
  findAllProductTags: mock(async () => ({
    ok: true as const,
    value: mockTags,
  })),
  createProductTag: mock(async ({ productTag }) => ({
    ok: true as const,
    value: { id: 3, name: productTag.name },
  })),
  findProductImageByProductId: mock(async () => ({
    ok: true,
    value: {
      id: 1,
      productId: 1,
      data: "image-data",
      mimeType: "image/png",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })),
  createProductImage: mock<ProductRepository["createProductImage"]>(
    async ({ productImage }) => ({
      ok: true as const,
      value: {
        id: 999,
        productId: productImage.productId,
        data: productImage.data,
        mimeType: productImage.mimeType,
        createdAt: productImage.createdAt,
        updatedAt: productImage.updatedAt,
      },
    }),
  ),
  updateProductImageByProductId: mock(async ({ productImage }) => ({
    ok: true,
    value: {
      id: productImage.productId,
      productId: productImage.productId,
      data: productImage.data ?? "updated-data",
      mimeType: productImage.mimeType ?? "image/png",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })),
  deleteProductImageByProductId: mock(async () => ({
    ok: true as const,
    value: undefined,
  })),
  createProduct: mock<ProductRepository["createProduct"]>(
    async ({ product }) => ({
      ok: true as const,
      value: { ...product, id: 99 },
    }),
  ),
  updateProduct: mock(async ({ product }) => ({
    ok: true as const,
    value: {
      id: product.id,
      name: product.name ?? "name",
      tagIds: product.tagIds ?? [1, 2],
      price: product.price ?? 100,
      stock: product.stock ?? 1,
    },
  })),
} satisfies Partial<MockProductRepository>

mock.module("../repositories-provider", () => ({
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

    productRepository.findAllProductTags.mockImplementation(async () => ({
      ok: true,
      value: mockTags,
    }))

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
    const res = await registerProduct({
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
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value).not.toBeNull()
  })

  it("新規タグを含めて商品を登録できる", async () => {
    const res = await registerProduct({
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
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value).not.toBeNull()
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

  it("createProductでホワイトリストのバリデーションエラーが伝播する", async () => {
    productRepository.createProduct.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "同じ名前の商品が既に存在します。",
    }))
    const res = await registerProduct({
      dbClient,
      product: {
        name: "重複商品",
        tags: ["人気"],
        price: 100,
        stock: 1,
      },
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("同じ名前の商品が既に存在します。")
  })

  it("createProductで非公開の内部エラーは汎用エラーにフォールバックする", async () => {
    productRepository.createProduct.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "タグIDは1以上の整数の配列である必要があります。",
    }))
    const res = await registerProduct({
      dbClient,
      product: {
        name: "DBエラー商品",
        tags: ["人気"],
        price: 100,
        stock: 1,
      },
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })

  it("createProductImageでホワイトリストのバリデーションエラーが伝播する", async () => {
    productRepository.createProductImage.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "画像データの形式が不正です。",
    }))
    const res = await registerProduct({
      dbClient,
      product: {
        name: "画像エラー商品",
        image: {
          data: "data",
          mimeType: "image/png",
        },
        tags: ["人気"],
        price: 100,
        stock: 1,
      },
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("画像データの形式が不正です。")
  })

  it("createProductImageで非公開の内部エラーは汎用エラーにフォールバックする", async () => {
    // @ts-expect-error
    productRepository.createProductImage.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "secret error",
    }))
    const res = await registerProduct({
      dbClient,
      product: {
        name: "画像DBエラー商品",
        image: {
          data: "data",
          mimeType: "image/png",
        },
        tags: ["人気"],
        price: 100,
        stock: 1,
      },
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
    expect(transactionSpy.mock.results[0].value).rejects.toThrow()
  })

  it("createProductImageが例外を投げた場合は汎用エラーにフォールバックする", async () => {
    productRepository.createProductImage.mockImplementationOnce(async () => {
      throw new Error("unexpected internal error")
    })
    const res = await registerProduct({
      dbClient,
      product: {
        name: "画像例外商品",
        image: {
          data: "data",
          mimeType: "image/png",
        },
        tags: ["人気"],
        price: 100,
        stock: 1,
      },
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })

  it("タグが空や空白のみの場合は無視される", async () => {
    const res = await registerProduct({
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
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value).not.toBeNull()
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
    const res = await registerProduct({
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
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
    expect(transactionSpy.mock.results[0].value).rejects.toThrow()
    expect(productRepository.createProductImage).not.toHaveBeenCalled()
  })
})
