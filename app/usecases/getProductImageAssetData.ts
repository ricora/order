import type Product from "../domain/product/entities/product"
import { findProductById } from "../domain/product/repositories/productQueryRepository"
import type { DbClient } from "../infrastructure/db/client"

export type GetProductImageAssetParams = {
  dbClient: DbClient
  product: Pick<Product, "id">
}

export type GetProductImageAssetData = {
  product: Pick<Product, "image"> | null
}

export const getProductImageAssetData = async ({
  dbClient,
  product,
}: GetProductImageAssetParams): Promise<GetProductImageAssetData> => {
  const foundProduct = await findProductById({
    dbClient,
    product: { id: product.id },
  })

  if (!foundProduct) {
    return { product: null }
  }
  if (!foundProduct.image) {
    return { product: { image: null } }
  }
  return {
    product: { image: foundProduct.image },
  }
}
