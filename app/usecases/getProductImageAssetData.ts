import type ProductImage from "../domain/product/entities/productImage"
import { findProductImageByProductId } from "../domain/product/repositories/productImageQueryRepository"
import type { DbClient } from "../infrastructure/db/client"

export type GetProductImageAssetParams = {
  dbClient: DbClient
  productImage: Pick<ProductImage, "productId">
}
export const getProductImageAssetData = async ({
  dbClient,
  productImage,
}: GetProductImageAssetParams) => {
  const foundProductImage = await findProductImageByProductId({
    dbClient,
    productImage,
  })

  return { productImage: foundProductImage }
}
