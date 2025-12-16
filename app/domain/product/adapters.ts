import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm"
import {
  productCountPerProductTagTable,
  productCountPerStoreTable,
  productImageTable,
  productTable,
  productTagCountPerStoreTable,
  productTagRelationTable,
  productTagTable,
} from "../../libs/db/schema"
import type { ProductTag } from "./entities"
import type { Repository } from "./repository"

export const adapters = {
  findProductById: async ({ dbClient, product }) => {
    const dbProduct = await dbClient.query.productTable.findFirst({
      where: eq(productTable.id, product.id),
      with: {
        productTags: {
          columns: {
            tagId: true,
          },
        },
      },
    })
    if (!dbProduct) return { ok: false, message: "商品が見つかりません。" }

    return {
      ok: true,
      value: {
        id: dbProduct.id,
        name: dbProduct.name,
        tagIds: dbProduct.productTags.map((tag) => tag.tagId),
        price: dbProduct.price,
        stock: dbProduct.stock,
      },
    }
  },

  findProductByName: async ({ dbClient, product }) => {
    const dbProduct = await dbClient.query.productTable.findFirst({
      where: eq(productTable.name, product.name),
      with: {
        productTags: {
          columns: {
            tagId: true,
          },
        },
      },
    })
    if (!dbProduct) return { ok: false, message: "商品が見つかりません。" }

    return {
      ok: true,
      value: {
        id: dbProduct.id,
        name: dbProduct.name,
        tagIds: dbProduct.productTags.map((tag) => tag.tagId),
        price: dbProduct.price,
        stock: dbProduct.stock,
      },
    }
  },

  findAllProductsOrderByIdAsc: async ({ dbClient, pagination }) => {
    const dbProducts = await dbClient.query.productTable.findMany({
      with: {
        productTags: {
          columns: {
            tagId: true,
          },
        },
      },
      orderBy: [asc(productTable.id)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return {
      ok: true,
      value: dbProducts.map((dbProduct) => ({
        id: dbProduct.id,
        name: dbProduct.name,
        tagIds: dbProduct.productTags.map((tag) => tag.tagId),
        price: dbProduct.price,
        stock: dbProduct.stock,
      })),
    }
  },

  findAllProductsOrderByIdDesc: async ({ dbClient, pagination }) => {
    const dbProducts = await dbClient.query.productTable.findMany({
      with: {
        productTags: {
          columns: {
            tagId: true,
          },
        },
      },
      orderBy: [desc(productTable.id)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return {
      ok: true,
      value: dbProducts.map((dbProduct) => ({
        id: dbProduct.id,
        name: dbProduct.name,
        tagIds: dbProduct.productTags.map((tag) => tag.tagId),
        price: dbProduct.price,
        stock: dbProduct.stock,
      })),
    }
  },

  findAllProductStocks: async ({ dbClient, pagination }) => {
    const dbProducts = await dbClient.query.productTable.findMany({
      columns: {
        stock: true,
      },
      orderBy: [asc(productTable.id)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return {
      ok: true,
      value: dbProducts.map((dbProduct) => ({
        stock: dbProduct.stock,
      })),
    }
  },

  findAllProductsByIds: async ({ dbClient, product, pagination }) => {
    const dbProducts = await dbClient.query.productTable.findMany({
      where: inArray(productTable.id, product.ids),
      with: {
        productTags: {
          columns: {
            tagId: true,
          },
        },
      },
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return {
      ok: true,
      value: dbProducts.map((dbProduct) => ({
        id: dbProduct.id,
        name: dbProduct.name,
        tagIds: dbProduct.productTags.map((tag) => tag.tagId),
        price: dbProduct.price,
        stock: dbProduct.stock,
      })),
    }
  },

  findProductTagById: async ({ dbClient, productTag }) => {
    const dbProductTag = await dbClient.query.productTagTable.findFirst({
      where: eq(productTagTable.id, productTag.id),
    })
    if (!dbProductTag)
      return { ok: false, message: "商品タグが見つかりません。" }
    return { ok: true, value: { id: dbProductTag.id, name: dbProductTag.name } }
  },

  findAllProductTags: async ({ dbClient, pagination }) => {
    const dbProductTags = await dbClient.query.productTagTable.findMany({
      orderBy: [asc(productTagTable.id)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return {
      ok: true,
      value: dbProductTags.map((dbProductTag) => ({
        id: dbProductTag.id,
        name: dbProductTag.name,
      })),
    }
  },

  findAllProductTagsByIds: async ({ dbClient, productTag, pagination }) => {
    const dbProductTags = await dbClient.query.productTagTable.findMany({
      where: inArray(productTagTable.id, productTag.ids),
      orderBy: [asc(productTagTable.id)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return {
      ok: true,
      value: dbProductTags.map((dbProductTag) => ({
        id: dbProductTag.id,
        name: dbProductTag.name,
      })),
    }
  },

  getProductCountByStoreId: async ({ dbClient, store }) => {
    const row = await dbClient.query.productCountPerStoreTable.findFirst({
      where: eq(productCountPerStoreTable.storeId, store.id),
    })
    return { ok: true, value: row ? row.productCount : 0 }
  },

  getProductTagCountByStoreId: async ({ dbClient, store }) => {
    const row = await dbClient.query.productTagCountPerStoreTable.findFirst({
      where: eq(productTagCountPerStoreTable.storeId, store.id),
    })
    return { ok: true, value: row ? row.productTagCount : 0 }
  },

  getAllProductTagRelationCountsByTagIds: async ({
    dbClient,
    productTag,
    pagination,
  }) => {
    const rows = await dbClient.query.productCountPerProductTagTable.findMany({
      where: inArray(productCountPerProductTagTable.tagId, productTag.ids),
      orderBy: [asc(productCountPerProductTagTable.tagId)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return {
      ok: true,
      value: rows.map((r) => ({ tagId: r.tagId, count: r.productCount })),
    }
  },

  findProductImageByProductId: async ({ dbClient, productImage }) => {
    const dbProductImage = await dbClient.query.productImageTable.findFirst({
      where: eq(productImageTable.productId, productImage.productId),
    })
    if (!dbProductImage)
      return { ok: false, message: "商品画像が見つかりません。" }

    return {
      ok: true,
      value: {
        id: dbProductImage.id,
        productId: dbProductImage.productId,
        data: dbProductImage.data,
        mimeType: dbProductImage.mimeType,
        createdAt: dbProductImage.createdAt,
        updatedAt: dbProductImage.updatedAt,
      },
    }
  },

  createProduct: async ({ dbClient, product }) => {
    const dbProduct = (
      await dbClient
        .insert(productTable)
        .values({
          name: product.name,
          price: product.price,
          stock: product.stock,
        })
        .returning()
    )[0]
    if (!dbProduct) {
      return { ok: false, message: "エラーが発生しました。" }
    }

    if (product.tagIds && product.tagIds.length > 0) {
      const rows = product.tagIds.map((tagId) => ({
        productId: dbProduct.id,
        tagId,
      }))
      await dbClient.insert(productTagRelationTable).values(rows)
    }

    return {
      ok: true,
      value: {
        id: dbProduct.id,
        name: dbProduct.name,
        tagIds: product.tagIds,
        price: dbProduct.price,
        stock: dbProduct.stock,
      },
    }
  },

  updateProduct: async ({ dbClient, product }) => {
    const dbProduct = (
      await dbClient
        .update(productTable)
        .set({
          name: product.name,
          price: product.price,
          stock: product.stock,
        })
        .where(eq(productTable.id, product.id))
        .returning()
    )[0]
    if (!dbProduct) {
      return { ok: false, message: "エラーが発生しました。" }
    }

    const updatedTagIds = await ("tagIds" in product
      ? (async () => {
          await dbClient
            .delete(productTagRelationTable)
            .where(eq(productTagRelationTable.productId, product.id))

          if (!product.tagIds || product.tagIds.length === 0) {
            return []
          }

          const rows = product.tagIds.map((tagId) => ({
            productId: product.id,
            tagId,
          }))
          const relations = await dbClient
            .insert(productTagRelationTable)
            .values(rows)
            .returning()
          return relations.map((relation) => relation.tagId)
        })()
      : (async () => {
          const existingRelations = await dbClient
            .select()
            .from(productTagRelationTable)
            .where(eq(productTagRelationTable.productId, product.id))
          return existingRelations.map((relation) => relation.tagId)
        })())

    return {
      ok: true,
      value: {
        id: dbProduct.id,
        name: dbProduct.name,
        tagIds: updatedTagIds,
        price: dbProduct.price,
        stock: dbProduct.stock,
      },
    }
  },

  deleteProduct: async ({ dbClient, product }) => {
    await dbClient.delete(productTable).where(eq(productTable.id, product.id))
    await dbClient
      .delete(productTagRelationTable)
      .where(eq(productTagRelationTable.productId, product.id))
    return { ok: true, value: undefined }
  },

  createProductTag: async ({ dbClient, productTag }) => {
    const dbProductTag = (
      await dbClient
        .insert(productTagTable)
        .values({ name: productTag.name })
        .returning()
    )[0]
    if (!dbProductTag) {
      return { ok: false, message: "エラーが発生しました。" }
    }
    const newTag: ProductTag = {
      id: dbProductTag.id,
      name: dbProductTag.name,
    }
    return { ok: true, value: newTag }
  },

  deleteAllProductTagsByIds: async ({ dbClient, productTag }) => {
    await dbClient
      .delete(productTagTable)
      .where(inArray(productTagTable.id, productTag.ids))
    await dbClient
      .delete(productTagRelationTable)
      .where(inArray(productTagRelationTable.tagId, productTag.ids))
    return { ok: true, value: undefined }
  },

  createProductImage: async ({ dbClient, productImage }) => {
    const dbProductImage = (
      await dbClient
        .insert(productImageTable)
        .values({
          productId: productImage.productId,
          data: productImage.data,
          mimeType: productImage.mimeType,
        })
        .returning()
    )[0]

    if (!dbProductImage) {
      return { ok: false, message: "エラーが発生しました。" }
    }

    return {
      ok: true,
      value: {
        id: dbProductImage.id,
        productId: dbProductImage.productId,
        data: dbProductImage.data,
        mimeType: dbProductImage.mimeType,
        createdAt: dbProductImage.createdAt,
        updatedAt: dbProductImage.updatedAt,
      },
    }
  },

  updateProductImageByProductId: async ({ dbClient, productImage }) => {
    const dbProductImage = (
      await dbClient
        .update(productImageTable)
        .set({
          data: productImage.data,
          mimeType: productImage.mimeType,
          updatedAt: new Date(),
        })
        .where(eq(productImageTable.productId, productImage.productId))
        .returning()
    )[0]

    if (!dbProductImage) {
      return { ok: false, message: "エラーが発生しました。" }
    }
    return {
      ok: true,
      value: {
        id: dbProductImage.id,
        productId: dbProductImage.productId,
        data: dbProductImage.data,
        mimeType: dbProductImage.mimeType,
        createdAt: dbProductImage.createdAt,
        updatedAt: dbProductImage.updatedAt,
      },
    }
  },

  deleteProductImageByProductId: async ({ dbClient, productImage }) => {
    await dbClient
      .delete(productImageTable)
      .where(eq(productImageTable.productId, productImage.productId))
    return { ok: true, value: undefined }
  },

  incrementProductCountByStoreId: async ({ dbClient, store }) => {
    await dbClient
      .insert(productCountPerStoreTable)
      .values({
        storeId: store.id,
        productCount: store.delta,
        updatedAt: store.updatedAt,
      })
      .onConflictDoUpdate({
        target: [productCountPerStoreTable.storeId],
        set: {
          productCount: sql.raw(
            `product_count_per_store.${productCountPerStoreTable.productCount.name} + excluded.${productCountPerStoreTable.productCount.name}`,
          ),
          updatedAt: sql.raw(
            `excluded.${productCountPerStoreTable.updatedAt.name}`,
          ),
        },
      })
    return { ok: true, value: undefined }
  },

  decrementProductCountByStoreId: async ({ dbClient, store }) => {
    const delta = store.delta
    await dbClient
      .insert(productCountPerStoreTable)
      .values({
        storeId: store.id,
        productCount: delta,
        updatedAt: store.updatedAt,
      })
      .onConflictDoUpdate({
        target: [productCountPerStoreTable.storeId],
        set: {
          productCount: sql.raw(
            `GREATEST(0, product_count_per_store.${productCountPerStoreTable.productCount.name} - excluded.${productCountPerStoreTable.productCount.name})`,
          ),
          updatedAt: sql.raw(
            `excluded.${productCountPerStoreTable.updatedAt.name}`,
          ),
        },
      })
    return { ok: true, value: undefined }
  },

  incrementProductTagCountByStoreId: async ({ dbClient, store }) => {
    await dbClient
      .insert(productTagCountPerStoreTable)
      .values({
        storeId: store.id,
        productTagCount: store.delta,
        updatedAt: store.updatedAt,
      })
      .onConflictDoUpdate({
        target: [productTagCountPerStoreTable.storeId],
        set: {
          productTagCount: sql.raw(
            `product_tag_count_per_store.${productTagCountPerStoreTable.productTagCount.name} + excluded.${productTagCountPerStoreTable.productTagCount.name}`,
          ),
          updatedAt: sql.raw(
            `excluded.${productTagCountPerStoreTable.updatedAt.name}`,
          ),
        },
      })
    return { ok: true, value: undefined }
  },

  decrementProductTagCountByStoreId: async ({ dbClient, store }) => {
    const delta = store.delta
    await dbClient
      .insert(productTagCountPerStoreTable)
      .values({
        storeId: store.id,
        productTagCount: delta,
        updatedAt: store.updatedAt,
      })
      .onConflictDoUpdate({
        target: [productTagCountPerStoreTable.storeId],
        set: {
          productTagCount: sql.raw(
            `GREATEST(0, product_tag_count_per_store.${productTagCountPerStoreTable.productTagCount.name} - excluded.${productTagCountPerStoreTable.productTagCount.name})`,
          ),
          updatedAt: sql.raw(
            `excluded.${productTagCountPerStoreTable.updatedAt.name}`,
          ),
        },
      })
    return { ok: true, value: undefined }
  },

  incrementAllProductTagRelationCountsByTagIds: async ({
    dbClient,
    productTags,
  }) => {
    if (productTags.length > 0) {
      const rows = productTags.map((p) => ({
        tagId: p.id,
        productCount: p.delta,
        updatedAt: p.updatedAt,
      }))
      await dbClient
        .insert(productCountPerProductTagTable)
        .values(rows)
        .onConflictDoUpdate({
          target: [productCountPerProductTagTable.tagId],
          set: {
            productCount: sql.raw(
              `product_count_per_product_tag.${productCountPerProductTagTable.productCount.name} + excluded.${productCountPerProductTagTable.productCount.name}`,
            ),
            updatedAt: sql.raw(
              `excluded.${productCountPerProductTagTable.updatedAt.name}`,
            ),
          },
        })
    }
    return { ok: true, value: undefined }
  },

  decrementAllProductTagRelationCountsByTagIds: async ({
    dbClient,
    productTags,
  }) => {
    if (productTags.length > 0) {
      const rows = productTags.map((p) => ({
        tagId: p.id,
        productCount: p.delta,
        updatedAt: p.updatedAt,
      }))
      await dbClient
        .insert(productCountPerProductTagTable)
        .values(rows)
        .onConflictDoUpdate({
          target: [productCountPerProductTagTable.tagId],
          set: {
            productCount: sql.raw(
              `GREATEST(0, product_count_per_product_tag.${productCountPerProductTagTable.productCount.name} - excluded.${productCountPerProductTagTable.productCount.name})`,
            ),
            updatedAt: sql.raw(
              `excluded.${productCountPerProductTagTable.updatedAt.name}`,
            ),
          },
        })

      const tagIds = productTags.map((p) => p.id)
      await dbClient
        .delete(productCountPerProductTagTable)
        .where(
          and(
            inArray(productCountPerProductTagTable.tagId, tagIds),
            lte(productCountPerProductTagTable.productCount, 0),
          ),
        )
    }

    return { ok: true, value: undefined }
  },
} satisfies Repository
