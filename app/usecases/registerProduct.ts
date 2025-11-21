import { MAX_STORE_PRODUCT_TAG_COUNT } from "../domain/product/constants"
import type Product from "../domain/product/entities/product"
import type ProductImage from "../domain/product/entities/productImage"
import {
  createProduct,
  updateProduct,
} from "../domain/product/repositories/productCommandRepository"
import {
  createProductImage,
  deleteProductImageByProductId,
  updateProductImageByProductId,
} from "../domain/product/repositories/productImageCommandRepository"
import { findProductImageByProductId } from "../domain/product/repositories/productImageQueryRepository"
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

type ProductImageInput =
  | Pick<ProductImage, "data" | "mimeType">
  | null
  | undefined

export type CreateProductPayload = Omit<Product, "tagIds" | "id"> & {
  tags: string[]
  image?: ProductImageInput
}

export type UpdateProductPayload = { id: number } & Partial<
  Omit<Product, "tagIds" | "id">
> & {
    tags?: string[]
    image?: ProductImageInput
  }

export type RegisterProductPayload = CreateProductPayload | UpdateProductPayload

const isUpdatePayload = (
  p: RegisterProductPayload,
): p is UpdateProductPayload =>
  typeof (p as UpdateProductPayload).id === "number"

export type RegisterProductParams = {
  dbClient: DbClient
  product: RegisterProductPayload
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
          tagIds: tagIds ?? undefined,
          price: updatePayload.price ?? undefined,
          stock: updatePayload.stock ?? undefined,
        },
        dbClient: tx,
      })

      if (updatedProduct && updatePayload.image !== undefined) {
        if (updatePayload.image === null) {
          await deleteProductImageByProductId({
            dbClient: tx,
            productImage: { productId: updatePayload.id },
          })
        } else {
          const existingImage = await findProductImageByProductId({
            dbClient: tx,
            productImage: { productId: updatePayload.id },
          })
          if (existingImage) {
            await updateProductImageByProductId({
              dbClient: tx,
              productImage: {
                productId: updatePayload.id,
                data: updatePayload.image.data,
                mimeType: updatePayload.image.mimeType,
                updatedAt: new Date(),
              },
            })
          } else {
            await createProductImage({
              dbClient: tx,
              productImage: {
                productId: updatePayload.id,
                data: updatePayload.image.data,
                mimeType: updatePayload.image.mimeType,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            })
          }
        }
      }
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
        tagIds,
        price: createPayload.price,
        stock: createPayload.stock,
      },
      dbClient: tx,
    })

    if (createdProduct && createPayload.image) {
      await createProductImage({
        dbClient: tx,
        productImage: {
          productId: createdProduct.id,
          data: createPayload.image.data,
          mimeType: createPayload.image.mimeType,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    }
  })
  return createdProduct
}
