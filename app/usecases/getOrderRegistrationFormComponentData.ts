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
    image: string
    tags: string[]
  })[]
  tags: ProductTag[]
}

export const getOrderRegistrationFormComponentData = async ({
  dbClient,
}: GetOrderRegistrationFormComponentDataParams): Promise<OrderRegistrationFormComponentData> => {
  const products = await findAllProducts({
    dbClient,
    pagination: { offset: 0, limit: 1000 },
  })
  const tags = await findAllProductTags({
    dbClient,
    pagination: { offset: 0, limit: 1000 },
  })
  const tagMap = new Map<number, string>(tags.map((tag) => [tag.id, tag.name]))

  return {
    products: products.map((product) => ({
      ...product,
      // TODO: デフォルト画像を正式なものに差し替える
      image: product.image ?? "https://picsum.photos/200/200",
      tags: product.tagIds
        .map((tagId) => tagMap.get(tagId))
        .filter((name): name is string => !!name),
    })),
    tags,
  }
}
