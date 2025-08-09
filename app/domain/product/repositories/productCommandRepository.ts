import {
  createProductImpl,
  deleteProductImpl,
  updateProductImpl,
} from "../../../infrastructure/product/productCommandRepositoryImpl"
import { countStringLength } from "../../../utils/text"
import type { WithRepository } from "../../types"
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
    countStringLength(product.name) < 1 ||
    countStringLength(product.name) > 500
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

const verifyAllTagIdsExist = async (tagIds: number[]) => {
  const tags = await findAllProductTags({})
  const tagIdSet = new Set(tags.map((tag) => tag.id))
  if (tagIds.some((tagId) => !tagIdSet.has(tagId))) {
    throw new Error("タグIDは存在するタグのIDを参照する必要があります")
  }
}

export type CreateProduct = (
  params: Omit<Product, "id">,
) => Promise<Product | null>
export type UpdateProduct = (params: Product) => Promise<Product | null>
export type DeleteProduct = (params: Pick<Product, "id">) => Promise<void>

export const createProduct: WithRepository<CreateProduct> = async ({
  repositoryImpl = createProductImpl,
  ...product
}) => {
  validateProduct(product)
  await verifyAllTagIdsExist(product.tagIds)
  return repositoryImpl({ ...product })
}

export const updateProduct: WithRepository<UpdateProduct> = async ({
  repositoryImpl = updateProductImpl,
  ...product
}) => {
  validateProduct(product)
  await verifyAllTagIdsExist(product.tagIds)
  return repositoryImpl(product)
}

export const deleteProduct: WithRepository<DeleteProduct> = async ({
  repositoryImpl = deleteProductImpl,
  id,
}) => {
  return repositoryImpl({ id })
}
