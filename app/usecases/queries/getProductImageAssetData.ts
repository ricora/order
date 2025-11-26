import type ProductImage from "../../domain/product/entities/productImage"
import type { DbClient } from "../../libs/db/client"
import { productRepository } from "../repositories"

const { findProductImageByProductId } = productRepository

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
