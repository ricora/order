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
import {
  MAX_PRODUCT_PRICE,
  MAX_PRODUCT_STOCK,
  MAX_STORE_PRODUCT_COUNT,
} from "../constants"
import type Product from "../entities/product"
import {
  type CreateProduct,
  createProduct,
  type DeleteProduct,
  deleteProduct,
  type UpdateProduct,
  updateProduct,
} from "./productCommandRepository"
import * as productImageCommandRepository from "./productImageCommandRepository"
import * as productQueryRepository from "./productQueryRepository"
import * as productTagCommandRepository from "./productTagCommandRepository"
import * as productTagQueryRepository from "./productTagQueryRepository"

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

describe("createProduct", () => {
  let findAllProductTagsSpy: ReturnType<typeof spyOn>
  let findProductByNameSpy: ReturnType<typeof spyOn>
  let countProductsSpy: ReturnType<typeof spyOn>
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
    countProductsSpy = spyOn(
      productQueryRepository,
      "countProducts",
    ).mockImplementation(async () => 0)
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
      image: {
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        mimeType: "image/png",
      },
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

  it("商品数の上限に達している場合はエラーを返す", async () => {
    countProductsSpy.mockImplementation(async () => MAX_STORE_PRODUCT_COUNT)

    await expect(
      createProduct({
        product: validProduct,
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow(
      `1店舗あたりの商品数は${MAX_STORE_PRODUCT_COUNT}件までです`,
    )

    expect(countProductsSpy).toHaveBeenCalledTimes(1)
    expect(findProductByNameSpy).not.toHaveBeenCalled()
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
  })

  it("価格が上限を超える場合はエラーを返す", async () => {
    await expect(
      createProduct({
        product: { ...validProduct, price: MAX_PRODUCT_PRICE + 1 },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow(`価格は${MAX_PRODUCT_PRICE}以下である必要があります`)
  })

  it("価格が上限と同じ値の場合は正常に作成できる", async () => {
    const mockImpl: CreateProduct = async ({ product }) => ({
      ...product,
      id: 99,
    })
    const result = await createProduct({
      product: { ...validProduct, price: MAX_PRODUCT_PRICE },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.price).toBe(MAX_PRODUCT_PRICE)
  })

  it("在庫数が上限を超える場合はエラーを返す", async () => {
    await expect(
      createProduct({
        product: { ...validProduct, stock: MAX_PRODUCT_STOCK + 1 },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow(`在庫数は${MAX_PRODUCT_STOCK}以下である必要があります`)
  })

  it("在庫数が上限と同じ値の場合は正常に作成できる", async () => {
    const mockImpl: CreateProduct = async ({ product }) => ({
      ...product,
      id: 99,
    })
    const result = await createProduct({
      product: { ...validProduct, stock: MAX_PRODUCT_STOCK },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.stock).toBe(MAX_PRODUCT_STOCK)
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

    spyOn(productQueryRepository, "findProductById").mockImplementation(
      async () => ({
        id: 1,
        name: "既存商品",
        tagIds: [1, 2],
        price: 1000,
        stock: 5,
      }),
    )
  })

  afterEach(() => {
    mock.restore()
  })

  it("バリデーションを通過した商品を更新できる", async () => {
    spyOn(
      productTagQueryRepository,
      "findAllProductTagsByIds",
    ).mockImplementation(async ({ productTag }) => {
      return (productTag.ids as number[]).map((id) => ({
        id,
        name: `タグ${id}`,
      }))
    })

    spyOn(
      productTagQueryRepository,
      "findAllProductTagRelationCountsByTagIds",
    ).mockImplementation(async ({ productTag }) => {
      return (productTag.ids as number[]).map((id) => ({
        tagId: id,
        count: 2,
      }))
    })

    spyOn(
      productTagCommandRepository,
      "deleteAllProductTagsByIds",
    ).mockImplementation(async () => undefined)

    const mockImpl: UpdateProduct = async ({ product }) =>
      applyPartialToDefaultProduct(product)
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
      tagIds: [1],
      price: 500,
      stock: 10,
    }))

    spyOn(
      productTagQueryRepository,
      "findAllProductTagsByIds",
    ).mockImplementation(async ({ productTag }) => {
      return (productTag.ids as number[]).map((id) => ({
        id,
        name: `タグ${id}`,
      }))
    })

    spyOn(
      productTagQueryRepository,
      "findAllProductTagRelationCountsByTagIds",
    ).mockImplementation(async ({ productTag }) => {
      return (productTag.ids as number[]).map((id) => ({
        tagId: id,
        count: 2,
      }))
    })

    spyOn(
      productTagCommandRepository,
      "deleteAllProductTagsByIds",
    ).mockImplementation(async () => undefined)

    const mockImpl: UpdateProduct = async ({ product }) =>
      applyPartialToDefaultProduct(product)
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

  it("タグが更新された際、削除されたタグが孤立していれば削除される", async () => {
    spyOn(productQueryRepository, "findProductById").mockImplementation(
      async () => ({
        id: 1,
        name: "既存商品",
        tagIds: [1, 2],
        price: 1000,
        stock: 5,
      }),
    )

    spyOn(
      productTagQueryRepository,
      "findAllProductTagsByIds",
    ).mockImplementation(async ({ productTag }) => {
      return productTag.ids
        .map((id) => ({ id, name: `タグ${id}` }))
        .filter((tag) => productTag.ids.includes(tag.id))
    })

    spyOn(
      productTagQueryRepository,
      "findAllProductTagRelationCountsByTagIds",
    ).mockImplementation(async ({ productTag }) => {
      return productTag.ids.map((id) => ({
        tagId: id,
        count: id === 2 ? 1 : 2,
      }))
    })

    const deleteAllProductTagsByIdsSpy = spyOn(
      productTagCommandRepository,
      "deleteAllProductTagsByIds",
    ).mockImplementation(async () => undefined)

    const mockImpl: UpdateProduct = async ({ product }) =>
      applyPartialToDefaultProduct(product)

    await updateProduct({
      product: { id: 1, tagIds: [1] },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })

    expect(deleteAllProductTagsByIdsSpy).toHaveBeenCalledTimes(1)
    const calls = deleteAllProductTagsByIdsSpy.mock.calls
    expect(calls[0]?.[0]?.productTag?.ids).toEqual([2])
  })

  it("タグ更新時、削除されたタグが他の商品と紐づいていれば削除しない", async () => {
    spyOn(productQueryRepository, "findProductById").mockImplementation(
      async () => ({
        id: 1,
        name: "既存商品",
        tagIds: [1, 2],
        price: 1000,
        stock: 5,
      }),
    )

    spyOn(
      productTagQueryRepository,
      "findAllProductTagsByIds",
    ).mockImplementation(async ({ productTag }) => {
      return (productTag.ids as number[]).map((id) => ({
        id,
        name: `タグ${id}`,
      }))
    })

    spyOn(
      productTagQueryRepository,
      "findAllProductTagRelationCountsByTagIds",
    ).mockImplementation(async ({ productTag }) => {
      return (productTag.ids as number[]).map((id) => ({
        tagId: id,
        count: 2,
      }))
    })

    const deleteAllProductTagsByIdsSpy = spyOn(
      productTagCommandRepository,
      "deleteAllProductTagsByIds",
    ).mockImplementation(async () => undefined)

    const mockImpl: UpdateProduct = async ({ product }) =>
      applyPartialToDefaultProduct(product)

    await updateProduct({
      product: { id: 1, tagIds: [1] },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })

    expect(deleteAllProductTagsByIdsSpy).not.toHaveBeenCalled()
  })

  it("更新時に価格が上限を超える場合はエラーを返す", async () => {
    await expect(
      updateProduct({
        product: { id: 1, price: MAX_PRODUCT_PRICE + 1 },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow(`価格は${MAX_PRODUCT_PRICE}以下である必要があります`)
  })

  it("更新時に在庫数が上限を超える場合はエラーを返す", async () => {
    await expect(
      updateProduct({
        product: { id: 1, stock: MAX_PRODUCT_STOCK + 1 },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow(`在庫数は${MAX_PRODUCT_STOCK}以下である必要があります`)
  })
})

describe("deleteProduct", () => {
  let deleteAllProductTagsByIdsSpy: ReturnType<typeof spyOn>
  let deleteProductImageByProductIdSpy: ReturnType<typeof spyOn>
  const mockDbClient = {} as TransactionDbClient

  beforeEach(() => {
    spyOn(productQueryRepository, "findProductById").mockImplementation(
      async () => ({
        id: 1,
        name: "削除対象商品",
        tagIds: [1, 2],
        price: 1000,
        stock: 5,
      }),
    )

    spyOn(
      productTagQueryRepository,
      "findAllProductTagsByIds",
    ).mockImplementation(async ({ productTag }) => {
      return (productTag.ids as number[]).map((id) => ({
        id,
        name: `タグ${id}`,
      }))
    })

    spyOn(
      productTagQueryRepository,
      "findAllProductTagRelationCountsByTagIds",
    ).mockImplementation(async ({ productTag }) => {
      return (productTag.ids as number[]).map((id) => ({
        tagId: id,
        count: 1,
      }))
    })

    deleteAllProductTagsByIdsSpy = spyOn(
      productTagCommandRepository,
      "deleteAllProductTagsByIds",
    ).mockImplementation(async () => undefined)

    deleteProductImageByProductIdSpy = spyOn(
      productImageCommandRepository,
      "deleteProductImageByProductId",
    ).mockImplementation(async () => undefined)
  })

  afterEach(() => {
    mock.restore()
  })

  it("商品が見つからない場合はエラーを返す", async () => {
    spyOn(productQueryRepository, "findProductById").mockImplementation(
      async () => null,
    )

    await expect(
      deleteProduct({
        product: { id: 999 },
        repositoryImpl: async () => undefined,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("商品が見つかりません")
  })

  it("商品削除時に孤立したタグが削除される", async () => {
    const mockImpl: DeleteProduct = async () => undefined

    await deleteProduct({
      product: { id: 1 },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })

    expect(deleteProductImageByProductIdSpy).toHaveBeenCalledTimes(1)
    expect(deleteAllProductTagsByIdsSpy).toHaveBeenCalledTimes(1)
    const calls = deleteAllProductTagsByIdsSpy.mock.calls
    expect(calls[0]?.[0]?.productTag?.ids).toEqual([1, 2])
  })

  it("商品削除時に孤立していないタグは削除されない", async () => {
    spyOn(
      productTagQueryRepository,
      "findAllProductTagRelationCountsByTagIds",
    ).mockImplementation(async ({ productTag }) => {
      return (productTag.ids as number[]).map((id) => ({
        tagId: id,
        count: 2,
      }))
    })

    const mockImpl: DeleteProduct = async () => undefined

    await deleteProduct({
      product: { id: 1 },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })

    expect(deleteAllProductTagsByIdsSpy).not.toHaveBeenCalled()
    expect(deleteProductImageByProductIdSpy).toHaveBeenCalledTimes(1)
  })
})
