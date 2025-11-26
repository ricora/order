import type Product from "../../domain/product/entities/product"
import type { DbClient } from "../../libs/db/client"
import { productRepository } from "../repositories"

const { findProductById } = productRepository

export type GetProductEditPageDataParams = {
  dbClient: DbClient
  product: Pick<Product, "id">
}

export type ProductEditPageData = {
  product: Product | null
}

export const getProductEditPageData = async ({
  dbClient,
  product,
}: GetProductEditPageDataParams): Promise<ProductEditPageData> => {
  const foundProduct = await findProductById({ dbClient, product })
  return {
    product: foundProduct,
  }
}
