import type { TransactionDbClient } from "../../infrastructure/db/client"
import { countStringLength } from "../../utils/text"
import type {
  CommandRepositoryFunction,
  PaginatedQueryRepositoryFunction,
  QueryRepositoryFunction,
} from "../types"
import {
  MAX_PRODUCT_PRICE,
  MAX_PRODUCT_STOCK,
  MAX_STORE_PRODUCT_COUNT,
  MAX_STORE_PRODUCT_TAG_COUNT,
  MAX_TAGS_PER_PRODUCT,
} from "./constants"
import type Product from "./entities/product"
import type ProductImage from "./entities/productImage"
import type ProductTag from "./entities/productTag"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

// base64エンコード後のサイズは元のバイナリサイズの約133%になるため、逆算（10MB / 1.33 ≈ 7.5MB）して厳しめに設定する
const MAX_IMAGE_SIZE = Math.floor(7.5 * 1024 * 1024)

export type Repositories = {
  // Query
  findProductById: QueryRepositoryFunction<
    { product: Pick<Product, "id"> },
    Product | null
  >
  findProductByName: QueryRepositoryFunction<
    { product: Pick<Product, "name"> },
    Product | null
  >
  findAllProductsByIds: PaginatedQueryRepositoryFunction<
    { product: { ids: Product["id"][] } },
    Product
  >
  findAllProductsOrderByIdAsc: PaginatedQueryRepositoryFunction<
    Record<string, never>,
    Product
  >
  findAllProductsOrderByIdDesc: PaginatedQueryRepositoryFunction<
    Record<string, never>,
    Product
  >
  findAllProductStocks: PaginatedQueryRepositoryFunction<
    Record<string, never>,
    Pick<Product, "stock">
  >
  countProducts: QueryRepositoryFunction<Record<string, never>, number>
  findProductTagById: QueryRepositoryFunction<
    { productTag: Pick<ProductTag, "id"> },
    ProductTag | null
  >
  findAllProductTags: PaginatedQueryRepositoryFunction<
    Record<string, never>,
    ProductTag
  >
  findAllProductTagsByIds: PaginatedQueryRepositoryFunction<
    { productTag: { ids: ProductTag["id"][] } },
    ProductTag
  >
  findAllProductTagRelationCountsByTagIds: PaginatedQueryRepositoryFunction<
    { productTag: { ids: ProductTag["id"][] } },
    { tagId: ProductTag["id"]; count: number }
  >
  countProductTags: QueryRepositoryFunction<Record<string, never>, number>
  findProductImageByProductId: QueryRepositoryFunction<
    { productImage: Pick<ProductImage, "productId"> },
    ProductImage | null
  >

  // Command
  createProduct: CommandRepositoryFunction<
    { product: Omit<Product, "id"> },
    Product | null
  >
  updateProduct: CommandRepositoryFunction<
    { product: Pick<Product, "id"> & Partial<Omit<Product, "id">> },
    Product | null
  >
  deleteProduct: CommandRepositoryFunction<
    { product: Pick<Product, "id"> },
    void
  >
  createProductTag: CommandRepositoryFunction<
    { productTag: Omit<ProductTag, "id"> },
    ProductTag
  >
  deleteAllProductTagsByIds: CommandRepositoryFunction<
    { productTag: { ids: ProductTag["id"][] } },
    void
  >
  createProductImage: CommandRepositoryFunction<
    { productImage: Omit<ProductImage, "id"> },
    ProductImage | null
  >
  updateProductImageByProductId: CommandRepositoryFunction<
    {
      productImage: Pick<ProductImage, "productId" | "updatedAt"> &
        Partial<Pick<ProductImage, "data" | "mimeType">>
    },
    ProductImage | null
  >
  deleteProductImageByProductId: CommandRepositoryFunction<
    { productImage: Pick<ProductImage, "productId"> },
    void
  >
}

