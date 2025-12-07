import type { TransactionDbClient } from "../../libs/db/client"
import { countStringLength } from "../../utils/text"
import type {
  CommandRepositoryFunction,
  PaginatedQueryRepositoryFunction,
  QueryRepositoryFunction,
  Result,
} from "../types"
import {
  ALLOWED_PRODUCT_IMAGE_MIME_TYPES,
  MAX_PRODUCT_IMAGE_BASE64_SIZE,
  MAX_PRODUCT_PRICE,
  MAX_PRODUCT_STOCK,
  MAX_STORE_PRODUCT_COUNT,
  MAX_STORE_PRODUCT_TAG_COUNT,
  MAX_TAGS_PER_PRODUCT,
} from "./constants"
import type Product from "./entities/product"
import type ProductImage from "./entities/productImage"
import type ProductTag from "./entities/productTag"

type CommonProductValidationError =
  | "商品名は1文字以上50文字以内である必要があります"
  | `商品タグは${typeof MAX_TAGS_PER_PRODUCT}個以内である必要があります`
  | "タグIDは1以上の整数の配列である必要があります"
  | "価格は0以上の整数である必要があります"
  | `価格は${typeof MAX_PRODUCT_PRICE}以下である必要があります`
  | "在庫数は0以上の整数である必要があります"
  | `在庫数は${typeof MAX_PRODUCT_STOCK}以下である必要があります`
  | "タグIDは存在するタグのIDを参照する必要があります"
  | "タグ名は1文字以上50文字以内である必要があります"
  | `1店舗あたりの商品タグは${typeof MAX_STORE_PRODUCT_TAG_COUNT}個までです`
  | "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります"
  | "画像データの形式が不正です"
  | "画像データのサイズは約7.5MB以内である必要があります"
  | `1店舗あたりの商品数は${typeof MAX_STORE_PRODUCT_COUNT}件までです`
  | "同じ名前の商品が既に存在します"

type CreateProductValidationError = CommonProductValidationError

type UpdateProductValidationError =
  | CommonProductValidationError
  | "商品が見つかりません"

export type Repositories = {
  // Query
  findProductById: QueryRepositoryFunction<
    { product: Pick<Product, "id"> },
    Product,
    "商品が見つかりません"
  >
  findProductByName: QueryRepositoryFunction<
    { product: Pick<Product, "name"> },
    Product,
    "商品が見つかりません"
  >
  findAllProductsByIds: PaginatedQueryRepositoryFunction<
    { product: { ids: Product["id"][] } },
    Product,
    never
  >
  findAllProductsOrderByIdAsc: PaginatedQueryRepositoryFunction<
    unknown,
    Product,
    never
  >
  findAllProductsOrderByIdDesc: PaginatedQueryRepositoryFunction<
    unknown,
    Product,
    never
  >
  findAllProductStocks: PaginatedQueryRepositoryFunction<
    unknown,
    Pick<Product, "stock">,
    never
  >
  countProducts: QueryRepositoryFunction<unknown, number, never>
  findProductTagById: QueryRepositoryFunction<
    { productTag: Pick<ProductTag, "id"> },
    ProductTag,
    "商品タグが見つかりません"
  >
  findAllProductTags: PaginatedQueryRepositoryFunction<
    unknown,
    ProductTag,
    never
  >
  findAllProductTagsByIds: PaginatedQueryRepositoryFunction<
    { productTag: { ids: ProductTag["id"][] } },
    ProductTag,
    never
  >
  findAllProductTagRelationCountsByTagIds: PaginatedQueryRepositoryFunction<
    { productTag: { ids: ProductTag["id"][] } },
    { tagId: ProductTag["id"]; count: number },
    never
  >
  countProductTags: QueryRepositoryFunction<unknown, number, never>
  findProductImageByProductId: QueryRepositoryFunction<
    { productImage: Pick<ProductImage, "productId"> },
    ProductImage,
    "商品画像が見つかりません"
  >

  // Command
  createProduct: CommandRepositoryFunction<
    { product: Omit<Product, "id"> },
    Product,
    CreateProductValidationError
  >
  updateProduct: CommandRepositoryFunction<
    { product: Pick<Product, "id"> & Partial<Omit<Product, "id">> },
    Product,
    UpdateProductValidationError
  >
  deleteProduct: CommandRepositoryFunction<
    { product: Pick<Product, "id"> },
    void,
    "商品が見つかりません"
  >
  createProductTag: CommandRepositoryFunction<
    { productTag: Omit<ProductTag, "id"> },
    ProductTag,
    CommonProductValidationError
  >
  deleteAllProductTagsByIds: CommandRepositoryFunction<
    { productTag: { ids: ProductTag["id"][] } },
    void,
    never
  >
  createProductImage: CommandRepositoryFunction<
    { productImage: Omit<ProductImage, "id"> },
    ProductImage,
    CommonProductValidationError
  >
  updateProductImageByProductId: CommandRepositoryFunction<
    {
      productImage: Pick<ProductImage, "productId" | "updatedAt"> &
        Partial<Pick<ProductImage, "data" | "mimeType">>
    },
    ProductImage,
    CommonProductValidationError
  >
  deleteProductImageByProductId: CommandRepositoryFunction<
    { productImage: Pick<ProductImage, "productId"> },
    void,
    never
  >
}

