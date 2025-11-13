import type { TransactionDbClient } from "../../../infrastructure/db/client"
import {
  createProductImpl,
  deleteProductImpl,
  updateProductImpl,
} from "../../../infrastructure/domain/product/productCommandRepositoryImpl"
import { countStringLength } from "../../../utils/text"
import type { CommandRepositoryFunction, WithRepositoryImpl } from "../../types"
import { MAX_STORE_PRODUCT_TAG_COUNT } from "../constants"
import type Product from "../entities/product"
import { findProductByName } from "./productQueryRepository"
import { findAllProductTags } from "./productTagQueryRepository"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

// base64エンコード後のサイズは元のバイナリサイズの約133%になるため、逆算（10MB / 1.33 ≈ 7.5MB）して厳しめに設定する
const MAX_IMAGE_SIZE = Math.floor(7.5 * 1024 * 1024)

const validateProduct = (product: Partial<Omit<Product, "id">>) => {
  if (product.name !== undefined) {
    if (
      countStringLength(product.name) < 1 ||
      countStringLength(product.name) > 50
    ) {
      throw new Error("商品名は1文字以上50文字以内である必要があります")
    }
  }
  if (product.image) {
    if (!ALLOWED_MIME_TYPES.includes(product.image.mimeType)) {
      throw new Error(
        `画像のMIMEタイプは${ALLOWED_MIME_TYPES.join(", ")}のいずれかである必要があります`,
      )
    }
    if (countStringLength(product.image.mimeType) > 100) {
      throw new Error("MIMEタイプは100文字以内である必要があります")
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(product.image.data)) {
      throw new Error("画像データの形式が不正です")
    }
    if (product.image.data.length > MAX_IMAGE_SIZE) {
      throw new Error(
        `画像データのサイズは約${MAX_IMAGE_SIZE / 1024 / 1024}MB以内である必要があります`,
      )
    }
  }
  if (product.tagIds !== undefined) {
    if (product.tagIds.length > 20) {
      throw new Error("商品タグは20個以内である必要があります")
    }
    if (product.tagIds.some((tagId) => !Number.isInteger(tagId) || tagId < 1)) {
      throw new Error("タグIDは1以上の整数の配列である必要があります")
    }
  }
  if (product.price !== undefined) {
    if (product.price < 0 || !Number.isInteger(product.price)) {
      throw new Error("価格は0以上の整数である必要があります")
    }
  }
  if (product.stock !== undefined) {
    if (product.stock < 0 || !Number.isInteger(product.stock)) {
      throw new Error("在庫数は0以上の整数である必要があります")
    }
  }
}

const verifyAllTagIdsExist = async (
  dbClient: TransactionDbClient,
  tagIds: Product["tagIds"],
) => {
  const tags = await findAllProductTags({
    dbClient,
    pagination: { offset: 0, limit: MAX_STORE_PRODUCT_TAG_COUNT },
  })
  const tagIdSet = new Set(tags.map((tag) => tag.id))
  if (tagIds.some((tagId) => !tagIdSet.has(tagId))) {
    throw new Error("タグIDは存在するタグのIDを参照する必要があります")
  }
}

const verifyProductNameUnique = async (
  dbClient: TransactionDbClient,
  name: Product["name"],
  excludeId?: Product["id"],
) => {
  const existingProduct = await findProductByName({
    product: { name },
    dbClient,
  })
  if (existingProduct && existingProduct.id !== excludeId) {
    throw new Error("同じ名前の商品が既に存在します")
  }
}

export type CreateProduct = CommandRepositoryFunction<
  { product: Omit<Product, "id"> },
  Product | null
>
export type UpdateProduct = CommandRepositoryFunction<
  { product: Pick<Product, "id"> & Partial<Omit<Product, "id">> },
  Product | null
>
export type DeleteProduct = CommandRepositoryFunction<
  { product: Pick<Product, "id"> },
  void
>

export const createProduct: WithRepositoryImpl<CreateProduct> = async ({
  repositoryImpl = createProductImpl,
  dbClient,
  product,
}) => {
  validateProduct(product)
  await verifyProductNameUnique(dbClient, product.name)
  await verifyAllTagIdsExist(dbClient, product.tagIds)
  return repositoryImpl({ product, dbClient })
}

export const updateProduct: WithRepositoryImpl<UpdateProduct> = async ({
  repositoryImpl = updateProductImpl,
  dbClient,
  product,
}) => {
  validateProduct(product)
  if (product.name) {
    await verifyProductNameUnique(dbClient, product.name, product.id)
  }
  if (product.tagIds) {
    await verifyAllTagIdsExist(dbClient, product.tagIds)
  }
  return repositoryImpl({ product, dbClient })
}

export const deleteProduct: WithRepositoryImpl<DeleteProduct> = async ({
  repositoryImpl = deleteProductImpl,
  product,
  dbClient,
}) => {
  return repositoryImpl({ product, dbClient })
}
