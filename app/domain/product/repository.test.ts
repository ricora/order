import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  mock,
} from "bun:test"
import type { TransactionDbClient } from "../../libs/db/client"
import {
  MAX_PRODUCT_PRICE,
  MAX_PRODUCT_STOCK,
  MAX_STORE_PRODUCT_COUNT,
  MAX_STORE_PRODUCT_TAG_COUNT,
  MAX_TAGS_PER_PRODUCT,
} from "./constants"
import type { Product, ProductImage, ProductTag } from "./entities"
import { createRepository, type Repository } from "./repository"

const mockTags = [
  { id: 1, name: "人気" },
  { id: 2, name: "メイン" },
]

const validProduct: Omit<Product, "id"> = {
  name: "テスト商品",
  tagIds: [1, 2],
  price: 1000,
  stock: 5,
}

const defaultProduct: Product = {
  id: 1,
  name: "テスト商品",
  tagIds: [1, 2],
  price: 1000,
  stock: 5,
}

const applyPartialToDefaultProduct = (
  partialProduct: Pick<Product, "id"> & Partial<Omit<Product, "id">>,
) => Object.assign({}, defaultProduct, partialProduct)

type MockRepository = {
  [K in keyof Repository]: Mock<Repository[K]>
}

describe("Product repository", () => {
  const mockDbClient = {} as TransactionDbClient
  let adapters: MockRepository
  let repository: Repository

  beforeEach(() => {
    adapters = {
      findProductById: mock(async () => ({
        ok: false,
        message: "商品が見つかりません。",
      })),
      findProductByName: mock(async () => ({
        ok: false,
        message: "商品が見つかりません。",
      })),
      findAllProductsByIds: mock(async () => ({ ok: true, value: [] })),
      findAllProductsOrderByIdAsc: mock(async () => ({ ok: true, value: [] })),
      findAllProductsOrderByIdDesc: mock(async () => ({ ok: true, value: [] })),
      findAllProductStocks: mock(async () => ({ ok: true, value: [] })),
      findProductTagById: mock(async () => ({
        ok: false,
        message: "商品タグが見つかりません。",
      })),
      findAllProductTags: mock(async () => ({ ok: true, value: mockTags })),
      findAllProductTagsByIds: mock(async () => ({ ok: true, value: [] })),
      getProductCountByStoreId: mock(async () => ({ ok: true, value: 0 })),
      getAllProductTagRelationCountsByTagIds: mock(async () => ({
        ok: true,
        value: [],
      })),
      getProductTagCountByStoreId: mock(async () => ({ ok: true, value: 0 })),
      findProductImageByProductId: mock(async () => ({
        ok: false,
        message: "商品画像が見つかりません。",
      })),
      createProduct: mock(async ({ product }) => ({
        ok: true,
        value: { ...product, id: 99 },
      })),
      updateProduct: mock(async ({ product }) => ({
        ok: true,
        value: applyPartialToDefaultProduct(product),
      })),
      deleteProduct: mock(async () => ({ ok: true, value: undefined })),
      createProductTag: mock(async ({ productTag }) => ({
        ok: true,
        value: { ...productTag, id: 99 },
      })),
      deleteAllProductTagsByIds: mock(async () => ({
        ok: true,
        value: undefined,
      })),
      createProductImage: mock(async ({ productImage }) => ({
        ok: true,
        value: {
          id: 1,
          productId: productImage.productId,
          data: productImage.data ?? "",
          mimeType: productImage.mimeType ?? "image/png",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })),
      updateProductImageByProductId: mock(async ({ productImage }) => ({
        ok: true,
        value: {
          id: 1,
          productId: productImage.productId,
          data: productImage.data ?? "",
          mimeType: productImage.mimeType ?? "image/png",
          createdAt: new Date(),
          updatedAt: productImage.updatedAt,
        },
      })),
      deleteProductImageByProductId: mock(async () => ({
        ok: true,
        value: undefined,
      })),
      incrementProductCountByStoreId: mock(async () => ({
        ok: true,
        value: undefined,
      })),
      decrementProductCountByStoreId: mock(async () => ({
        ok: true,
        value: undefined,
      })),
      incrementProductTagCountByStoreId: mock(async () => ({
        ok: true,
        value: undefined,
      })),
      decrementProductTagCountByStoreId: mock(async () => ({
        ok: true,
        value: undefined,
      })),
      incrementAllProductTagRelationCountsByTagIds: mock(async () => ({
        ok: true,
        value: undefined,
      })),
      decrementAllProductTagRelationCountsByTagIds: mock(async () => ({
        ok: true,
        value: undefined,
      })),
    }
    repository = createRepository(adapters)
  })

  afterEach(() => {
    mock.restore()
  })
  describe("createProduct", () => {
    it("バリデーションを通過した商品を作成できる", async () => {
      const result = await repository.createProduct({
        product: validProduct,
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.name).toBe(validProduct.name)
      expect(adapters.findAllProductTags).toHaveBeenCalledTimes(1)
      expect(adapters.findProductByName).toHaveBeenCalledTimes(1)
    })

    it("商品作成時に店舗の商品数とタグごとの商品数が更新される", async () => {
      adapters.getProductCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: 2,
      }))
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ tagId: id, count: 0 })),
        }),
      )
      adapters.createProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: { ...product, id: 99 },
      }))

      await repository.createProduct({
        product: validProduct,
        dbClient: mockDbClient,
      })

      expect(adapters.incrementProductCountByStoreId).toHaveBeenCalledTimes(1)
      const incCall = adapters.incrementProductCountByStoreId.mock.calls[0]?.[0]
      expect(incCall?.store.delta).toBe(1)
      expect(incCall?.store.updatedAt).toBeInstanceOf(Date)

      expect(
        adapters.incrementAllProductTagRelationCountsByTagIds,
      ).toHaveBeenCalledTimes(1)
      const tagsCall =
        adapters.incrementAllProductTagRelationCountsByTagIds.mock.calls[0]?.[0]
      expect(
        tagsCall?.productTags.map(({ id, delta }) => ({ id, delta })),
      ).toEqual(validProduct.tagIds.map((id) => ({ id, delta: 1 })))
      for (const t of tagsCall?.productTags ?? []) {
        expect(t.updatedAt).toBeInstanceOf(Date)
      }
    })

    it("タグを持たない商品を作成した場合、店舗の商品数のみが更新される", async () => {
      adapters.getProductCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: 2,
      }))
      adapters.createProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: { ...product, id: 99, tagIds: [] },
      }))

      await repository.createProduct({
        product: { ...validProduct, tagIds: [] },
        dbClient: mockDbClient,
      })

      expect(adapters.incrementProductCountByStoreId).toHaveBeenCalledTimes(1)
      expect(
        adapters.incrementAllProductTagRelationCountsByTagIds,
      ).not.toHaveBeenCalled()
    })

    it("商品の作成時に商品数取得エラーが発生したら処理を中止する", async () => {
      adapters.getProductCountByStoreId.mockImplementation(async () => {
        throw new Error("db error")
      })
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ tagId: id, count: 0 })),
        }),
      )
      adapters.createProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: { ...product, id: 99 },
      }))

      let threw = false
      try {
        await repository.createProduct({
          product: validProduct,
          dbClient: mockDbClient,
        })
      } catch {
        threw = true
      }
      expect(threw).toBe(true)
      expect(adapters.incrementProductCountByStoreId).not.toHaveBeenCalled()
      expect(
        adapters.incrementAllProductTagRelationCountsByTagIds,
      ).not.toHaveBeenCalled()
    })

    it("商品の作成時に商品数更新エラーが発生したら処理を中止する", async () => {
      adapters.getProductCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: 2,
      }))
      adapters.incrementProductCountByStoreId.mockImplementation(async () => {
        throw new Error("db error")
      })
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ tagId: id, count: 0 })),
        }),
      )
      adapters.createProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: { ...product, id: 99 },
      }))

      let threw2 = false
      try {
        await repository.createProduct({
          product: validProduct,
          dbClient: mockDbClient,
        })
      } catch {
        threw2 = true
      }
      expect(threw2).toBe(true)
      expect(
        adapters.incrementAllProductTagRelationCountsByTagIds,
      ).not.toHaveBeenCalled()
    })

    // NOTE: duplicate tests removed — same scenarios covered above

    it("タグカウント取得が失敗した場合は作成を失敗させカウント更新は行われない", async () => {
      adapters.getProductCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: 2,
      }))
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async () => ({ ok: false, message: "エラーが発生しました。" }),
      )
      adapters.createProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: { ...product, id: 99 },
      }))

      const result = await repository.createProduct({
        product: validProduct,
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      expect(
        adapters.incrementAllProductTagRelationCountsByTagIds,
      ).not.toHaveBeenCalled()
      expect(
        adapters.decrementAllProductTagRelationCountsByTagIds,
      ).not.toHaveBeenCalled()
    })

    it("商品名が既に存在する場合はエラーを返す", async () => {
      adapters.findProductByName.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: validProduct.name,
          tagIds: [1],
          price: 500,
          stock: 10,
        },
      }))

      const result = await repository.createProduct({
        product: validProduct,
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain("同じ名前の商品が既に存在します")
      expect(adapters.findProductByName).toHaveBeenCalledTimes(1)
      expect(adapters.findAllProductTags).not.toHaveBeenCalled()
    })

    it("商品名が空ならエラーを返す", async () => {
      const result = await repository.createProduct({
        product: { ...validProduct, name: "" },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "商品名は1文字以上50文字以内である必要があります",
        )
      expect(adapters.findAllProductTags).not.toHaveBeenCalled()
      expect(adapters.findProductByName).not.toHaveBeenCalled()
    })

    it("タグIDが存在しない場合はエラーを返す", async () => {
      const result = await repository.createProduct({
        product: { ...validProduct, tagIds: [999] },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "タグIDは存在するタグのIDを参照する必要があります",
        )
      expect(adapters.findAllProductTags).toHaveBeenCalledTimes(1)
      expect(adapters.findProductByName).toHaveBeenCalledTimes(1)
    })

    it("タグが20個を超える場合はエラーを返す", async () => {
      const tagIds = Array.from({ length: 21 }, (_, i) => i + 1)
      const result = await repository.createProduct({
        product: { ...validProduct, tagIds },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          `商品タグは${MAX_TAGS_PER_PRODUCT}個以内である必要があります`,
        )
      expect(adapters.findAllProductTags).not.toHaveBeenCalled()
      expect(adapters.findProductByName).not.toHaveBeenCalled()
    })

    it("タグがちょうど20個の場合は正常に作成できる", async () => {
      const tagIds = Array.from({ length: 20 }, (_, i) => i + 1)
      const extendedMockTags = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `タグ${i + 1}`,
      }))
      adapters.findAllProductTags.mockImplementation(async () => ({
        ok: true,
        value: extendedMockTags,
      }))

      adapters.createProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: { ...product, id: 99 },
      }))
      const result = await repository.createProduct({
        product: { ...validProduct, tagIds },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.tagIds.length).toBe(20)
      expect(adapters.findAllProductTags).toHaveBeenCalledTimes(1)
      expect(adapters.findProductByName).toHaveBeenCalledTimes(1)
    })

    it("商品数の上限に達している場合はエラーを返す", async () => {
      adapters.getProductCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: MAX_STORE_PRODUCT_COUNT,
      }))
      const result = await repository.createProduct({
        product: validProduct,
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          `1店舗あたりの商品数は${MAX_STORE_PRODUCT_COUNT}件までです`,
        )

      expect(adapters.getProductCountByStoreId).toHaveBeenCalledTimes(1)
      expect(adapters.findProductByName).not.toHaveBeenCalled()
      expect(adapters.findAllProductTags).not.toHaveBeenCalled()
    })

    it("価格が上限を超える場合はエラーを返す", async () => {
      const result = await repository.createProduct({
        product: { ...validProduct, price: MAX_PRODUCT_PRICE + 1 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          `価格は${MAX_PRODUCT_PRICE}以下である必要があります`,
        )
    })

    it("価格が上限と同じ値の場合は正常に作成できる", async () => {
      adapters.createProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: { ...product, id: 99 },
      }))
      const result = await repository.createProduct({
        product: { ...validProduct, price: MAX_PRODUCT_PRICE },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.price).toBe(MAX_PRODUCT_PRICE)
    })

    it("在庫数が上限を超える場合はエラーを返す", async () => {
      const result = await repository.createProduct({
        product: { ...validProduct, stock: MAX_PRODUCT_STOCK + 1 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          `在庫数は${MAX_PRODUCT_STOCK}以下である必要があります`,
        )
    })

    it("在庫数が上限と同じ値の場合は正常に作成できる", async () => {
      adapters.createProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: { ...product, id: 99 },
      }))

      const result = await repository.createProduct({
        product: { ...validProduct, stock: MAX_PRODUCT_STOCK },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.stock).toBe(MAX_PRODUCT_STOCK)
    })

    it("商品名が50文字を超える場合はエラーを返す", async () => {
      const result = await repository.createProduct({
        product: { ...validProduct, name: "あ".repeat(51) },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "商品名は1文字以上50文字以内である必要があります",
        )
      expect(adapters.findAllProductTags).not.toHaveBeenCalled()
      expect(adapters.findProductByName).not.toHaveBeenCalled()
    })

    it("タグIDに整数以外が含まれる場合はエラーを返す", async () => {
      const result = await repository.createProduct({
        product: { ...validProduct, tagIds: [1.5, 2] },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "タグIDは1以上の整数の配列である必要があります",
        )
      expect(adapters.findAllProductTags).not.toHaveBeenCalled()
      expect(adapters.findProductByName).not.toHaveBeenCalled()
    })

    it("タグIDに1未満の値が含まれる場合はエラーを返す", async () => {
      const result = await repository.createProduct({
        product: { ...validProduct, tagIds: [0, 2] },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "タグIDは1以上の整数の配列である必要があります",
        )
      expect(adapters.findAllProductTags).not.toHaveBeenCalled()
      expect(adapters.findProductByName).not.toHaveBeenCalled()
    })

    it("価格が負の値の場合はエラーを返す", async () => {
      const result = await repository.createProduct({
        product: { ...validProduct, price: -1 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "価格は0以上の整数である必要があります",
        )
    })

    it("価格が整数でない場合はエラーを返す", async () => {
      const result = await repository.createProduct({
        product: { ...validProduct, price: 100.5 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "価格は0以上の整数である必要があります",
        )
    })

    it("在庫数が負の値の場合はエラーを返す", async () => {
      const result = await repository.createProduct({
        product: { ...validProduct, stock: -1 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "在庫数は0以上の整数である必要があります",
        )
    })

    it("在庫数が整数でない場合はエラーを返す", async () => {
      const result = await repository.createProduct({
        product: { ...validProduct, stock: 1.2 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "在庫数は0以上の整数である必要があります",
        )
    })
  })

  describe("updateProduct", () => {
    it("バリデーションを通過した商品を更新できる", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "既存商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({
            id,
            name: `タグ${id}`,
          })),
        }),
      )
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ tagId: id, count: 2 })),
        }),
      )
      adapters.updateProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: applyPartialToDefaultProduct(product),
      }))

      const result = await repository.updateProduct({
        product: { ...validProduct, id: 1 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.id).toBe(1)
      expect(adapters.findAllProductTags).toHaveBeenCalledTimes(1)
      expect(adapters.findProductByName).toHaveBeenCalledTimes(1)
    })

    it("タグカウント取得が失敗した場合は更新を失敗させる", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "既存商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async () => ({ ok: false, message: "エラーが発生しました。" }),
      )
      adapters.updateProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: applyPartialToDefaultProduct(product),
      }))

      const result = await repository.updateProduct({
        product: { id: 1, tagIds: [2, 3] },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      expect(
        adapters.incrementAllProductTagRelationCountsByTagIds,
      ).not.toHaveBeenCalled()
      expect(
        adapters.decrementAllProductTagRelationCountsByTagIds,
      ).not.toHaveBeenCalled()
    })

    it("他の商品と名前が重複している場合はエラーを返す", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "既存商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.findProductByName.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 2,
          name: validProduct.name,
          tagIds: [1],
          price: 500,
          stock: 10,
        },
      }))

      const result = await repository.updateProduct({
        product: { ...validProduct, id: 1 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain("同じ名前の商品が既に存在します")
      expect(adapters.findProductByName).toHaveBeenCalledTimes(1)
      expect(adapters.findAllProductTags).not.toHaveBeenCalled()
    })

    it("自身と同じ名前での更新は許可される", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "既存商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.findProductByName.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: validProduct.name,
          tagIds: [1],
          price: 500,
          stock: 10,
        },
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id: number) => ({
            id,
            name: `タグ${id}`,
          })),
        }),
      )
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ tagId: id, count: 2 })),
        }),
      )
      adapters.updateProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: applyPartialToDefaultProduct(product),
      }))

      const result = await repository.updateProduct({
        product: { ...validProduct, id: 1 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.id).toBe(1)
      expect(adapters.findProductByName).toHaveBeenCalledTimes(1)
      expect(adapters.findAllProductTags).toHaveBeenCalledTimes(1)
    })

    it("タグが更新された際、relationのカウント行が存在する場合にタグが孤立していれば削除される", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "既存商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({
            id,
            name: `タグ${id}`,
          })),
        }),
      )
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({
            tagId: id,
            count: id === 2 ? 0 : 2,
          })),
        }),
      )
      adapters.updateProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: applyPartialToDefaultProduct(product),
      }))

      await repository.updateProduct({
        product: { id: 1, tagIds: [1] },
        dbClient: mockDbClient,
      })

      expect(adapters.deleteAllProductTagsByIds).toHaveBeenCalledTimes(1)
      const calls = adapters.deleteAllProductTagsByIds.mock.calls
      expect(calls[0]?.[0]?.productTag?.ids).toEqual([2])

      expect(adapters.updateProduct).toHaveBeenCalledTimes(1)
      const callOrder: string[] = []
      adapters.updateProduct.mockImplementation(async () => {
        callOrder.push("updateProduct")
        return { ok: true, value: applyPartialToDefaultProduct({ id: 1 }) }
      })
      adapters.deleteAllProductTagsByIds.mockImplementation(async () => {
        callOrder.push("deleteAllProductTagsByIds")
        return { ok: true, value: undefined }
      })

      await repository.updateProduct({
        product: { id: 1, tagIds: [1] },
        dbClient: mockDbClient,
      })
      expect(callOrder).toEqual(["updateProduct", "deleteAllProductTagsByIds"])
    })

    it("タグが更新された際、削除されたタグのrelation行が存在しない場合でも孤立していれば削除される", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "既存商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids
            .filter((id) => id === 1)
            .map((id) => ({ tagId: id, count: 1 })),
        }),
      )
      adapters.updateProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: applyPartialToDefaultProduct(product),
      }))

      await repository.updateProduct({
        product: { id: 1, tagIds: [1] },
        dbClient: mockDbClient,
      })

      expect(adapters.deleteAllProductTagsByIds).toHaveBeenCalledTimes(1)
      const calls = adapters.deleteAllProductTagsByIds.mock.calls
      expect(calls[0]?.[0]?.productTag?.ids).toEqual([2])
    })

    it("deleteOrphanedTags のタグ取得が失敗した場合は更新を中止する", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "既存商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementationOnce(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({
            tagId: id,
            count: id === 2 ? 0 : 2,
          })),
        }),
      )
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementationOnce(
        async () => ({ ok: false, message: "エラーが発生しました。" }),
      )
      adapters.updateProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: applyPartialToDefaultProduct(product),
      }))

      const res = await repository.updateProduct({
        product: { id: 1, tagIds: [1] },
        dbClient: mockDbClient,
      })
      expect(res.ok).toBe(false)
      expect(adapters.deleteAllProductTagsByIds).not.toHaveBeenCalled()
    })

    it("タグが更新された際、孤立したタグが削除され店舗のタグ数が減少する", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "既存商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ id, name: `タグ${id}` })),
        }),
      )
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({
            tagId: id,
            count: id === 2 ? 0 : 2,
          })),
        }),
      )
      adapters.getProductTagCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: 5,
      }))
      adapters.updateProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: applyPartialToDefaultProduct(product),
      }))

      await repository.updateProduct({
        product: { id: 1, tagIds: [1] },
        dbClient: mockDbClient,
      })

      expect(adapters.deleteAllProductTagsByIds).toHaveBeenCalledTimes(1)
      expect(adapters.decrementProductTagCountByStoreId).toHaveBeenCalledTimes(
        1,
      )
      const decCall =
        adapters.decrementProductTagCountByStoreId.mock.calls[0]?.[0]
      expect(decCall?.store.delta).toBe(1)
      expect(decCall?.store.updatedAt).toBeInstanceOf(Date)
    })

    it("タグが更新された際、削除されたタグの商品数のカウントを0とする", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "既存商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ id, name: `タグ${id}` })),
        }),
      )
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ tagId: id, count: 0 })),
        }),
      )
      adapters.updateProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: applyPartialToDefaultProduct(product),
      }))

      await repository.updateProduct({
        product: { id: 1, tagIds: [2] },
        dbClient: mockDbClient,
      })

      expect(
        adapters.decrementAllProductTagRelationCountsByTagIds,
      ).toHaveBeenCalledTimes(1)
      const calls =
        adapters.decrementAllProductTagRelationCountsByTagIds.mock.calls
      const arg = calls[0]?.[0]
      expect(arg?.productTags.map(({ id, delta }) => ({ id, delta }))).toEqual([
        { id: 1, delta: -1 },
      ])
      for (const t of arg?.productTags ?? []) {
        expect(t.updatedAt).toBeInstanceOf(Date)
      }
    })

    it("タグ更新時、削除されたタグが他の商品と紐づいていれば削除しない", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "既存商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({
            id,
            name: `タグ${id}`,
          })),
        }),
      )
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ tagId: id, count: 2 })),
        }),
      )
      adapters.updateProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: applyPartialToDefaultProduct(product),
      }))

      await repository.updateProduct({
        product: { id: 1, tagIds: [1] },
        dbClient: mockDbClient,
      })

      expect(adapters.deleteAllProductTagsByIds).not.toHaveBeenCalled()
    })

    it("更新時に価格が上限を超える場合はエラーを返す", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "既存商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))

      const result = await repository.updateProduct({
        product: { id: 1, price: MAX_PRODUCT_PRICE + 1 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          `価格は${MAX_PRODUCT_PRICE}以下である必要があります`,
        )
    })

    it("更新時に在庫数が上限を超える場合はエラーを返す", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "既存商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))

      const result = await repository.updateProduct({
        product: { id: 1, stock: MAX_PRODUCT_STOCK + 1 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          `在庫数は${MAX_PRODUCT_STOCK}以下である必要があります`,
        )
    })

    it("更新時に商品名が50文字を超える場合はエラーを返す", async () => {
      const result = await repository.updateProduct({
        product: { id: 1, name: "あ".repeat(51) },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "商品名は1文字以上50文字以内である必要があります",
        )
      expect(adapters.findProductById).not.toHaveBeenCalled()
    })

    it("更新時に価格が負の値の場合はエラーを返す", async () => {
      const result = await repository.updateProduct({
        product: { id: 1, price: -5 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "価格は0以上の整数である必要があります",
        )
    })

    it("更新時に価格が整数でない場合はエラーを返す", async () => {
      const result = await repository.updateProduct({
        product: { id: 1, price: 12.34 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "価格は0以上の整数である必要があります",
        )
    })

    it("更新時に在庫数が負の値の場合はエラーを返す", async () => {
      const result = await repository.updateProduct({
        product: { id: 1, stock: -2 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "在庫数は0以上の整数である必要があります",
        )
    })

    it("更新時に在庫数が整数でない場合はエラーを返す", async () => {
      const result = await repository.updateProduct({
        product: { id: 1, stock: 3.14 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "在庫数は0以上の整数である必要があります",
        )
    })

    it("updateProduct でタグの追加・削除があった場合にタグ数が調整される", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: { id: 1, name: "商品", tagIds: [1, 2], price: 1000, stock: 1 },
      }))
      adapters.findAllProductTags.mockImplementation(async () => ({
        ok: true,
        value: [
          { id: 1, name: "タグ1" },
          { id: 2, name: "タグ2" },
          { id: 3, name: "タグ3" },
        ],
      }))
      // existing counts for tags 1,2,3
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({
            tagId: id,
            count: id === 3 ? 0 : 2,
          })),
        }),
      )
      adapters.updateProduct.mockImplementation(async ({ product }) => ({
        ok: true,
        value: {
          id: product.id,
          name: product.name ?? "",
          tagIds: product.tagIds ?? [],
          price: product.price ?? 0,
          stock: product.stock ?? 0,
        },
      }))

      await repository.updateProduct({
        product: { id: 1, tagIds: [2, 3] },
        dbClient: mockDbClient,
      })

      // added: 3 -> +1, removed: 1 -> -1
      expect(
        adapters.incrementAllProductTagRelationCountsByTagIds,
      ).toHaveBeenCalledTimes(1)
      expect(
        adapters.decrementAllProductTagRelationCountsByTagIds,
      ).toHaveBeenCalledTimes(1)
      const incCalls =
        adapters.incrementAllProductTagRelationCountsByTagIds.mock.calls
      const decCalls =
        adapters.decrementAllProductTagRelationCountsByTagIds.mock.calls
      const first = incCalls[0]?.[0]
      const second = decCalls[0]?.[0]
      // check that calls include both increments and decrements
      expect(
        (first?.productTags ?? [])
          .concat(second?.productTags ?? [])
          .map(({ id, delta }) => ({ id, delta })),
      ).toEqual(
        expect.arrayContaining([
          { id: 3, delta: 1 },
          { id: 1, delta: -1 },
        ]),
      )
    })
  })

  describe("deleteProduct", () => {
    it("商品が見つからない場合は正常終了する", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: false,
        message: "商品が見つかりません。",
      }))
      const result = await repository.deleteProduct({
        product: { id: 999 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value).toBe(undefined)
      expect(adapters.deleteProductImageByProductId).not.toHaveBeenCalled()
      expect(adapters.deleteAllProductTagsByIds).not.toHaveBeenCalled()
      expect(adapters.deleteProduct).not.toHaveBeenCalled()
    })

    it("タグカウントの取得が失敗した場合は削除を中止する", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "削除対象商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async () => ({ ok: false, message: "エラーが発生しました。" }),
      )

      const result = await repository.deleteProduct({
        product: { id: 1 },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      // delete should not be called since adjust failed
      expect(adapters.deleteProduct).not.toHaveBeenCalled()
    })

    it("商品削除時にrelationのカウント行が存在しcountが0の場合、タグが孤立していれば削除される", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "削除対象商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({
            id,
            name: `タグ${id}`,
          })),
        }),
      )
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ tagId: id, count: 0 })),
        }),
      )

      await repository.deleteProduct({
        product: { id: 1 },
        dbClient: mockDbClient,
      })

      expect(adapters.deleteProductImageByProductId).toHaveBeenCalledTimes(1)
      expect(adapters.deleteAllProductTagsByIds).toHaveBeenCalledTimes(1)
      const calls = adapters.deleteAllProductTagsByIds.mock.calls
      expect(calls[0]?.[0]?.productTag?.ids).toEqual([1, 2])

      expect(adapters.deleteProduct).toHaveBeenCalledTimes(1)
      const callOrder: string[] = []
      adapters.deleteProduct.mockImplementation(async () => {
        callOrder.push("deleteProduct")
        return { ok: true, value: undefined }
      })
      adapters.deleteAllProductTagsByIds.mockImplementation(async () => {
        callOrder.push("deleteAllProductTagsByIds")
        return { ok: true, value: undefined }
      })

      await repository.deleteProduct({
        product: { id: 1 },
        dbClient: mockDbClient,
      })
      expect(callOrder).toEqual(["deleteProduct", "deleteAllProductTagsByIds"])
    })

    it("商品削除時に孤立していないタグは削除されない", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "削除対象商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({
            id,
            name: `タグ${id}`,
          })),
        }),
      )
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ tagId: id, count: 2 })),
        }),
      )

      await repository.deleteProduct({
        product: { id: 1 },
        dbClient: mockDbClient,
      })

      expect(adapters.deleteAllProductTagsByIds).not.toHaveBeenCalled()
      expect(adapters.deleteProductImageByProductId).toHaveBeenCalledTimes(1)
    })

    it("deleteOrphanedTags のタグ取得が失敗した場合は削除後にエラーを返す", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "削除対象商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementationOnce(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({
            tagId: id,
            count: id === 2 ? 0 : 2,
          })),
        }),
      )
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementationOnce(
        async () => ({ ok: false, message: "エラーが発生しました。" }),
      )

      adapters.deleteProduct.mockImplementation(async () => ({
        ok: true,
        value: undefined,
      }))

      const res = await repository.deleteProduct({
        product: { id: 1 },
        dbClient: mockDbClient,
      })
      expect(res.ok).toBe(false)
      expect(adapters.deleteProduct).toHaveBeenCalledTimes(1)
    })

    it("商品削除時に削除されたタグのrelation行が存在しない場合でも孤立していれば削除される", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "削除対象商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ id, name: `タグ${id}` })),
        }),
      )
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids
            .filter((id) => id === 1)
            .map((id) => ({ tagId: id, count: 1 })),
        }),
      )

      await repository.deleteProduct({
        product: { id: 1 },
        dbClient: mockDbClient,
      })

      expect(adapters.deleteAllProductTagsByIds).toHaveBeenCalledTimes(1)
      const calls = adapters.deleteAllProductTagsByIds.mock.calls
      expect(calls[0]?.[0]?.productTag?.ids).toEqual([2])
    })

    it("商品の削除時に商品数取得エラーが発生したら処理を中止する", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "削除対象商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.getProductCountByStoreId.mockImplementation(async () => {
        throw new Error("db error")
      })
      let threw2 = false
      try {
        await repository.deleteProduct({
          product: { id: 1 },
          dbClient: mockDbClient,
        })
      } catch {
        threw2 = true
      }
      expect(threw2).toBe(true)
      expect(adapters.deleteProduct).not.toHaveBeenCalled()
    })

    it("商品の削除時に商品数更新エラーが発生したら処理を中止する", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "削除対象商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.getProductCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: 1,
      }))
      adapters.decrementProductCountByStoreId.mockImplementation(async () => {
        throw new Error("db error")
      })
      let threw3 = false
      try {
        await repository.deleteProduct({
          product: { id: 1 },
          dbClient: mockDbClient,
        })
      } catch {
        threw3 = true
      }
      expect(threw3).toBe(true)
      expect(adapters.deleteProduct).not.toHaveBeenCalled()
    })

    it("商品削除時に店舗の商品数が0以下なら商品数のカウントを0とする", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "削除対象商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 5,
        },
      }))
      adapters.getProductCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: 0,
      }))
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ tagId: id, count: 1 })),
        }),
      )

      await repository.deleteProduct({
        product: { id: 1 },
        dbClient: mockDbClient,
      })
      expect(adapters.decrementProductCountByStoreId).toHaveBeenCalledTimes(1)
      const decCall = adapters.decrementProductCountByStoreId.mock.calls[0]?.[0]
      expect(decCall?.store.delta).toBe(1)
      expect(decCall?.store.updatedAt).toBeInstanceOf(Date)
    })

    it("商品削除時に店舗の商品数とタグごとの商品数が更新される", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "削除対象商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 1,
        },
      }))
      adapters.getProductCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: 5,
      }))
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ tagId: id, count: 2 })),
        }),
      )

      await repository.deleteProduct({
        product: { id: 1 },
        dbClient: mockDbClient,
      })
      expect(adapters.decrementProductCountByStoreId).toHaveBeenCalledTimes(1)
      const decCall = adapters.decrementProductCountByStoreId.mock.calls[0]?.[0]
      expect(decCall?.store.delta).toBe(1)
      expect(decCall?.store.updatedAt).toBeInstanceOf(Date)

      expect(
        adapters.decrementAllProductTagRelationCountsByTagIds,
      ).toHaveBeenCalledTimes(1)
      const tagsCall =
        adapters.decrementAllProductTagRelationCountsByTagIds.mock.calls[0]?.[0]
      expect(
        tagsCall?.productTags.map(({ id, delta }) => ({ id, delta })),
      ).toEqual([
        { id: 1, delta: -1 },
        { id: 2, delta: -1 },
      ])
      for (const t of tagsCall?.productTags ?? []) {
        expect(t.updatedAt).toBeInstanceOf(Date)
      }
    })

    it("タグを持たない商品を削除した場合、店舗の商品数のみが更新される", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "削除対象商品",
          tagIds: [],
          price: 1000,
          stock: 1,
        },
      }))
      adapters.getProductCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: 5,
      }))

      await repository.deleteProduct({
        product: { id: 1 },
        dbClient: mockDbClient,
      })

      expect(adapters.decrementProductCountByStoreId).toHaveBeenCalledTimes(1)
      expect(adapters.deleteAllProductTagsByIds).not.toHaveBeenCalled()
    })

    it("商品の削除時に商品数取得に失敗したら処理を中止する", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "削除対象商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 1,
        },
      }))
      adapters.getProductCountByStoreId.mockImplementation(async () => ({
        ok: false,
        message: "エラーが発生しました。",
      }))
      const res = await repository.deleteProduct({
        product: { id: 1 },
        dbClient: mockDbClient,
      })
      expect(res.ok).toBe(false)
      expect(adapters.deleteProduct).not.toHaveBeenCalled()
    })

    it("商品の削除時に商品数更新に失敗したら処理を中止する", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        ok: true,
        value: {
          id: 1,
          name: "削除対象商品",
          tagIds: [1, 2],
          price: 1000,
          stock: 1,
        },
      }))
      adapters.getProductCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: 2,
      }))
      adapters.decrementProductCountByStoreId.mockImplementation(async () => {
        throw new Error("db error")
      })
      adapters.getAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) => ({
          ok: true,
          value: productTag.ids.map((id) => ({ tagId: id, count: 2 })),
        }),
      )
      let threw2 = false
      try {
        await repository.deleteProduct({
          product: { id: 1 },
          dbClient: mockDbClient,
        })
      } catch {
        threw2 = true
      }
      expect(threw2).toBe(true)
      expect(adapters.deleteProduct).not.toHaveBeenCalled()
    })
  })

  describe("createProductTag", () => {
    const validTag: Omit<ProductTag, "id"> = {
      name: "新しいタグ",
    }

    it("バリデーションを通過したタグを作成できる", async () => {
      adapters.createProductTag.mockImplementation(async ({ productTag }) => ({
        ok: true,
        value: { ...productTag, id: 123 },
      }))

      const result = await repository.createProductTag({
        productTag: validTag,
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.name).toBe(validTag.name)
        expect(result.value.id).toBe(123)
      }
    })

    it("タグ作成時に店舗のタグ数が更新される", async () => {
      adapters.getProductTagCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: 2,
      }))
      adapters.createProductTag.mockImplementation(async ({ productTag }) => ({
        ok: true,
        value: { ...productTag, id: 123 },
      }))
      const createResult = await repository.createProductTag({
        productTag: { name: "新しいタグ" },
        dbClient: mockDbClient,
      })
      expect(createResult.ok).toBe(true)
      expect(adapters.incrementProductTagCountByStoreId).toHaveBeenCalledTimes(
        1,
      )
      const incCall =
        adapters.incrementProductTagCountByStoreId.mock.calls[0]?.[0]
      expect(incCall?.store.delta).toBe(1)
      expect(incCall?.store.updatedAt).toBeInstanceOf(Date)
    })

    it("タグ作成時にタグ数取得が失敗した場合は処理を中止する", async () => {
      adapters.getProductTagCountByStoreId.mockImplementation(async () => ({
        ok: false,
        message: "エラーが発生しました。",
      }))
      adapters.createProductTag.mockImplementation(async ({ productTag }) => ({
        ok: true,
        value: { ...productTag, id: 123 },
      }))
      const result = await repository.createProductTag({
        productTag: { name: "新しいタグ" },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      expect(adapters.incrementProductTagCountByStoreId).not.toHaveBeenCalled()
    })

    it("タグ作成時にタグ数更新が失敗した場合は処理を中止する", async () => {
      adapters.getProductTagCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: 2,
      }))
      adapters.createProductTag.mockImplementation(async ({ productTag }) => ({
        ok: true,
        value: { ...productTag, id: 123 },
      }))
      adapters.incrementProductTagCountByStoreId.mockImplementation(
        async () => {
          throw new Error("db error")
        },
      )
      await expect(
        repository.createProductTag({
          productTag: { name: "新しいタグ" },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("db error")
      expect(adapters.incrementProductTagCountByStoreId).toHaveBeenCalledTimes(
        1,
      )
    })

    it("タグ名が空ならエラーを返す", async () => {
      const result = await repository.createProductTag({
        productTag: { name: "" },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "タグ名は1文字以上50文字以内である必要があります",
        )
    })

    it("タグ数の上限に達している場合はエラーを返す", async () => {
      adapters.getProductTagCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: MAX_STORE_PRODUCT_TAG_COUNT,
      }))
      const result = await repository.createProductTag({
        productTag: validTag,
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          `1店舗あたりの商品タグは${MAX_STORE_PRODUCT_TAG_COUNT}個までです`,
        )
      expect(adapters.getProductTagCountByStoreId).toHaveBeenCalledTimes(1)
    })

    it("タグ名が51文字以上ならエラーを返す", async () => {
      const result = await repository.createProductTag({
        productTag: { name: "あ".repeat(51) },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "タグ名は1文字以上50文字以内である必要があります",
        )
    })
  })

  describe("createProductImage", () => {
    const validProductImage: Omit<ProductImage, "id"> = {
      productId: 1,
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/png",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it("バリデーションを通過した画像を作成できる", async () => {
      adapters.createProductImage.mockImplementation(
        async ({ productImage }) => ({
          ok: true,
          value: { ...productImage, id: 99 },
        }),
      )

      const result = await repository.createProductImage({
        productImage: validProductImage,
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.mimeType).toBe(validProductImage.mimeType)
        expect(result.value.data).toBe(validProductImage.data)
        expect(result.value.productId).toBe(validProductImage.productId)
      }
    })

    it("画像のMIMEタイプが許可されていない場合はエラーを返す", async () => {
      const result = await repository.createProductImage({
        productImage: {
          ...validProductImage,
          // @ts-expect-error
          mimeType: "image/bmp",
        },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります",
        )
    })

    it("画像データの形式が不正な場合はエラーを返す", async () => {
      const result = await repository.createProductImage({
        productImage: {
          ...validProductImage,
          data: "!!!invalid base64!!!",
        },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain("画像データの形式が不正です")
    })

    it("作成時に画像データのサイズが7.5MBを超える場合はエラーを返す", async () => {
      const oversizedData = "A".repeat(7.5 * 1024 * 1024 + 1)
      const result = await repository.createProductImage({
        productImage: {
          ...validProductImage,
          data: oversizedData,
        },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "画像データのサイズは約7.5MB以内である必要があります",
        )
    })

    const defaultProductImage: ProductImage = {
      id: 1,
      productId: 1,
      data: validProductImage.data,
      mimeType: validProductImage.mimeType,
      createdAt: validProductImage.createdAt,
      updatedAt: validProductImage.updatedAt,
    }

    const applyPartialToDefaultProductImage = (
      partialProductImage: Partial<
        Pick<ProductImage, "data" | "mimeType" | "updatedAt">
      > &
        Partial<ProductImage>,
    ) => Object.assign({}, defaultProductImage, partialProductImage)

    it("バリデーションを通過した画像を更新できる", async () => {
      adapters.updateProductImageByProductId.mockImplementation(
        async ({ productImage }) => ({
          ok: true,
          value: applyPartialToDefaultProductImage({ id: 1, ...productImage }),
        }),
      )

      const result = await repository.updateProductImageByProductId({
        productImage: {
          productId: 1,
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          mimeType: "image/jpeg",
          updatedAt: new Date(),
        },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.mimeType).toBe("image/jpeg")
    })

    it("dataのみを更新できる", async () => {
      adapters.updateProductImageByProductId.mockImplementation(
        async ({ productImage }) => ({
          ok: true,
          value: applyPartialToDefaultProductImage({ id: 1, ...productImage }),
        }),
      )

      const result = await repository.updateProductImageByProductId({
        productImage: {
          productId: 1,
          data: "anotherBase64EncodedImageData",
          updatedAt: new Date(),
        },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(true)
      if (result.ok)
        expect(result.value.data).toBe("anotherBase64EncodedImageData")
    })

    it("mimeTypeのみを更新できる", async () => {
      adapters.updateProductImageByProductId.mockImplementation(
        async ({ productImage }) => ({
          ok: true,
          value: applyPartialToDefaultProductImage({ id: 1, ...productImage }),
        }),
      )

      const result = await repository.updateProductImageByProductId({
        productImage: {
          productId: 1,
          mimeType: "image/webp",
          updatedAt: new Date(),
        },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.mimeType).toBe("image/webp")
    })

    it("更新時に画像のMIMEタイプが許可されていない場合はエラーを返す", async () => {
      const result = await repository.updateProductImageByProductId({
        productImage: {
          productId: 1,
          // @ts-expect-error
          mimeType: "image/tiff",
          updatedAt: new Date(),
        },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります",
        )
    })

    it("更新時に画像データの形式が不正な場合はエラーを返す", async () => {
      const result = await repository.updateProductImageByProductId({
        productImage: {
          productId: 1,
          data: "not base64 at all!!!",
          updatedAt: new Date(),
        },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain("画像データの形式が不正です")
    })

    it("更新時に画像データのサイズが7.5MBを超える場合はエラーを返す", async () => {
      const oversizedData = "A".repeat(7.5 * 1024 * 1024 + 1)
      const result = await repository.updateProductImageByProductId({
        productImage: {
          productId: 1,
          data: oversizedData,
          updatedAt: new Date(),
        },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.message).toContain(
          "画像データのサイズは約7.5MB以内である必要があります",
        )
    })
  })

  describe("deleteProductImageByProductId", () => {
    it("productIdで画像を削除できる", async () => {
      adapters.deleteProductImageByProductId.mockImplementation(async () => ({
        ok: true,
        value: undefined,
      }))

      await repository.deleteProductImageByProductId({
        productImage: {
          productId: 1,
        },
        dbClient: mockDbClient,
      })

      expect(adapters.deleteProductImageByProductId).toHaveBeenCalledTimes(1)
    })
  })

  describe("deleteAllProductTagsByIds", () => {
    it("タグ削除時に店舗のタグ数が減少する", async () => {
      adapters.getProductTagCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: 5,
      }))
      const deleteResult = await repository.deleteAllProductTagsByIds({
        productTag: { ids: [1, 2] },
        dbClient: mockDbClient,
      })
      expect(deleteResult.ok).toBe(true)
      expect(adapters.decrementProductTagCountByStoreId).toHaveBeenCalledTimes(
        1,
      )
      const decCall2 =
        adapters.decrementProductTagCountByStoreId.mock.calls[0]?.[0]
      expect(decCall2?.store.delta).toBe(2)
      expect(decCall2?.store.updatedAt).toBeInstanceOf(Date)
    })

    it("タグ削除時にタグ数取得が失敗した場合は処理を中止する", async () => {
      adapters.getProductTagCountByStoreId.mockImplementation(async () => ({
        ok: false,
        message: "エラーが発生しました。",
      }))
      adapters.deleteAllProductTagsByIds.mockImplementation(async () => ({
        ok: true,
        value: undefined,
      }))
      const result = await repository.deleteAllProductTagsByIds({
        productTag: { ids: [1, 2] },
        dbClient: mockDbClient,
      })
      expect(result.ok).toBe(false)
      expect(adapters.decrementProductTagCountByStoreId).not.toHaveBeenCalled()
    })

    it("タグ削除時にタグ数更新が失敗した場合は処理を中止する", async () => {
      adapters.getProductTagCountByStoreId.mockImplementation(async () => ({
        ok: true,
        value: 5,
      }))
      adapters.deleteAllProductTagsByIds.mockImplementation(async () => ({
        ok: true,
        value: undefined,
      }))
      adapters.decrementProductTagCountByStoreId.mockImplementation(
        async () => {
          throw new Error("db error")
        },
      )
      await expect(
        repository.deleteAllProductTagsByIds({
          productTag: { ids: [1, 2] },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("db error")
      expect(adapters.decrementProductTagCountByStoreId).toHaveBeenCalledTimes(
        1,
      )
    })
  })
})
