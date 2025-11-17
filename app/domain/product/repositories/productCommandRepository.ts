import type { TransactionDbClient } from "../../../infrastructure/db/client"
import {
  createProductImpl,
  deleteProductImpl,
  updateProductImpl,
} from "../../../infrastructure/domain/product/productCommandRepositoryImpl"
import { countStringLength } from "../../../utils/text"
import type { CommandRepositoryFunction, WithRepositoryImpl } from "../../types"
import {
  MAX_STORE_PRODUCT_COUNT,
  MAX_STORE_PRODUCT_TAG_COUNT,
  MAX_TAGS_PER_PRODUCT,
} from "../constants"
import type Product from "../entities/product"
import { deleteProductImageByProductId } from "./productImageCommandRepository"
import {
  countProducts,
  findProductById,
  findProductByName,
} from "./productQueryRepository"
import { deleteAllProductTagsByIds } from "./productTagCommandRepository"
import {
  findAllProductTagRelationCountsByTagIds,
  findAllProductTags,
} from "./productTagQueryRepository"

const validateProduct = (product: Partial<Omit<Product, "id">>) => {
  if (product.name !== undefined) {
    if (
      countStringLength(product.name) < 1 ||
      countStringLength(product.name) > 50
    ) {
      throw new Error("商品名は1文字以上50文字以内である必要があります")
    }
  }
  if (product.tagIds !== undefined) {
    if (product.tagIds.length > MAX_TAGS_PER_PRODUCT) {
      throw new Error(
        `商品タグは${MAX_TAGS_PER_PRODUCT}個以内である必要があります`,
      )
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

const verifyProductCountLimit = async (dbClient: TransactionDbClient) => {
  const totalProducts = await countProducts({ dbClient })
  if (totalProducts >= MAX_STORE_PRODUCT_COUNT) {
    throw new Error(`1店舗あたりの商品数は${MAX_STORE_PRODUCT_COUNT}件までです`)
  }
}

const deleteOrphanedTags = async (
  dbClient: TransactionDbClient,
  tagIds: number[],
) => {
  if (tagIds.length === 0) {
    return
  }

  const tagRelationCounts = await findAllProductTagRelationCountsByTagIds({
    dbClient,
    productTag: { ids: tagIds },
    pagination: { offset: 0, limit: tagIds.length },
  })

  const orphanedTagIds = tagRelationCounts
    .filter((tagCount) => tagCount.count <= 1)
    .map((tagCount) => tagCount.tagId)

  if (orphanedTagIds.length > 0) {
    await deleteAllProductTagsByIds({
      productTag: { ids: orphanedTagIds },
      dbClient,
    })
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
  await verifyProductCountLimit(dbClient)
  await verifyProductNameUnique(dbClient, product.name)
  await verifyAllTagIdsExist(dbClient, product.tagIds)
  return repositoryImpl({ product, dbClient })
}

export const updateProduct: WithRepositoryImpl<UpdateProduct> = async ({
  repositoryImpl = updateProductImpl,
  dbClient,
  product,
}) => {
  const foundProduct = await findProductById({
    dbClient,
    product: { id: product.id },
  })
  if (!foundProduct) {
    throw new Error("商品が見つかりません")
  }

  validateProduct(product)
  if (product.name) {
    await verifyProductNameUnique(dbClient, product.name, product.id)
  }
  if (product.tagIds) {
    await verifyAllTagIdsExist(dbClient, product.tagIds)
  }

  if (product.tagIds !== undefined) {
    const oldTagIds = foundProduct.tagIds
    const removedTagIds = oldTagIds.filter(
      (tagId) => !product.tagIds?.includes(tagId),
    )
    await deleteOrphanedTags(dbClient, removedTagIds)
  }

  return repositoryImpl({ product, dbClient })
}

export const deleteProduct: WithRepositoryImpl<DeleteProduct> = async ({
  repositoryImpl = deleteProductImpl,
  product,
  dbClient,
}) => {
  const foundProduct = await findProductById({
    dbClient,
    product: { id: product.id },
  })
  if (!foundProduct) {
    throw new Error("商品が見つかりません")
  }

  await deleteProductImageByProductId({
    productImage: { productId: product.id },
    dbClient,
  })

  await deleteOrphanedTags(dbClient, foundProduct.tagIds)
  await repositoryImpl({ product, dbClient })
}
