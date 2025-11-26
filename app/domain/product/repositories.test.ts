import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  mock,
} from "bun:test"
import type { TransactionDbClient } from "../../infrastructure/db/client"
import {
  MAX_PRODUCT_PRICE,
  MAX_PRODUCT_STOCK,
  MAX_STORE_PRODUCT_COUNT,
  MAX_STORE_PRODUCT_TAG_COUNT,
} from "./constants"
import type Product from "./entities/product"
import type ProductImage from "./entities/productImage"
import type ProductTag from "./entities/productTag"
import { createRepositories, type Repositories } from "./repositories"

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
): Product => Object.assign({}, defaultProduct, partialProduct) as Product

type MockRepositories = {
  [K in keyof Repositories]: Mock<Repositories[K]>
}

describe("Product repositories", () => {
  const mockDbClient = {} as TransactionDbClient
  let adapters: MockRepositories
  let repositories: Repositories

  beforeEach(() => {
    adapters = {
      findProductById: mock(async () => null),
      findProductByName: mock(async () => null),
      findAllProductsByIds: mock(async () => []),
      findAllProductsOrderByIdAsc: mock(async () => []),
      findAllProductsOrderByIdDesc: mock(async () => []),
      findAllProductStocks: mock(async () => []),
      findProductTagById: mock(async () => null),
      findAllProductTags: mock(async () => mockTags),
      findAllProductTagsByIds: mock(async () => []),
      countProducts: mock(async () => 0),
      findAllProductTagRelationCountsByTagIds: mock(async () => []),
      countProductTags: mock(async () => 0),
      findProductImageByProductId: mock(async () => null),
      createProduct: mock(async ({ product }) => ({
        ...product,
        id: 99,
      })),
      updateProduct: mock(async () => null),
      deleteProduct: mock(async () => {
        null
      }),
      createProductTag: mock(async ({ productTag }) => ({
        ...productTag,
        id: 99,
      })),
      deleteAllProductTagsByIds: mock(async () => {
        null
      }),
      createProductImage: mock(async () => null),
      updateProductImageByProductId: mock(async () => null),
      deleteProductImageByProductId: mock(async () => {}),
    }
    repositories = createRepositories(adapters)
  })

  afterEach(() => {
    mock.restore()
  })
  describe("createProduct", () => {
    it("バリデーションを通過した商品を作成できる", async () => {
      const result = await repositories.createProduct({
        product: validProduct,
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.name).toBe(validProduct.name)
      expect(adapters.findAllProductTags).toHaveBeenCalledTimes(1)
      expect(adapters.findProductByName).toHaveBeenCalledTimes(1)
    })

    it("商品名が既に存在する場合はエラーを返す", async () => {
      adapters.findProductByName.mockImplementation(async () => ({
        id: 1,
        name: validProduct.name,
        tagIds: [1],
        price: 500,
        stock: 10,
      }))

      await expect(
        repositories.createProduct({
          product: validProduct,
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("同じ名前の商品が既に存在します")
      expect(adapters.findProductByName).toHaveBeenCalledTimes(1)
      expect(adapters.findAllProductTags).not.toHaveBeenCalled()
    })

    it("商品名が空ならエラーを返す", async () => {
      await expect(
        repositories.createProduct({
          product: { ...validProduct, name: "" },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("商品名は1文字以上50文字以内である必要があります")
      expect(adapters.findAllProductTags).not.toHaveBeenCalled()
      expect(adapters.findProductByName).not.toHaveBeenCalled()
    })

    it("タグIDが存在しない場合はエラーを返す", async () => {
      await expect(
        repositories.createProduct({
          product: { ...validProduct, tagIds: [999] },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("タグIDは存在するタグのIDを参照する必要があります")
      expect(adapters.findAllProductTags).toHaveBeenCalledTimes(1)
      expect(adapters.findProductByName).toHaveBeenCalledTimes(1)
    })

    it("タグが20個を超える場合はエラーを返す", async () => {
      const tagIds = Array.from({ length: 21 }, (_, i) => i + 1)
      await expect(
        repositories.createProduct({
          product: { ...validProduct, tagIds },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("商品タグは20個以内である必要があります")
      expect(adapters.findAllProductTags).not.toHaveBeenCalled()
      expect(adapters.findProductByName).not.toHaveBeenCalled()
    })

    it("タグがちょうど20個の場合は正常に作成できる", async () => {
      const tagIds = Array.from({ length: 20 }, (_, i) => i + 1)
      const extendedMockTags = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `タグ${i + 1}`,
      }))
      adapters.findAllProductTags.mockImplementation(
        async () => extendedMockTags,
      )

      adapters.createProduct.mockImplementation(async ({ product }) => ({
        ...product,
        id: 99,
      }))
      const result = await repositories.createProduct({
        product: { ...validProduct, tagIds },
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.tagIds.length).toBe(20)
      expect(adapters.findAllProductTags).toHaveBeenCalledTimes(1)
      expect(adapters.findProductByName).toHaveBeenCalledTimes(1)
    })

    it("商品数の上限に達している場合はエラーを返す", async () => {
      adapters.countProducts.mockImplementation(
        async () => MAX_STORE_PRODUCT_COUNT,
      )
      await expect(
        repositories.createProduct({
          product: validProduct,
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow(
        `1店舗あたりの商品数は${MAX_STORE_PRODUCT_COUNT}件までです`,
      )

      expect(adapters.countProducts).toHaveBeenCalledTimes(1)
      expect(adapters.findProductByName).not.toHaveBeenCalled()
      expect(adapters.findAllProductTags).not.toHaveBeenCalled()
    })

    it("価格が上限を超える場合はエラーを返す", async () => {
      await expect(
        repositories.createProduct({
          product: { ...validProduct, price: MAX_PRODUCT_PRICE + 1 },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow(`価格は${MAX_PRODUCT_PRICE}以下である必要があります`)
    })

    it("価格が上限と同じ値の場合は正常に作成できる", async () => {
      adapters.createProduct.mockImplementation(async ({ product }) => ({
        ...product,
        id: 99,
      }))
      const result = await repositories.createProduct({
        product: { ...validProduct, price: MAX_PRODUCT_PRICE },
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.price).toBe(MAX_PRODUCT_PRICE)
    })

    it("在庫数が上限を超える場合はエラーを返す", async () => {
      await expect(
        repositories.createProduct({
          product: { ...validProduct, stock: MAX_PRODUCT_STOCK + 1 },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow(`在庫数は${MAX_PRODUCT_STOCK}以下である必要があります`)
    })

    it("在庫数が上限と同じ値の場合は正常に作成できる", async () => {
      adapters.createProduct.mockImplementation(async ({ product }) => ({
        ...product,
        id: 99,
      }))

      const result = await repositories.createProduct({
        product: { ...validProduct, stock: MAX_PRODUCT_STOCK },
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.stock).toBe(MAX_PRODUCT_STOCK)
    })
  })

  describe("updateProduct", () => {
    it("バリデーションを通過した商品を更新できる", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        id: 1,
        name: "既存商品",
        tagIds: [1, 2],
        price: 1000,
        stock: 5,
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) =>
          productTag.ids.map((id: number) => ({
            id,
            name: `タグ${id}`,
          })),
      )
      adapters.findAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) =>
          productTag.ids.map((id: number) => ({
            tagId: id,
            count: 2,
          })),
      )
      adapters.updateProduct.mockImplementation(async ({ product }) =>
        applyPartialToDefaultProduct(product as Product),
      )

      const result = await repositories.updateProduct({
        product: { ...validProduct, id: 1 },
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.id).toBe(1)
      expect(adapters.findAllProductTags).toHaveBeenCalledTimes(1)
      expect(adapters.findProductByName).toHaveBeenCalledTimes(1)
    })

    it("他の商品と名前が重複している場合はエラーを返す", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        id: 1,
        name: "既存商品",
        tagIds: [1, 2],
        price: 1000,
        stock: 5,
      }))
      adapters.findProductByName.mockImplementation(async () => ({
        id: 2,
        name: validProduct.name,
        tagIds: [1],
        price: 500,
        stock: 10,
      }))

      await expect(
        repositories.updateProduct({
          product: { ...validProduct, id: 1 },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("同じ名前の商品が既に存在します")
      expect(adapters.findProductByName).toHaveBeenCalledTimes(1)
      expect(adapters.findAllProductTags).not.toHaveBeenCalled()
    })

    it("自身と同じ名前での更新は許可される", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        id: 1,
        name: "既存商品",
        tagIds: [1, 2],
        price: 1000,
        stock: 5,
      }))
      adapters.findProductByName.mockImplementation(async () => ({
        id: 1,
        name: validProduct.name,
        tagIds: [1],
        price: 500,
        stock: 10,
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) =>
          productTag.ids.map((id: number) => ({
            id,
            name: `タグ${id}`,
          })),
      )
      adapters.findAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) =>
          productTag.ids.map((id: number) => ({
            tagId: id,
            count: 2,
          })),
      )
      adapters.updateProduct.mockImplementation(async ({ product }) =>
        applyPartialToDefaultProduct(product as Product),
      )

      const result = await repositories.updateProduct({
        product: { ...validProduct, id: 1 },
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.id).toBe(1)
      expect(adapters.findProductByName).toHaveBeenCalledTimes(1)
      expect(adapters.findAllProductTags).toHaveBeenCalledTimes(1)
    })

    it("タグが更新された際、削除されたタグが孤立していれば削除される", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        id: 1,
        name: "既存商品",
        tagIds: [1, 2],
        price: 1000,
        stock: 5,
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) =>
          productTag.ids.map((id: number) => ({ id, name: `タグ${id}` })),
      )
      adapters.findAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) =>
          productTag.ids.map((id: number) => ({
            tagId: id,
            count: id === 2 ? 1 : 2,
          })),
      )
      adapters.updateProduct.mockImplementation(async ({ product }) =>
        applyPartialToDefaultProduct(product as Product),
      )

      await repositories.updateProduct({
        product: { id: 1, tagIds: [1] },
        dbClient: mockDbClient,
      })

      expect(adapters.deleteAllProductTagsByIds).toHaveBeenCalledTimes(1)
      const calls = adapters.deleteAllProductTagsByIds.mock.calls
      expect(calls[0]?.[0]?.productTag?.ids).toEqual([2])
    })

    it("タグ更新時、削除されたタグが他の商品と紐づいていれば削除しない", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        id: 1,
        name: "既存商品",
        tagIds: [1, 2],
        price: 1000,
        stock: 5,
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) =>
          productTag.ids.map((id: number) => ({
            id,
            name: `タグ${id}`,
          })),
      )
      adapters.findAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) =>
          productTag.ids.map((id: number) => ({
            tagId: id,
            count: 2,
          })),
      )
      adapters.updateProduct.mockImplementation(async ({ product }) =>
        applyPartialToDefaultProduct(product as Product),
      )

      await repositories.updateProduct({
        product: { id: 1, tagIds: [1] },
        dbClient: mockDbClient,
      })

      expect(adapters.deleteAllProductTagsByIds).not.toHaveBeenCalled()
    })

    it("更新時に価格が上限を超える場合はエラーを返す", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        id: 1,
        name: "既存商品",
        tagIds: [1, 2],
        price: 1000,
        stock: 5,
      }))

      await expect(
        repositories.updateProduct({
          product: { id: 1, price: MAX_PRODUCT_PRICE + 1 },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow(`価格は${MAX_PRODUCT_PRICE}以下である必要があります`)
    })

    it("更新時に在庫数が上限を超える場合はエラーを返す", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        id: 1,
        name: "既存商品",
        tagIds: [1, 2],
        price: 1000,
        stock: 5,
      }))

      await expect(
        repositories.updateProduct({
          product: { id: 1, stock: MAX_PRODUCT_STOCK + 1 },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow(`在庫数は${MAX_PRODUCT_STOCK}以下である必要があります`)
    })
  })

  describe("deleteProduct", () => {
    it("商品が見つからない場合はエラーを返す", async () => {
      adapters.findProductById.mockImplementation(async () => null)

      await expect(
        repositories.deleteProduct({
          product: { id: 999 },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("商品が見つかりません")
    })

    it("商品削除時に孤立したタグが削除される", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        id: 1,
        name: "削除対象商品",
        tagIds: [1, 2],
        price: 1000,
        stock: 5,
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) =>
          productTag.ids.map((id: number) => ({ id, name: `タグ${id}` })),
      )
      adapters.findAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) =>
          productTag.ids.map((id: number) => ({ tagId: id, count: 1 })),
      )

      await repositories.deleteProduct({
        product: { id: 1 },
        dbClient: mockDbClient,
      })

      expect(adapters.deleteProductImageByProductId).toHaveBeenCalledTimes(1)
      expect(adapters.deleteAllProductTagsByIds).toHaveBeenCalledTimes(1)
      const calls = adapters.deleteAllProductTagsByIds.mock.calls
      expect(calls[0]?.[0]?.productTag?.ids).toEqual([1, 2])
    })

    it("商品削除時に孤立していないタグは削除されない", async () => {
      adapters.findProductById.mockImplementation(async () => ({
        id: 1,
        name: "削除対象商品",
        tagIds: [1, 2],
        price: 1000,
        stock: 5,
      }))
      adapters.findAllProductTagsByIds.mockImplementation(
        async ({ productTag }) =>
          productTag.ids.map((id: number) => ({ id, name: `タグ${id}` })),
      )
      adapters.findAllProductTagRelationCountsByTagIds.mockImplementation(
        async ({ productTag }) =>
          productTag.ids.map((id: number) => ({ tagId: id, count: 2 })),
      )

      await repositories.deleteProduct({
        product: { id: 1 },
        dbClient: mockDbClient,
      })

      expect(adapters.deleteAllProductTagsByIds).not.toHaveBeenCalled()
      expect(adapters.deleteProductImageByProductId).toHaveBeenCalledTimes(1)
    })
  })

  describe("createProductTag", () => {
    const validTag: Omit<ProductTag, "id"> = {
      name: "新しいタグ",
    }

    it("バリデーションを通過したタグを作成できる", async () => {
      adapters.createProductTag.mockImplementation(async ({ productTag }) => ({
        ...productTag,
        id: 123,
      }))

      const result = await repositories.createProductTag({
        productTag: validTag,
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.name).toBe(validTag.name)
      expect(result?.id).toBe(123)
    })

    it("タグ名が空ならエラーを返す", async () => {
      await expect(
        repositories.createProductTag({
          productTag: { name: "" },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("タグ名は1文字以上50文字以内である必要があります")
    })

    it("タグ数の上限に達している場合はエラーを返す", async () => {
      adapters.countProductTags.mockImplementation(
        async () => MAX_STORE_PRODUCT_TAG_COUNT,
      )

      await expect(
        repositories.createProductTag({
          productTag: validTag,
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow(
        `1店舗あたりの商品タグは${MAX_STORE_PRODUCT_TAG_COUNT}個までです`,
      )
      expect(adapters.countProductTags).toHaveBeenCalledTimes(1)
    })

    it("タグ名が51文字以上ならエラーを返す", async () => {
      await expect(
        repositories.createProductTag({
          productTag: { name: "あ".repeat(51) },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("タグ名は1文字以上50文字以内である必要があります")
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
          ...productImage,
          id: 99,
        }),
      )

      const result = await repositories.createProductImage({
        productImage: validProductImage,
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.mimeType).toBe(validProductImage.mimeType)
      expect(result?.data).toBe(validProductImage.data)
      expect(result?.productId).toBe(validProductImage.productId)
    })

    it("画像のMIMEタイプが許可されていない場合はエラーを返す", async () => {
      await expect(
        repositories.createProductImage({
          productImage: {
            ...validProductImage,
            mimeType: "image/bmp",
          },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow(
        "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります",
      )
    })

    it("画像データの形式が不正な場合はエラーを返す", async () => {
      await expect(
        repositories.createProductImage({
          productImage: {
            ...validProductImage,
            data: "!!!invalid base64!!!",
          },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("画像データの形式が不正です")
    })

    it("画像データのサイズが7.5MBを超える場合はエラーを返す", async () => {
      const oversizedData = "A".repeat(7.5 * 1024 * 1024 + 1)
      await expect(
        repositories.createProductImage({
          productImage: {
            ...validProductImage,
            data: oversizedData,
          },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("画像データのサイズは約7.5MB以内である必要があります")
    })
  })

  describe("updateProductImageByProductId", () => {
    const defaultProductImage: ProductImage = {
      id: 1,
      productId: 1,
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/png",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const applyPartialToDefaultProductImage = (
      partialProductImage: Pick<ProductImage, "id"> &
        Partial<Omit<ProductImage, "id">>,
    ): ProductImage =>
      Object.assign(
        {},
        defaultProductImage,
        partialProductImage,
      ) as ProductImage

    it("バリデーションを通過した画像を更新できる", async () => {
      adapters.updateProductImageByProductId.mockImplementation(
        async ({ productImage }) =>
          applyPartialToDefaultProductImage({ id: 1, ...productImage }),
      )

      const result = await repositories.updateProductImageByProductId({
        productImage: {
          productId: 1,
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          mimeType: "image/jpeg",
          updatedAt: new Date(),
        },
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.mimeType).toBe("image/jpeg")
    })

    it("dataのみを更新できる", async () => {
      adapters.updateProductImageByProductId.mockImplementation(
        async ({ productImage }) =>
          applyPartialToDefaultProductImage({ id: 1, ...productImage }),
      )

      const result = await repositories.updateProductImageByProductId({
        productImage: {
          productId: 1,
          data: "anotherBase64EncodedImageData",
          updatedAt: new Date(),
        },
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.data).toBe("anotherBase64EncodedImageData")
    })

    it("mimeTypeのみを更新できる", async () => {
      adapters.updateProductImageByProductId.mockImplementation(
        async ({ productImage }) =>
          applyPartialToDefaultProductImage({ id: 1, ...productImage }),
      )

      const result = await repositories.updateProductImageByProductId({
        productImage: {
          productId: 1,
          mimeType: "image/webp",
          updatedAt: new Date(),
        },
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.mimeType).toBe("image/webp")
    })

    it("更新時に画像のMIMEタイプが許可されていない場合はエラーを返す", async () => {
      await expect(
        repositories.updateProductImageByProductId({
          productImage: {
            productId: 1,
            mimeType: "image/tiff",
            updatedAt: new Date(),
          },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow(
        "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります",
      )
    })

    it("更新時に画像データの形式が不正な場合はエラーを返す", async () => {
      await expect(
        repositories.updateProductImageByProductId({
          productImage: {
            productId: 1,
            data: "not base64 at all!!!",
            updatedAt: new Date(),
          },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("画像データの形式が不正です")
    })

    it("更新時に画像データのサイズが7.5MBを超える場合はエラーを返す", async () => {
      const oversizedData = "A".repeat(7.5 * 1024 * 1024 + 1)
      await expect(
        repositories.updateProductImageByProductId({
          productImage: {
            productId: 1,
            data: oversizedData,
            updatedAt: new Date(),
          },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("画像データのサイズは約7.5MB以内である必要があります")
    })
  })

  describe("deleteProductImageByProductId", () => {
    it("productIdで画像を削除できる", async () => {
      adapters.deleteProductImageByProductId.mockImplementation(async () => {
        return undefined
      })

      await repositories.deleteProductImageByProductId({
        productImage: {
          productId: 1,
        },
        dbClient: mockDbClient,
      })

      expect(adapters.deleteProductImageByProductId).toHaveBeenCalledTimes(1)
    })
  })
})
