import type ProductTag from "../domain/product/entities/productTag"
import { findAllProductTags } from "../domain/product/repositories/productTagQueryRepository"
import type { DbClient } from "../infrastructure/db/client"

export type GetProductRegistrationPageDataParams = {
  dbClient: DbClient
}

export type ProductRegistrationPageData = {
  tags: ProductTag[]
}

export const getProductRegistrationPageData = async ({
  dbClient,
}: GetProductRegistrationPageDataParams): Promise<ProductRegistrationPageData> => {
  const tags = await findAllProductTags({ dbClient })
  return {
    tags,
  }
}
