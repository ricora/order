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
  image: {
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    mimeType: "image/png",
  },
  tagIds: [1, 2],
  price: 1000,
  stock: 5,
}

const defaultProduct: Product = {
  id: 1,
  name: "テスト商品",
  image: {
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    mimeType: "image/png",
  },
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

  it("画像のMIMEタイプが許可されていない場合はエラーを返す", async () => {
    await expect(
      createProduct({
        product: {
          ...validProduct,
          image: {
            data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            mimeType: "image/bmp",
          },
        },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow(
      "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります",
    )
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
    expect(findProductByNameSpy).not.toHaveBeenCalled()
  })

  it("画像データの形式が不正な場合はエラーを返す", async () => {
    await expect(
      createProduct({
        product: {
          ...validProduct,
          image: {
            data: "!!!invalid base64!!!",
            mimeType: "image/png",
          },
        },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("画像データの形式が不正です")
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
    expect(findProductByNameSpy).not.toHaveBeenCalled()
  })

  it("画像データのサイズが7.5MBを超える場合はエラーを返す", async () => {
    // 7.5MBを超えるbase64文字列を生成
    const oversizedData = "A".repeat(7.5 * 1024 * 1024 + 1)
    await expect(
      createProduct({
        product: {
          ...validProduct,
          image: {
            data: oversizedData,
            mimeType: "image/png",
          },
        },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("画像データのサイズは約7.5MB以内である必要があります")
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
    expect(findProductByNameSpy).not.toHaveBeenCalled()
  })

  it("画像データがnullの場合でも作成できる", async () => {
    const mockImpl: CreateProduct = async ({ product }) => ({
      ...product,
      id: 99,
    })
    const result = await createProduct({
      product: {
        name: "テスト商品",
        image: null,
        tagIds: [1, 2],
        price: 1000,
        stock: 5,
      },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.id).toBe(99)
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
      image: {
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        mimeType: "image/png",
      },
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
      image: {
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        mimeType: "image/png",
      },
      tagIds: [1],
      price: 500,
      stock: 10,
    }))

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

  it("画像を新しいものに更新できる", async () => {
    const mockImpl: UpdateProduct = async ({ product }) =>
      applyPartialToDefaultProduct(product)
    const result = await updateProduct({
      product: {
        id: 1,
        image: {
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          mimeType: "image/jpeg",
        },
      },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.image?.mimeType).toBe("image/jpeg")
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
  })

  it("更新時に画像のMIMEタイプが許可されていない場合はエラーを返す", async () => {
    await expect(
      updateProduct({
        product: {
          id: 1,
          image: {
            data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            mimeType: "image/tiff",
          },
        },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow(
      "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります",
    )
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
  })

  it("更新時に画像データの形式が不正な場合はエラーを返す", async () => {
    await expect(
      updateProduct({
        product: {
          id: 1,
          image: {
            data: "not base64 at all!!!",
            mimeType: "image/png",
          },
        },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("画像データの形式が不正です")
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
  })

  it("更新時に画像データのサイズが7.5MBを超える場合はエラーを返す", async () => {
    const oversizedData = "A".repeat(7.5 * 1024 * 1024 + 1)
    await expect(
      updateProduct({
        product: {
          id: 1,
          image: {
            data: oversizedData,
            mimeType: "image/png",
          },
        },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("画像データのサイズは約7.5MB以内である必要があります")
    expect(findAllProductTagsSpy).not.toHaveBeenCalled()
  })
})
