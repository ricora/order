import type ProductTag from "../domain/product/entities/productTag"
import { findAllProductTags } from "../domain/product/repositories/productTagQueryRepository"
import type { DbClient } from "../infrastructure/db/client"

export type GetProductRegistrationFormComponentDataParams = {
  dbClient: DbClient
}

export type ProductRegistrationFormComponentData = {
  tags: ProductTag[]
}

export const getProductRegistrationFormComponentData = async ({
  dbClient,
}: GetProductRegistrationFormComponentDataParams): Promise<ProductRegistrationFormComponentData> => {
  const tags = await findAllProductTags({ dbClient })
  return {
    tags,
  }
}
