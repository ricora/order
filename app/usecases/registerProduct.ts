import type Product from "../domain/product/entities/product"
import { createProduct } from "../domain/product/repositories/productCommandRepository"
import { createProductTag } from "../domain/product/repositories/productTagCommandRepository"
import { findAllProductTags } from "../domain/product/repositories/productTagQueryRepository"
import type { DbClient } from "../infrastructure/db/client"

export type RegisterProductParams = {
  dbClient: DbClient
  product: Omit<Product, "tagIds" | "id"> & {
    tags: string[]
  }
}

export const registerProduct = async ({
  dbClient,
  product,
}: RegisterProductParams): Promise<Product | null> => {
  let createdProduct: Product | null = null
  await dbClient.transaction(async (tx) => {
    const tags = await findAllProductTags({ dbClient: tx })
    const tagNameToId = new Map(tags.map((tag) => [tag.name, tag.id]))
    const tagIds: number[] = []
    for (const tagName of product.tags) {
      const trimmed = tagName.trim()
      if (!trimmed) continue
      const id = tagNameToId.get(trimmed)
      if (id !== undefined) {
        tagIds.push(id)
      } else {
        const newTag = await createProductTag({
          productTag: {
            name: trimmed,
          },
          dbClient: tx,
        })
        tagIds.push(newTag.id)
        tagNameToId.set(trimmed, newTag.id)
      }
    }

    createdProduct = await createProduct({
      product: {
        name: product.name.trim(),
        image:
          typeof product.image === "string"
            ? product.image.trim() === ""
              ? null
              : product.image.trim()
            : null,
        tagIds,
        price: product.price,
        stock: product.stock,
      },
      dbClient: tx,
    })
  })
  return createdProduct
}
