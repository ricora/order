import { findProductImageByProductIdImpl } from "../../../infrastructure/domain/product/productImageQueryRepositoryImpl"
import type { QueryRepositoryFunction, WithRepositoryImpl } from "../../types"
import type ProductImage from "../entities/productImage"

export type FindProductImageByProductId = QueryRepositoryFunction<
  { productImage: Pick<ProductImage, "productId"> },
  ProductImage | null
>

export const findProductImageByProductId: WithRepositoryImpl<
  FindProductImageByProductId
> = async ({
  repositoryImpl = findProductImageByProductIdImpl,
  dbClient,
  productImage,
}) => {
  return repositoryImpl({ dbClient, productImage })
}