export const createRepositories = (adapters: Repositories) => {
  type CreateProductParam = Parameters<
    Repositories["createProduct"]
  >[0]["product"]
  type UpdateProductParam = Parameters<
    Repositories["updateProduct"]
  >[0]["product"]
  type CommonProductParam = CreateProductParam | UpdateProductParam

  const validateCommonProduct = (
    product: CommonProductParam,
  ): Result<void, CommonProductValidationError> => {
    if (product.name !== undefined) {
      if (
        countStringLength(product.name) < 1 ||
        countStringLength(product.name) > 50
      ) {
        return {
          ok: false,
          message: "商品名は1文字以上50文字以内である必要があります",
        }
      }
    }
    if (product.tagIds !== undefined) {
      if (product.tagIds.length > MAX_TAGS_PER_PRODUCT) {
        return {
          ok: false,
          message: `商品タグは${MAX_TAGS_PER_PRODUCT}個以内である必要があります`,
        }
      }
      if (
        product.tagIds.some((tagId) => !Number.isInteger(tagId) || tagId < 1)
      ) {
        return {
          ok: false,
          message: "タグIDは1以上の整数の配列である必要があります",
        }
      }
    }
    if (product.price !== undefined) {
      if (product.price < 0 || !Number.isInteger(product.price)) {
        return { ok: false, message: "価格は0以上の整数である必要があります" }
      }
      if (product.price > MAX_PRODUCT_PRICE) {
        return {
          ok: false,
          message: `価格は${MAX_PRODUCT_PRICE}以下である必要があります`,
        }
      }
    }
    if (product.stock !== undefined) {
      if (product.stock < 0 || !Number.isInteger(product.stock)) {
        return { ok: false, message: "在庫数は0以上の整数である必要があります" }
      }
      if (product.stock > MAX_PRODUCT_STOCK) {
        return {
          ok: false,
          message: `在庫数は${MAX_PRODUCT_STOCK}以下である必要があります`,
        }
      }
    }
    return { ok: true, value: undefined }
  }
  const verifyAllTagIdsExist = async (
    dbClient: TransactionDbClient,
    tagIds: Product["tagIds"],
  ): Promise<Result<void, CommonProductValidationError>> => {
    const tagsResult = await repositories.findAllProductTags({
      dbClient,
      pagination: { offset: 0, limit: MAX_STORE_PRODUCT_TAG_COUNT },
    })
    if (!tagsResult.ok) {
      return {
        ok: false,
        message: "タグIDは存在するタグのIDを参照する必要があります",
      }
    }
    const tagIdSet = new Set(tagsResult.value.map((tag) => tag.id))
    if (tagIds.some((tagId) => !tagIdSet.has(tagId))) {
      return {
        ok: false,
        message: "タグIDは存在するタグのIDを参照する必要があります",
      }
    }
    return { ok: true, value: undefined }
  }
  const verifyProductNameUnique = async (
    dbClient: TransactionDbClient,
    name: Product["name"],
    excludeId?: Product["id"],
  ): Promise<Result<void, CommonProductValidationError>> => {
    const existingProductResult = await repositories.findProductByName({
      product: { name },
      dbClient,
    })
    if (!existingProductResult.ok) {
      return { ok: true, value: undefined }
    }
    const existingProduct = existingProductResult.value
    if (existingProduct && existingProduct.id !== excludeId) {
      return { ok: false, message: "同じ名前の商品が既に存在します" }
    }
    return { ok: true, value: undefined }
  }
  const verifyProductCountLimit = async (
    dbClient: TransactionDbClient,
  ): Promise<Result<void, CommonProductValidationError>> => {
    const totalProductsResult = await repositories.countProducts({ dbClient })
    if (!totalProductsResult.ok)
      return {
        ok: false,
        message: `1店舗あたりの商品数は${MAX_STORE_PRODUCT_COUNT}件までです`,
      }
    if (totalProductsResult.value >= MAX_STORE_PRODUCT_COUNT) {
      return {
        ok: false,
        message: `1店舗あたりの商品数は${MAX_STORE_PRODUCT_COUNT}件までです`,
      }
    }
    return { ok: true, value: undefined }
  }
  const validateProductTag = (
    tag: Omit<ProductTag, "id">,
  ): Result<void, CommonProductValidationError> => {
    if (countStringLength(tag.name) < 1 || countStringLength(tag.name) > 50) {
      return {
        ok: false,
        message: "タグ名は1文字以上50文字以内である必要があります",
      }
    }
    return { ok: true, value: undefined }
  }
  const verifyProductTagCountLimit = async (
    dbClient: TransactionDbClient,
  ): Promise<Result<void, CommonProductValidationError>> => {
    const totalTagsResult = await repositories.countProductTags({ dbClient })
    if (!totalTagsResult.ok)
      return {
        ok: false,
        message: `1店舗あたりの商品タグは${MAX_STORE_PRODUCT_TAG_COUNT}個までです`,
      }
    if (totalTagsResult.value >= MAX_STORE_PRODUCT_TAG_COUNT) {
      return {
        ok: false,
        message: `1店舗あたりの商品タグは${MAX_STORE_PRODUCT_TAG_COUNT}個までです`,
      }
    }
    return { ok: true, value: undefined }
  }
  const deleteOrphanedTags = async (
    dbClient: TransactionDbClient,
    tagIds: number[],
  ) => {
    if (tagIds.length === 0) {
      return
    }

    const tagRelationCountsResult =
      await repositories.findAllProductTagRelationCountsByTagIds({
        dbClient,
        productTag: { ids: tagIds },
        pagination: { offset: 0, limit: tagIds.length },
      })
    if (!tagRelationCountsResult.ok) return
    const tagRelationCounts = tagRelationCountsResult.value

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
  ): Result<void, CommonProductValidationError> => {
    if (image.mimeType !== undefined) {
      if (!ALLOWED_PRODUCT_IMAGE_MIME_TYPES.has(image.mimeType)) {
        return {
          ok: false,
          message:
            "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります",
        }
      }
    }
    if (image.data !== undefined) {
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(image.data)) {
        return { ok: false, message: "画像データの形式が不正です" }
      }
      if (image.data.length > MAX_PRODUCT_IMAGE_BASE64_SIZE) {
        return {
          ok: false,
          message: "画像データのサイズは約7.5MB以内である必要があります",
        }
      }
    }
    return { ok: true, value: undefined }
  }

  const repositories = {
    findProductById: async ({ dbClient, product }) => {
      return adapters.findProductById({ dbClient, product })
    },
    findProductByName: async ({ dbClient, product }) => {
      return adapters.findProductByName({ dbClient, product })
    },
    findAllProductsByIds: async ({ dbClient, product, pagination }) => {
      return adapters.findAllProductsByIds({
        dbClient,
        product,
        pagination,
      })
    },
    findAllProductsOrderByIdAsc: async ({ dbClient, pagination }) => {
      return adapters.findAllProductsOrderByIdAsc({
        dbClient,
        pagination,
      })
    },
    findAllProductsOrderByIdDesc: async ({ dbClient, pagination }) => {
      return adapters.findAllProductsOrderByIdDesc({
        dbClient,
        pagination,
      })
    },
    findAllProductStocks: async ({ dbClient, pagination }) => {
      return adapters.findAllProductStocks({ dbClient, pagination })
    },
    countProducts: async ({ dbClient }) => {
      return adapters.countProducts({ dbClient })
    },
    findProductTagById: async ({ dbClient, productTag }) => {
      return adapters.findProductTagById({ dbClient, productTag })
    },
    findAllProductTags: async ({ dbClient, pagination }) => {
      return adapters.findAllProductTags({ dbClient, pagination })
    },
    findAllProductTagsByIds: async ({ dbClient, productTag, pagination }) => {
      return adapters.findAllProductTagsByIds({
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
      return adapters.findAllProductTagRelationCountsByTagIds({
        dbClient,
        productTag,
        pagination,
      })
    },
    countProductTags: async ({ dbClient }) => {
      return adapters.countProductTags({ dbClient })
    },
    findProductImageByProductId: async ({ dbClient, productImage }) => {
      return adapters.findProductImageByProductId({
        dbClient,
        productImage,
      })
    },
    createProduct: async ({ dbClient, product }) => {
      const validateCommonResult = validateCommonProduct(product)
      if (!validateCommonResult.ok) return validateCommonResult

      const countLimitResult = await verifyProductCountLimit(dbClient)
      if (!countLimitResult.ok) return countLimitResult

      const nameUniqueResult = await verifyProductNameUnique(
        dbClient,
        product.name,
      )
      if (!nameUniqueResult.ok) return nameUniqueResult

      if (product.tagIds) {
        const tagExistResult = await verifyAllTagIdsExist(
          dbClient,
          product.tagIds,
        )
        if (!tagExistResult.ok) return tagExistResult
      }

      return adapters.createProduct({ product, dbClient })
    },
    updateProduct: async ({ dbClient, product }) => {
      const validateCommonResult = validateCommonProduct(product)
      if (!validateCommonResult.ok) return validateCommonResult

      const foundProductResult = await repositories.findProductById({
        dbClient,
        product: { id: product.id },
      })
      if (!foundProductResult.ok) {
        return { ok: false, message: "商品が見つかりません" }
      }
      const foundProduct = foundProductResult.value

      if (product.name) {
        const nameUniqueResult = await verifyProductNameUnique(
          dbClient,
          product.name,
          product.id,
        )
        if (!nameUniqueResult.ok) return nameUniqueResult
      }
      if (product.tagIds) {
        const tagExistResult = await verifyAllTagIdsExist(
          dbClient,
          product.tagIds,
        )
        if (!tagExistResult.ok) return tagExistResult
      }

      if (product.tagIds !== undefined) {
        const oldTagIds = foundProduct.tagIds
        const removedTagIds = oldTagIds.filter(
          (tagId) => !product.tagIds?.includes(tagId),
        )
        await deleteOrphanedTags(dbClient, removedTagIds)
      }

      return adapters.updateProduct({ product, dbClient })
    },
    deleteProduct: async ({ product, dbClient }) => {
      const foundProductResult = await repositories.findProductById({
        dbClient,
        product: { id: product.id },
      })
      if (!foundProductResult.ok) {
        return { ok: false, message: "商品が見つかりません" }
      }
      const foundProduct = foundProductResult.value

      await repositories.deleteProductImageByProductId({
        productImage: { productId: product.id },
        dbClient,
      })

      await deleteOrphanedTags(dbClient, foundProduct.tagIds)
      return adapters.deleteProduct({ product, dbClient })
    },
    createProductTag: async ({ dbClient, productTag }) => {
      const validateTagResult = validateProductTag(productTag)
      if (!validateTagResult.ok) return validateTagResult

      const tagCountLimitResult = await verifyProductTagCountLimit(dbClient)
      if (!tagCountLimitResult.ok) return tagCountLimitResult

      return adapters.createProductTag({ productTag, dbClient })
    },
    deleteAllProductTagsByIds: async ({ dbClient, productTag }) => {
      return adapters.deleteAllProductTagsByIds({
        dbClient,
        productTag,
      })
    },
    createProductImage: async ({ dbClient, productImage }) => {
      const validateImageResult = validateProductImage({
        data: productImage.data,
        mimeType: productImage.mimeType,
      })
      if (!validateImageResult.ok) return validateImageResult
      return adapters.createProductImage({ dbClient, productImage })
    },
    updateProductImageByProductId: async ({ dbClient, productImage }) => {
      const validateImageResult = validateProductImage({
        data: productImage.data,
        mimeType: productImage.mimeType,
      })
      if (!validateImageResult.ok) return validateImageResult
      return adapters.updateProductImageByProductId({
        dbClient,
        productImage,
      })
    },
    deleteProductImageByProductId: async ({ dbClient, productImage }) => {
      return adapters.deleteProductImageByProductId({
        dbClient,
        productImage,
      })
    },
  } satisfies Repositories

  return repositories
}
