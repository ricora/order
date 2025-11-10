import { MAX_STORE_PRODUCT_TAG_COUNT } from "../domain/product/constants"
import type Product from "../domain/product/entities/product"
import {
  createProduct,
  updateProduct,
} from "../domain/product/repositories/productCommandRepository"
import { createProductTag } from "../domain/product/repositories/productTagCommandRepository"
import { findAllProductTags } from "../domain/product/repositories/productTagQueryRepository"
import type { DbClient, TransactionDbClient } from "../infrastructure/db/client"

const resolveTagNamesToIds = async ({
  dbClient,
  tagNames,
}: {
  dbClient: TransactionDbClient
  tagNames: string[]
}): Promise<number[]> => {
  if (!tagNames || tagNames.length === 0) return []

  const tags = await findAllProductTags({
    dbClient,
    pagination: { offset: 0, limit: MAX_STORE_PRODUCT_TAG_COUNT },
  })
  const tagNameToId = new Map(tags.map((tag) => [tag.name, tag.id]))
  const tagIds: number[] = []
  for (const tagName of tagNames) {
    const trimmed = tagName.trim()
    if (!trimmed) continue
    const id = tagNameToId.get(trimmed)
    if (id !== undefined) {
      tagIds.push(id)
    } else {
      const newTag = await createProductTag({
        productTag: { name: trimmed },
        dbClient,
      })
      tagIds.push(newTag.id)
      tagNameToId.set(trimmed, newTag.id)
    }
  }
  return tagIds
}

type CreateProductPayload = Omit<Product, "tagIds" | "id"> & {
  tags: string[]
}

type UpdateProductPayload = { id: number } & Partial<
  Omit<Product, "tagIds" | "id">
> & {
    tags?: string[]
  }

const isUpdatePayload = (
  p: CreateProductPayload | UpdateProductPayload,
): p is UpdateProductPayload =>
  typeof (p as UpdateProductPayload).id === "number"

export type RegisterProductParams = {
  dbClient: DbClient
  product: CreateProductPayload | UpdateProductPayload
}

export const registerProduct = async ({
  dbClient,
  product,
}: RegisterProductParams): Promise<Product | null> => {
  if (isUpdatePayload(product)) {
    const updatePayload = product
    let updatedProduct: Product | null = null
    await dbClient.transaction(async (tx) => {
      let tagIds: number[] | undefined
      if (updatePayload.tags !== undefined) {
        tagIds = await resolveTagNamesToIds({
          dbClient: tx,
          tagNames: updatePayload.tags,
        })
      }

      updatedProduct = await updateProduct({
        product: {
          id: updatePayload.id,
          name:
            updatePayload.name !== undefined
              ? updatePayload.name.trim()
              : undefined,
          image:
            updatePayload.image !== undefined
              ? typeof updatePayload.image === "string"
                ? updatePayload.image.trim() === ""
                  ? null
                  : updatePayload.image.trim()
                : updatePayload.image
              : undefined,
          tagIds: tagIds ?? undefined,
          price: updatePayload.price ?? undefined,
          stock: updatePayload.stock ?? undefined,
        },
        dbClient: tx,
      })
    })
    return updatedProduct
  }

  const createPayload = product
  let createdProduct: Product | null = null
  await dbClient.transaction(async (tx) => {
    const tagIds = await resolveTagNamesToIds({
      dbClient: tx,
      tagNames: createPayload.tags,
    })

    createdProduct = await createProduct({
      product: {
        name: createPayload.name.trim(),
        image:
          typeof createPayload.image === "string"
            ? createPayload.image.trim() === ""
              ? null
              : createPayload.image.trim()
            : null,
        tagIds,
        price: createPayload.price,
        stock: createPayload.stock,
      },
      dbClient: tx,
    })
  })
  return createdProduct
}
