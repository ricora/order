import {
  MAX_STORE_PRODUCT_COUNT,
  MAX_STORE_PRODUCT_TAG_COUNT,
} from "../domain/product/constants"
import type Product from "../domain/product/entities/product"
import type ProductTag from "../domain/product/entities/productTag"
import { findAllProducts } from "../domain/product/repositories/productQueryRepository"
import { findAllProductTags } from "../domain/product/repositories/productTagQueryRepository"
import type { DbClient } from "../infrastructure/db/client"

export type GetOrderRegistrationFormComponentDataParams = {
  dbClient: DbClient
}

export type OrderRegistrationFormComponentData = {
  products: (Omit<Product, "image" | "tagIds"> & {
    tags: string[]
  })[]
  tags: ProductTag[]
}

export const getOrderRegistrationFormComponentData = async ({
  dbClient,
}: GetOrderRegistrationFormComponentDataParams): Promise<OrderRegistrationFormComponentData> => {
  const products = await findAllProducts({
    dbClient,
    pagination: { offset: 0, limit: MAX_STORE_PRODUCT_COUNT },
  })
  const tags = await findAllProductTags({
    dbClient,
    pagination: { offset: 0, limit: MAX_STORE_PRODUCT_TAG_COUNT },
  })
  const tagMap = new Map<number, string>(tags.map((tag) => [tag.id, tag.name]))

  return {
    products: products.map((product) => ({
      ...product,
      tags: product.tagIds
        .map((tagId) => tagMap.get(tagId))
        .filter((name): name is string => !!name),
    })),
    tags,
  }
}
