import type Product from "../domain/product/entities/product"
import { findProductById } from "../domain/product/repositories/productQueryRepository"
import type { DbClient } from "../infrastructure/db/client"

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