export const createRepositories = (repositoryAdapters: Repositories) => {
  const validateProduct = (product: Partial<Omit<Product, "id">>) => {
    if (product.name !== undefined) {
      if (
        countStringLength(product.name) < 1 ||
        countStringLength(product.name) > 50
      ) {
        throw new Error("商品名は1文字以上50文字以内である必要があります")
      }
    }
    if (product.tagIds !== undefined) {
      if (product.tagIds.length > MAX_TAGS_PER_PRODUCT) {
        throw new Error(
          `商品タグは${MAX_TAGS_PER_PRODUCT}個以内である必要があります`,
        )
      }
      if (
        product.tagIds.some((tagId) => !Number.isInteger(tagId) || tagId < 1)
      ) {
        throw new Error("タグIDは1以上の整数の配列である必要があります")
      }
    }
    if (product.price !== undefined) {
      if (product.price < 0 || !Number.isInteger(product.price)) {
        throw new Error("価格は0以上の整数である必要があります")
      }
      if (product.price > MAX_PRODUCT_PRICE) {
        throw new Error(`価格は${MAX_PRODUCT_PRICE}以下である必要があります`)
      }
    }
    if (product.stock !== undefined) {
      if (product.stock < 0 || !Number.isInteger(product.stock)) {
        throw new Error("在庫数は0以上の整数である必要があります")
      }
      if (product.stock > MAX_PRODUCT_STOCK) {
        throw new Error(`在庫数は${MAX_PRODUCT_STOCK}以下である必要があります`)
      }
    }
  }
  const verifyAllTagIdsExist = async (
    dbClient: TransactionDbClient,
    tagIds: Product["tagIds"],
  ) => {
    const tags = await repositories.findAllProductTags({
      dbClient,
      pagination: { offset: 0, limit: MAX_STORE_PRODUCT_TAG_COUNT },
    })
    const tagIdSet = new Set(tags.map((tag) => tag.id))
    if (tagIds.some((tagId) => !tagIdSet.has(tagId))) {
      throw new Error("タグIDは存在するタグのIDを参照する必要があります")
    }
  }
  const verifyProductNameUnique = async (
    dbClient: TransactionDbClient,
    name: Product["name"],
    excludeId?: Product["id"],
  ) => {
    const existingProduct = await repositories.findProductByName({
      product: { name },
      dbClient,
    })
    if (existingProduct && existingProduct.id !== excludeId) {
      throw new Error("同じ名前の商品が既に存在します")
    }
  }
  const verifyProductCountLimit = async (dbClient: TransactionDbClient) => {
    const totalProducts = await repositories.countProducts({ dbClient })
    if (totalProducts >= MAX_STORE_PRODUCT_COUNT) {
      throw new Error(
        `1店舗あたりの商品数は${MAX_STORE_PRODUCT_COUNT}件までです`,
      )
    }
  }
  const validateProductTag = (tag: Omit<ProductTag, "id">) => {
    if (countStringLength(tag.name) < 1 || countStringLength(tag.name) > 50) {
      throw new Error("タグ名は1文字以上50文字以内である必要があります")
    }
  }
  const verifyProductTagCountLimit = async (dbClient: TransactionDbClient) => {
    const totalTags = await repositories.countProductTags({ dbClient })
    if (totalTags >= MAX_STORE_PRODUCT_TAG_COUNT) {
      throw new Error(
        `1店舗あたりの商品タグは${MAX_STORE_PRODUCT_TAG_COUNT}個までです`,
      )
    }
  }
  const deleteOrphanedTags = async (
    dbClient: TransactionDbClient,
    tagIds: number[],
  ) => {
    if (tagIds.length === 0) {
      return
    }

    const tagRelationCounts =
      await repositories.findAllProductTagRelationCountsByTagIds({
        dbClient,
        productTag: { ids: tagIds },
        pagination: { offset: 0, limit: tagIds.length },
      })

    const orphanedTagIds = tagRelationCounts
      .filter((tagCount) => tagCount.count <= 1)
      .map((tagCount) => tagCount.tagId)

    if (orphanedTagIds.length > 0) {
      await repositories.deleteAllProductTagsByIds({
        productTag: { ids: orphanedTagIds },
        dbClient,
      })
    }
  }

  const validateProductImage = (
    image: Partial<Pick<ProductImage, "data" | "mimeType">>,
  ): void => {
    if (image.mimeType !== undefined) {
      if (!ALLOWED_MIME_TYPES.includes(image.mimeType)) {
        throw new Error(
          `画像のMIMEタイプは${ALLOWED_MIME_TYPES.join(", ")}のいずれかである必要があります`,
        )
      }
      if (countStringLength(image.mimeType) > 100) {
        throw new Error("MIMEタイプは100文字以内である必要があります")
      }
    }
    if (image.data !== undefined) {
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(image.data)) {
        throw new Error("画像データの形式が不正です")
      }
      if (image.data.length > MAX_IMAGE_SIZE) {
        throw new Error(
          `画像データのサイズは約${MAX_IMAGE_SIZE / 1024 / 1024}MB以内である必要があります`,
        )
      }
    }
  }

  const repositories = {
    findProductById: async ({ dbClient, product }) => {
      return repositoryAdapters.findProductById({ dbClient, product })
    },
    findProductByName: async ({ dbClient, product }) => {
      return repositoryAdapters.findProductByName({ dbClient, product })
    },
    findAllProductsByIds: async ({ dbClient, product, pagination }) => {
      return repositoryAdapters.findAllProductsByIds({
        dbClient,
        product,
        pagination,
      })
    },
    findAllProductsOrderByIdAsc: async ({ dbClient, pagination }) => {
      return repositoryAdapters.findAllProductsOrderByIdAsc({
        dbClient,
        pagination,
      })
    },
    findAllProductsOrderByIdDesc: async ({ dbClient, pagination }) => {
      return repositoryAdapters.findAllProductsOrderByIdDesc({
        dbClient,
        pagination,
      })
    },
    findAllProductStocks: async ({ dbClient, pagination }) => {
      return repositoryAdapters.findAllProductStocks({ dbClient, pagination })
    },
    countProducts: async ({ dbClient }) => {
      return repositoryAdapters.countProducts({ dbClient })
    },
    findProductTagById: async ({ dbClient, productTag }) => {
      return repositoryAdapters.findProductTagById({ dbClient, productTag })
    },
    findAllProductTags: async ({ dbClient, pagination }) => {
      return repositoryAdapters.findAllProductTags({ dbClient, pagination })
    },
    findAllProductTagsByIds: async ({ dbClient, productTag, pagination }) => {
      return repositoryAdapters.findAllProductTagsByIds({
        dbClient,
        productTag,
        pagination,
      })
    },
    findAllProductTagRelationCountsByTagIds: async ({
      dbClient,
      productTag,
      pagination,
    }) => {
      return repositoryAdapters.findAllProductTagRelationCountsByTagIds({
        dbClient,
        productTag,
        pagination,
      })
    },
    countProductTags: async ({ dbClient }) => {
      return repositoryAdapters.countProductTags({ dbClient })
    },
    findProductImageByProductId: async ({ dbClient, productImage }) => {
      return repositoryAdapters.findProductImageByProductId({
        dbClient,
        productImage,
      })
    },
    createProduct: async ({ dbClient, product }) => {
      validateProduct(product)
      await verifyProductCountLimit(dbClient)
      await verifyProductNameUnique(dbClient, product.name)
      await verifyAllTagIdsExist(dbClient, product.tagIds)
      return repositoryAdapters.createProduct({ product, dbClient })
    },
    updateProduct: async ({ dbClient, product }) => {
      const foundProduct = await repositories.findProductById({
        dbClient,
        product: { id: product.id },
      })
      if (!foundProduct) {
        throw new Error("商品が見つかりません")
      }

      validateProduct(product)
      if (product.name) {
        await verifyProductNameUnique(dbClient, product.name, product.id)
      }
      if (product.tagIds) {
        await verifyAllTagIdsExist(dbClient, product.tagIds)
      }

      if (product.tagIds !== undefined) {
        const oldTagIds = foundProduct.tagIds
        const removedTagIds = oldTagIds.filter(
          (tagId) => !product.tagIds?.includes(tagId),
        )
        await deleteOrphanedTags(dbClient, removedTagIds)
      }

      return repositoryAdapters.updateProduct({ product, dbClient })
    },
    deleteProduct: async ({ product, dbClient }) => {
      const foundProduct = await repositories.findProductById({
        dbClient,
        product: { id: product.id },
      })
      if (!foundProduct) {
        throw new Error("商品が見つかりません")
      }

      await repositories.deleteProductImageByProductId({
        productImage: { productId: product.id },
        dbClient,
      })

      await deleteOrphanedTags(dbClient, foundProduct.tagIds)
      await repositoryAdapters.deleteProduct({ product, dbClient })
    },
    createProductTag: async ({ dbClient, productTag }) => {
      validateProductTag(productTag)
      await verifyProductTagCountLimit(dbClient)
      return repositoryAdapters.createProductTag({ productTag, dbClient })
    },
    deleteAllProductTagsByIds: async ({ dbClient, productTag }) => {
      return repositoryAdapters.deleteAllProductTagsByIds({
        dbClient,
        productTag,
      })
    },
    createProductImage: async ({ dbClient, productImage }) => {
      validateProductImage({
        data: productImage.data,
        mimeType: productImage.mimeType,
      })
      return repositoryAdapters.createProductImage({ dbClient, productImage })
    },
    updateProductImageByProductId: async ({ dbClient, productImage }) => {
      validateProductImage({
        data: productImage.data,
        mimeType: productImage.mimeType,
      })
      return repositoryAdapters.updateProductImageByProductId({
        dbClient,
        productImage,
      })
    },
    deleteProductImageByProductId: async ({ dbClient, productImage }) => {
      return repositoryAdapters.deleteProductImageByProductId({
        dbClient,
        productImage,
      })
    },
  } satisfies Repositories

  return repositories
}
