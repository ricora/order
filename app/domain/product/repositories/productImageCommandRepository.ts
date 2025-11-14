import {
  createProductImageImpl,
  deleteProductImageByProductIdImpl,
  updateProductImageByProductIdImpl,
} from "../../../infrastructure/domain/product/productImageCommandRepositoryImpl"
import { countStringLength } from "../../../utils/text"
import type { CommandRepositoryFunction, WithRepositoryImpl } from "../../types"
import type ProductImage from "../entities/productImage"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

// base64エンコード後のサイズは元のバイナリサイズの約133%になるため、逆算（10MB / 1.33 ≈ 7.5MB）して厳しめに設定する
const MAX_IMAGE_SIZE = Math.floor(7.5 * 1024 * 1024)

const validateProductImage = (
  image: Partial<Pick<ProductImage, "data" | "mimeType">>,
): void => {
  if (image.mimeType !== undefined) {
    if (!ALLOWED_MIME_TYPES.includes(image.mimeType)) {
      throw new Error(
        `画像のMIMEタイプは${ALLOWED_MIME_TYPES.join(", ")}のいずれかである必要があります`,
      )
    }
    if (countStringLength(image.mimeType) > 100) {
      throw new Error("MIMEタイプは100文字以内である必要があります")
    }
  }
  if (image.data !== undefined) {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(image.data)) {
      throw new Error("画像データの形式が不正です")
    }
    if (image.data.length > MAX_IMAGE_SIZE) {
      throw new Error(
        `画像データのサイズは約${MAX_IMAGE_SIZE / 1024 / 1024}MB以内である必要があります`,
      )
    }
  }
}

export type CreateProductImage = CommandRepositoryFunction<
  {
    productImage: Omit<ProductImage, "id">
  },
  ProductImage | null
>

export type UpdateProductImageByProductId = CommandRepositoryFunction<
  {
    productImage: Pick<ProductImage, "productId" | "updatedAt"> &
      Partial<Pick<ProductImage, "data" | "mimeType">>
  },
  ProductImage | null
>

export type DeleteProductImageByProductId = CommandRepositoryFunction<
  { productImage: Pick<ProductImage, "productId"> },
  void
>

export const createProductImage: WithRepositoryImpl<
  CreateProductImage
> = async ({
  repositoryImpl = createProductImageImpl,
  dbClient,
  productImage,
}) => {
  validateProductImage({
    data: productImage.data,
    mimeType: productImage.mimeType,
  })
  return repositoryImpl({ dbClient, productImage })
}

export const updateProductImageByProductId: WithRepositoryImpl<
  UpdateProductImageByProductId
> = async ({
  repositoryImpl = updateProductImageByProductIdImpl,
  dbClient,
  productImage,
}) => {
  validateProductImage({
    data: productImage.data,
    mimeType: productImage.mimeType,
  })
  return repositoryImpl({ dbClient, productImage })
}

export const deleteProductImageByProductId: WithRepositoryImpl<
  DeleteProductImageByProductId
> = async ({
  repositoryImpl = deleteProductImageByProductIdImpl,
  dbClient,
  productImage,
}) => {
  return repositoryImpl({ dbClient, productImage })
}
