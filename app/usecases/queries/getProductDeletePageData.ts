import { MAX_TAGS_PER_PRODUCT } from "../../domain/product/constants"
import type Product from "../../domain/product/entities/product"
import type ProductTag from "../../domain/product/entities/productTag"
import type { DbClient } from "../../libs/db/client"
import { productRepository } from "../repositories"

const { findProductById, findAllProductTagsByIds } = productRepository

export type GetProductDeletePageDataParams = {
  dbClient: DbClient
  product: Pick<Product, "id">
}

export type ProductDeletePageData = {
  product:
    | (Pick<Product, "id" | "name" | "price" | "stock"> & {
        tags: ProductTag["name"][]
      })
    | null
}

export const getProductDeletePageData = async ({
  dbClient,
  product,
}: GetProductDeletePageDataParams): Promise<ProductDeletePageData> => {
  const foundProduct = await findProductById({ dbClient, product })
  if (!foundProduct) {
    return { product: null }
  }
  const tags = await findAllProductTagsByIds({
    dbClient,
    productTag: { ids: foundProduct.tagIds },
    pagination: { offset: 0, limit: MAX_TAGS_PER_PRODUCT },
  })

  return {
    product: {
      ...foundProduct,
      tags: tags.map((tag) => tag.name),
    },
  }
}
