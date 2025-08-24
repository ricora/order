import type { TransactionDbClient } from "../../../infrastructure/db/client"
import {
  createProductImpl,
  deleteProductImpl,
  updateProductImpl,
} from "../../../infrastructure/product/productCommandRepositoryImpl"
import { countStringLength } from "../../../utils/text"
import type { CommandRepositoryFunction, WithRepositoryImpl } from "../../types"
import type Product from "../entities/product"
import { findAllProductTags } from "./productTagQueryRepository"

const validateProduct = (product: Omit<Product, "id">) => {
  if (
    countStringLength(product.name) < 1 ||
    countStringLength(product.name) > 50
  ) {
    throw new Error("商品名は1文字以上50文字以内である必要があります")
  }

  if (
    !/^https?:\/\/.+/i.test(product.image) ||
    countStringLength(product.image) < 1 ||
    countStringLength(product.image) > 500
  ) {
    throw new Error(
      "画像URLは1文字以上500文字以内かつhttp(s)で始まる必要があります",
    )
  }
  if (product.tagIds.some((tagId) => !Number.isInteger(tagId) || tagId < 1)) {
    throw new Error("タグIDは1以上の整数の配列である必要があります")
  }
  if (product.price < 0 || !Number.isInteger(product.price)) {
    throw new Error("価格は0以上の整数である必要があります")
  }
  if (product.stock < 0 || !Number.isInteger(product.stock)) {
    throw new Error("在庫数は0以上の整数である必要があります")
  }
}

const verifyAllTagIdsExist = async (
  dbClient: TransactionDbClient,
  tagIds: number[],
) => {
  const tags = await findAllProductTags({ dbClient })
  const tagIdSet = new Set(tags.map((tag) => tag.id))
  if (tagIds.some((tagId) => !tagIdSet.has(tagId))) {
    throw new Error("タグIDは存在するタグのIDを参照する必要があります")
  }
}

export type CreateProduct = CommandRepositoryFunction<
  Omit<Product, "id">,
  Product | null
>
export type UpdateProduct = CommandRepositoryFunction<Product, Product | null>
export type DeleteProduct = CommandRepositoryFunction<Pick<Product, "id">, void>

export const createProduct: WithRepositoryImpl<CreateProduct> = async ({
  repositoryImpl = createProductImpl,
  dbClient,
  ...product
}) => {
  validateProduct(product)
  await verifyAllTagIdsExist(dbClient, product.tagIds)
  return repositoryImpl({ ...product, dbClient })
}

export const updateProduct: WithRepositoryImpl<UpdateProduct> = async ({
  repositoryImpl = updateProductImpl,
  dbClient,
  ...product
}) => {
  validateProduct(product)
  await verifyAllTagIdsExist(dbClient, product.tagIds)
  return repositoryImpl({ ...product, dbClient })
}

export const deleteProduct: WithRepositoryImpl<DeleteProduct> = async ({
  repositoryImpl = deleteProductImpl,
  id,
  dbClient,
}) => {
  return repositoryImpl({ id, dbClient })
}
