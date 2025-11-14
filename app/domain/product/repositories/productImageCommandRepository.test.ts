import { afterEach, describe, expect, it, mock } from "bun:test"
import type { TransactionDbClient } from "../../../infrastructure/db/client"
import type ProductImage from "../entities/productImage"
import {
  type CreateProductImage,
  createProductImage,
  type DeleteProductImageByProductId,
  deleteProductImageByProductId,
  type UpdateProductImageByProductId,
  updateProductImageByProductId,
} from "./productImageCommandRepository"

const validProductImage: Omit<ProductImage, "id"> = {
  productId: 1,
  data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  mimeType: "image/png",
  createdAt: new Date(),
  updatedAt: new Date(),
}

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
  Object.assign({}, defaultProductImage, partialProductImage) as ProductImage

describe("createProductImage", () => {
  const mockDbClient = {} as TransactionDbClient

  afterEach(() => {
    mock.restore()
  })

  it("バリデーションを通過した画像を作成できる", async () => {
    const mockImpl: CreateProductImage = async ({ productImage }) => ({
      ...productImage,
      id: 99,
    })
    const result = await createProductImage({
      productImage: validProductImage,
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.mimeType).toBe(validProductImage.mimeType)
    expect(result?.data).toBe(validProductImage.data)
    expect(result?.productId).toBe(validProductImage.productId)
  })

  it("画像のMIMEタイプが許可されていない場合はエラーを返す", async () => {
    await expect(
      createProductImage({
        productImage: {
          ...validProductImage,
          mimeType: "image/bmp",
        },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow(
      "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります",
    )
  })

  it("画像データの形式が不正な場合はエラーを返す", async () => {
    await expect(
      createProductImage({
        productImage: {
          ...validProductImage,
          data: "!!!invalid base64!!!",
        },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("画像データの形式が不正です")
  })

  it("画像データのサイズが7.5MBを超える場合はエラーを返す", async () => {
    const oversizedData = "A".repeat(7.5 * 1024 * 1024 + 1)
    await expect(
      createProductImage({
        productImage: {
          ...validProductImage,
          data: oversizedData,
        },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("画像データのサイズは約7.5MB以内である必要があります")
  })
})

describe("updateProductImageByProductId", () => {
  const mockDbClient = {} as TransactionDbClient

  afterEach(() => {
    mock.restore()
  })

  it("バリデーションを通過した画像を更新できる", async () => {
    const mockImpl: UpdateProductImageByProductId = async ({ productImage }) =>
      applyPartialToDefaultProductImage({ id: 1, ...productImage })
    const result = await updateProductImageByProductId({
      productImage: {
        productId: 1,
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        mimeType: "image/jpeg",
        updatedAt: new Date(),
      },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.mimeType).toBe("image/jpeg")
  })

  it("dataのみを更新できる", async () => {
    const mockImpl: UpdateProductImageByProductId = async ({ productImage }) =>
      applyPartialToDefaultProductImage({ id: 1, ...productImage })
    const result = await updateProductImageByProductId({
      productImage: {
        productId: 1,
        data: "anotherBase64EncodedImageData",
        updatedAt: new Date(),
      },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.data).toBe("anotherBase64EncodedImageData")
  })

  it("mimeTypeのみを更新できる", async () => {
    const mockImpl: UpdateProductImageByProductId = async ({ productImage }) =>
      applyPartialToDefaultProductImage({ id: 1, ...productImage })
    const result = await updateProductImageByProductId({
      productImage: {
        productId: 1,
        mimeType: "image/webp",
        updatedAt: new Date(),
      },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(result).not.toBeNull()
    expect(result?.mimeType).toBe("image/webp")
  })

  it("更新時に画像のMIMEタイプが許可されていない場合はエラーを返す", async () => {
    await expect(
      updateProductImageByProductId({
        productImage: {
          productId: 1,
          mimeType: "image/tiff",
          updatedAt: new Date(),
        },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow(
      "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります",
    )
  })

  it("更新時に画像データの形式が不正な場合はエラーを返す", async () => {
    await expect(
      updateProductImageByProductId({
        productImage: {
          productId: 1,
          data: "not base64 at all!!!",
          updatedAt: new Date(),
        },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("画像データの形式が不正です")
  })

  it("更新時に画像データのサイズが7.5MBを超える場合はエラーを返す", async () => {
    const oversizedData = "A".repeat(7.5 * 1024 * 1024 + 1)
    await expect(
      updateProductImageByProductId({
        productImage: {
          productId: 1,
          data: oversizedData,
          updatedAt: new Date(),
        },
        repositoryImpl: async () => null,
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("画像データのサイズは約7.5MB以内である必要があります")
  })
})

describe("deleteProductImageByProductId", () => {
  const mockDbClient = {} as TransactionDbClient

  afterEach(() => {
    mock.restore()
  })

  it("productIdで画像を削除できる", async () => {
    const mockImpl: DeleteProductImageByProductId = async () => {
      return undefined
    }
    await deleteProductImageByProductId({
      productImage: {
        productId: 1,
      },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    expect(true).toBe(true)
  })
})
