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
import { MAX_STORE_PRODUCT_TAG_COUNT } from "../../domain/product/constants"
import type { ProductImage, ProductTag } from "../../domain/product/entities"
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
  createProductTag: mock<ProductRepository["createProductTag"]>(
    async ({ productTag }) => ({
      ok: true as const,
      value: { id: 3, name: productTag.name },
    }),
  ),
  findProductImageByProductId: mock<
    ProductRepository["findProductImageByProductId"]
  >(async () => ({
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
  createProduct: mock(async ({ product }) => ({
    ok: true as const,
    value: { ...product, id: 99 },
  })),
  updateProduct: mock<ProductRepository["updateProduct"]>(
    async ({ product }) => ({
      ok: true as const,
      value: {
        id: product.id,
        name: product.name ?? "name",
        tagIds: product.tagIds ?? [1, 2],
        price: product.price ?? 100,
        stock: product.stock ?? 1,
      },
    }),
  ),
} satisfies Partial<MockProductRepository>

mock.module("../repositories-provider", () => ({
  orderRepository,
  productRepository,
}))

const { setProductDetails } = await import("./setProductDetails")

describe("setProductDetails", () => {
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

  it("既存タグのみで商品を更新できる", async () => {
    const mockExistingImage = {
      id: 1,
      productId: 10,
      data: "old",
      mimeType: "image/png",
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies ProductImage
    productRepository.findProductImageByProductId.mockImplementation(
      async () => ({ ok: true, value: mockExistingImage }),
    )
    const result = await setProductDetails({
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
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.id).toBe(10)
      expect(result.value.name).toBe("更新後商品")
      expect(result.value.tagIds).toEqual([1, 2])
      expect(result.value.price).toBe(600)
      expect(result.value.stock).toBe(10)
    }
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
    const result = await setProductDetails({
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
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.id).toBe(12)
      expect(result.value.name).toBe("部分更新商品")
      expect(result.value.tagIds).toEqual([1, 2])
      expect(result.value.price).toBe(750)
      expect(result.value.stock).toBe(1)
    }
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
    const result = await setProductDetails({
      dbClient,
      product: {
        id: 11,
        name: "部分更新",
      },
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.id).toBe(11)
      expect(result.value.tagIds).toEqual([1, 2])
    }
  })

  it("imageが空文字列の場合はnullとして更新される", async () => {
    const res = await setProductDetails({
      dbClient,
      product: {
        id: 13,
        image: { data: "", mimeType: "image/png" },
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
    expect(res.ok).toBe(true)
    expect(
      productRepository.updateProductImageByProductId,
    ).not.toHaveBeenCalled()
  })

  it("tagsが空配列の場合はtagIdsが空配列で更新される", async () => {
    const result = await setProductDetails({
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
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.tagIds).toEqual([])
  })

  it("tagsが空白のみの配列の場合はtagIdsが空配列で更新される", async () => {
    const result = await setProductDetails({
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
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.tagIds).toEqual([])
  })

  it("新規タグを含めて商品を更新できる", async () => {
    const result = await setProductDetails({
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
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.id).toBe(20)
      expect(result.value.tagIds).toEqual([1, 3])
    }
  })

  it("タグ作成がホワイトリストのバリデーションエラーを返す場合はそのエラーメッセージを返す", async () => {
    productRepository.createProductTag.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "タグ名は1文字以上50文字以内である必要があります。",
    }))

    const res = await setProductDetails({
      dbClient,
      product: {
        id: 30,
        tags: ["新規タグ"],
      },
    })

    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe(
        "タグ名は1文字以上50文字以内である必要があります。",
      )
  })

  it("タグ作成が非ホワイトリストのエラーを返す場合は汎用エラーを返す", async () => {
    // @ts-expect-error
    productRepository.createProductTag.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "internal error",
    }))

    const res = await setProductDetails({
      dbClient,
      product: {
        id: 31,
        tags: ["新規タグ"],
      },
    })

    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
    expect(transactionSpy.mock.results[0].value).rejects.toThrow()
  })

  it("画像作成がホワイトリストのバリデーションエラーを返す場合はそのまま返す", async () => {
    productRepository.findProductImageByProductId.mockImplementationOnce(
      async () => ({
        ok: false as const,
        message: "商品画像が見つかりません。",
      }),
    )
    productRepository.createProductImage.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "画像データの形式が不正です。",
    }))

    const res = await setProductDetails({
      dbClient,
      product: {
        id: 40,
        image: {
          data: "invalid",
          mimeType: "image/png",
        },
      },
    })

    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("画像データの形式が不正です。")
  })

  it("商品名の長さバリデーションエラーを返す", async () => {
    productRepository.updateProduct.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "商品名は1文字以上50文字以内である必要があります。",
    }))

    const res = await setProductDetails({
      dbClient,
      product: { id: 100, name: "" },
    })
    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe(
        "商品名は1文字以上50文字以内である必要があります。",
      )
  })

  it("商品タグ数の上限エラーを返す", async () => {
    productRepository.updateProduct.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "商品タグは20個以内である必要があります。",
    }))

    const res = await setProductDetails({
      dbClient,
      product: { id: 101, tags: Array(21).fill("t") },
    })
    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe("商品タグは20個以内である必要があります。")
  })

  it("価格の下限バリデーションエラーを返す", async () => {
    productRepository.updateProduct.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "価格は0以上の整数である必要があります。",
    }))
    const res = await setProductDetails({
      dbClient,
      product: { id: 102, price: -1 },
    })
    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe("価格は0以上の整数である必要があります。")
  })

  it("価格の上限バリデーションエラーを返す", async () => {
    productRepository.updateProduct.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "価格は1000000000以下である必要があります。",
    }))
    const res = await setProductDetails({
      dbClient,
      product: { id: 103, price: 1000000001 },
    })
    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe("価格は1000000000以下である必要があります。")
  })

  it("在庫の下限バリデーションエラーを返す", async () => {
    productRepository.updateProduct.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "在庫数は0以上の整数である必要があります。",
    }))
    const res = await setProductDetails({
      dbClient,
      product: { id: 104, stock: -5 },
    })
    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe("在庫数は0以上の整数である必要があります。")
  })

  it("在庫の上限バリデーションエラーを返す", async () => {
    productRepository.updateProduct.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "在庫数は1000000000以下である必要があります。",
    }))
    const res = await setProductDetails({
      dbClient,
      product: { id: 105, stock: 1000000001 },
    })
    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe("在庫数は1000000000以下である必要があります。")
  })

  it("1店舗あたりの商品数上限エラーを返す", async () => {
    productRepository.updateProduct.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "1店舗あたりの商品数は1000件までです。",
    }))
    const res = await setProductDetails({
      dbClient,
      product: { id: 106, name: "P" },
    })
    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe("1店舗あたりの商品数は1000件までです。")
  })

  it("画像MIMEタイプのバリデーションエラーを返す", async () => {
    productRepository.findProductImageByProductId.mockImplementationOnce(
      async () => ({
        ok: false as const,
        message: "商品画像が見つかりません。",
      }),
    )
    productRepository.createProductImage.mockImplementationOnce(async () => ({
      ok: false as const,
      message:
        "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります。",
    }))
    const res = await setProductDetails({
      dbClient,
      product: { id: 110, image: { data: "iVB..", mimeType: "image/png" } },
    })
    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe(
        "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります。",
      )
  })

  it("画像サイズのバリデーションエラーを返す", async () => {
    productRepository.findProductImageByProductId.mockImplementationOnce(
      async () => ({
        ok: false as const,
        message: "商品画像が見つかりません。",
      }),
    )
    productRepository.createProductImage.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "画像データのサイズは約7.5MB以内である必要があります。",
    }))
    const res = await setProductDetails({
      dbClient,
      product: {
        id: 111,
        image: { data: "A".repeat(10000000), mimeType: "image/png" },
      },
    })
    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe(
        "画像データのサイズは約7.5MB以内である必要があります。",
      )
  })

  it("商品更新で例外が発生した場合はエラーを投げる", async () => {
    productRepository.updateProduct.mockImplementationOnce(async () => {
      throw new Error("DBで商品の更新に失敗しました")
    })
    const res = await setProductDetails({
      dbClient,
      product: {
        id: 21,
        name: "失敗更新商品",
        price: 100,
      },
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })

  it("商品更新時もfindAllProductTagsに正しいページネーションパラメータを渡している", async () => {
    await setProductDetails({
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
