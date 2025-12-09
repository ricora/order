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
import type { Product, ProductImage, ProductTag } from "./entities"

type CommonProductValidationError =
  | "商品名は1文字以上50文字以内である必要があります。"
  | `商品タグは${typeof MAX_TAGS_PER_PRODUCT}個以内である必要があります。`
  | "タグIDは1以上の整数の配列である必要があります。"
  | "価格は0以上の整数である必要があります。"
  | `価格は${typeof MAX_PRODUCT_PRICE}以下である必要があります。`
  | "在庫数は0以上の整数である必要があります。"
  | `在庫数は${typeof MAX_PRODUCT_STOCK}以下である必要があります。`
  | `1店舗あたりの商品数は${typeof MAX_STORE_PRODUCT_COUNT}件までです。`
  | "同じ名前の商品が既に存在します。"

type CommonProductTagValidationError =
  | "タグIDは1以上の整数の配列である必要があります。"
  | "タグIDは存在するタグのIDを参照する必要があります。"
  | "タグ名は1文字以上50文字以内である必要があります。"
  | `1店舗あたりの商品タグは${typeof MAX_STORE_PRODUCT_TAG_COUNT}個までです。`

type CommonProductImageValidationError =
  | "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります。"
  | "画像データの形式が不正です。"
  | "画像データのサイズは約7.5MB以内である必要があります。"

type CreateProductTagValidationError = CommonProductTagValidationError

type CreateProductImageValidationError = CommonProductImageValidationError
type UpdateProductImageValidationError =
  | CommonProductImageValidationError
  | "商品画像が見つかりません。"

type CreateProductValidationError =
  | CommonProductValidationError
  | CreateProductTagValidationError

type UpdateProductValidationError =
  | CommonProductValidationError
  | CreateProductTagValidationError
  | "商品が見つかりません。"

export type Repository = {
  // Query
  findProductById: QueryRepositoryFunction<
    { product: Pick<Product, "id"> },
    Product,
    "商品が見つかりません。"
  >
  findProductByName: QueryRepositoryFunction<
    { product: Pick<Product, "name"> },
    Product,
    "商品が見つかりません。"
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
  findProductTagById: QueryRepositoryFunction<
    { productTag: Pick<ProductTag, "id"> },
    ProductTag,
    "商品タグが見つかりません。"
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
  getProductCountByStoreId: QueryRepositoryFunction<
    { store: { id: 1 } },
    number,
    never
  >
  getProductTagCountByStoreId: QueryRepositoryFunction<
    { store: { id: 1 } },
    number,
    never
  >
  getAllProductTagRelationCountsByTagIds: PaginatedQueryRepositoryFunction<
    { productTag: { ids: ProductTag["id"][] } },
    { tagId: ProductTag["id"]; count: number },
    never
  >
  findProductImageByProductId: QueryRepositoryFunction<
    { productImage: Pick<ProductImage, "productId"> },
    ProductImage,
    "商品画像が見つかりません。"
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
    never
  >
  createProductTag: CommandRepositoryFunction<
    { productTag: Omit<ProductTag, "id"> },
    ProductTag,
    CreateProductTagValidationError
  >
  deleteAllProductTagsByIds: CommandRepositoryFunction<
    { productTag: { ids: ProductTag["id"][] } },
    void,
    never
  >
  createProductImage: CommandRepositoryFunction<
    { productImage: Omit<ProductImage, "id"> },
    ProductImage,
    CreateProductImageValidationError
  >
  updateProductImageByProductId: CommandRepositoryFunction<
    {
      productImage: Pick<ProductImage, "productId" | "updatedAt"> &
        Partial<Pick<ProductImage, "data" | "mimeType">>
    },
    ProductImage,
    UpdateProductImageValidationError
  >
  deleteProductImageByProductId: CommandRepositoryFunction<
    { productImage: Pick<ProductImage, "productId"> },
    void,
    never
  >
  setProductCountByStoreId: CommandRepositoryFunction<
    { store: { id: 1; value: number } },
    void,
    never
  >

  setProductTagCountByStoreId: CommandRepositoryFunction<
    { store: { id: 1; value: number } },
    void,
    never
  >
  setAllProductTagRelationCountsByTagIds: CommandRepositoryFunction<
    { productTags: { id: ProductTag["id"]; value: number }[] },
    void,
    never
  >
}

export const createRepository = (adapters: Repository) => {
  type CreateProductParam = Parameters<
    Repository["createProduct"]
  >[0]["product"]
  type UpdateProductParam = Parameters<
    Repository["updateProduct"]
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
          message: "商品名は1文字以上50文字以内である必要があります。",
        }
      }
    }
    if (product.tagIds !== undefined) {
      if (product.tagIds.length > MAX_TAGS_PER_PRODUCT) {
        return {
          ok: false,
          message: `商品タグは${MAX_TAGS_PER_PRODUCT}個以内である必要があります。`,
        }
      }
      if (
        product.tagIds.some((tagId) => !Number.isInteger(tagId) || tagId < 1)
      ) {
        return {
          ok: false,
          message: "タグIDは1以上の整数の配列である必要があります。",
        }
      }
    }
    if (product.price !== undefined) {
      if (product.price < 0 || !Number.isInteger(product.price)) {
        return { ok: false, message: "価格は0以上の整数である必要があります。" }
      }
      if (product.price > MAX_PRODUCT_PRICE) {
        return {
          ok: false,
          message: `価格は${MAX_PRODUCT_PRICE}以下である必要があります。`,
        }
      }
    }
    if (product.stock !== undefined) {
      if (product.stock < 0 || !Number.isInteger(product.stock)) {
        return {
          ok: false,
          message: "在庫数は0以上の整数である必要があります。",
        }
      }
      if (product.stock > MAX_PRODUCT_STOCK) {
        return {
          ok: false,
          message: `在庫数は${MAX_PRODUCT_STOCK}以下である必要があります。`,
        }
      }
    }
    return { ok: true, value: undefined }
  }
  const verifyAllTagIdsExist = async (
    dbClient: TransactionDbClient,
    tagIds: Product["tagIds"],
  ): Promise<Result<void, CreateProductTagValidationError>> => {
    const tagsResult = await repository.findAllProductTags({
      dbClient,
      pagination: { offset: 0, limit: MAX_STORE_PRODUCT_TAG_COUNT },
    })
    if (!tagsResult.ok) {
      return {
        ok: false,
        message: "タグIDは存在するタグのIDを参照する必要があります。",
      }
    }
    const tagIdSet = new Set(tagsResult.value.map((tag) => tag.id))
    if (tagIds.some((tagId) => !tagIdSet.has(tagId))) {
      return {
        ok: false,
        message: "タグIDは存在するタグのIDを参照する必要があります。",
      }
    }
    return { ok: true, value: undefined }
  }
  const verifyProductNameUnique = async (
    dbClient: TransactionDbClient,
    name: Product["name"],
    excludeId?: Product["id"],
  ): Promise<Result<void, CommonProductValidationError>> => {
    const existingProductResult = await repository.findProductByName({
      product: { name },
      dbClient,
    })
    if (!existingProductResult.ok) {
      return { ok: true, value: undefined }
    }
    const existingProduct = existingProductResult.value
    if (existingProduct && existingProduct.id !== excludeId) {
      return { ok: false, message: "同じ名前の商品が既に存在します。" }
    }
    return { ok: true, value: undefined }
  }
  const verifyProductCountLimit = async (
    dbClient: TransactionDbClient,
  ): Promise<Result<void, CommonProductValidationError>> => {
    const totalProductsResult = await repository.getProductCountByStoreId({
      dbClient,
      store: { id: 1 },
    })
    if (!totalProductsResult.ok)
      return {
        ok: false,
        message: `1店舗あたりの商品数は${MAX_STORE_PRODUCT_COUNT}件までです。`,
      }
    if (totalProductsResult.value >= MAX_STORE_PRODUCT_COUNT) {
      return {
        ok: false,
        message: `1店舗あたりの商品数は${MAX_STORE_PRODUCT_COUNT}件までです。`,
      }
    }
    return { ok: true, value: undefined }
  }
  const validateProductTag = (
    tag: Omit<ProductTag, "id">,
  ): Result<void, CommonProductTagValidationError> => {
    if (countStringLength(tag.name) < 1 || countStringLength(tag.name) > 50) {
      return {
        ok: false,
        message: "タグ名は1文字以上50文字以内である必要があります。",
      }
    }
    return { ok: true, value: undefined }
  }
  const verifyProductTagCountLimit = async (
    dbClient: TransactionDbClient,
  ): Promise<Result<void, CommonProductTagValidationError>> => {
    const totalTagsResult = await repository.getProductTagCountByStoreId({
      dbClient,
      store: { id: 1 },
    })
    if (!totalTagsResult.ok)
      return {
        ok: false,
        message: `1店舗あたりの商品タグは${MAX_STORE_PRODUCT_TAG_COUNT}個までです。`,
      }
    if (totalTagsResult.value >= MAX_STORE_PRODUCT_TAG_COUNT) {
      return {
        ok: false,
        message: `1店舗あたりの商品タグは${MAX_STORE_PRODUCT_TAG_COUNT}個までです。`,
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
      await repository.getAllProductTagRelationCountsByTagIds({
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
      await repository.deleteAllProductTagsByIds({
        productTag: { ids: orphanedTagIds },
        dbClient,
      })
    }
  }

  const adjustTagRelationCounts = async (
    dbClient: TransactionDbClient,
    tagIds: number[],
    delta: number,
  ): Promise<Result<void, "エラーが発生しました。">> => {
    if (!tagIds || tagIds.length === 0) return { ok: true, value: undefined }
    const tagCountsRes =
      await repository.getAllProductTagRelationCountsByTagIds({
        dbClient,
        productTag: { ids: tagIds },
        pagination: { offset: 0, limit: tagIds.length },
      })
    if (!tagCountsRes.ok)
      return { ok: false, message: "エラーが発生しました。" }
    const curr = new Map<number, number>()
    for (const t of tagCountsRes.value) curr.set(t.tagId, t.count)
    const updates = tagIds.map((id) => ({
      id,
      value: Math.max(0, (curr.get(id) ?? 0) + delta),
    }))
    const setRes = await repository.setAllProductTagRelationCountsByTagIds({
      dbClient,
      productTags: updates,
    })
    if (!setRes.ok) return { ok: false, message: "エラーが発生しました。" }
    return { ok: true, value: undefined }
  }

  const validateProductImage = (
    image: Partial<Pick<ProductImage, "data" | "mimeType">>,
  ): Result<void, CommonProductImageValidationError> => {
    if (image.mimeType !== undefined) {
      if (!ALLOWED_PRODUCT_IMAGE_MIME_TYPES.has(image.mimeType)) {
        return {
          ok: false,
          message:
            "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります。",
        }
      }
    }
    if (image.data !== undefined) {
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(image.data)) {
        return { ok: false, message: "画像データの形式が不正です。" }
      }
      if (image.data.length > MAX_PRODUCT_IMAGE_BASE64_SIZE) {
        return {
          ok: false,
          message: "画像データのサイズは約7.5MB以内である必要があります。",
        }
      }
    }
    return { ok: true, value: undefined }
  }

  const repository = {
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
    findProductImageByProductId: async ({ dbClient, productImage }) => {
      return adapters.findProductImageByProductId({
        dbClient,
        productImage,
      })
    },
    getProductCountByStoreId: async ({ dbClient, store }) => {
      return adapters.getProductCountByStoreId({ dbClient, store })
    },
    getProductTagCountByStoreId: async ({ dbClient, store }) => {
      return adapters.getProductTagCountByStoreId({ dbClient, store })
    },
    getAllProductTagRelationCountsByTagIds: async ({
      dbClient,
      productTag,
      pagination,
    }) => {
      return adapters.getAllProductTagRelationCountsByTagIds({
        dbClient,
        productTag,
        pagination,
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

      const createResult = await adapters.createProduct({ product, dbClient })
      if (!createResult.ok) return createResult

      const productCountRes = await repository.getProductCountByStoreId({
        dbClient,
        store: { id: 1 },
      })
      if (!productCountRes.ok) {
        return { ok: false, message: "エラーが発生しました。" }
      }
      const setRes = await repository.setProductCountByStoreId({
        dbClient,
        store: { id: 1, value: productCountRes.value + 1 },
      })
      if (!setRes.ok) return { ok: false, message: "エラーが発生しました。" }

      if (createResult.value.tagIds && createResult.value.tagIds.length > 0) {
        const adjustRes = await adjustTagRelationCounts(
          dbClient,
          createResult.value.tagIds,
          1,
        )
        if (!adjustRes.ok)
          return { ok: false, message: "エラーが発生しました。" }
      }
      return createResult
    },
    updateProduct: async ({ dbClient, product }) => {
      const validateCommonResult = validateCommonProduct(product)
      if (!validateCommonResult.ok) return validateCommonResult

      const foundProductResult = await repository.findProductById({
        dbClient,
        product: { id: product.id },
      })
      if (!foundProductResult.ok) {
        return { ok: false, message: "商品が見つかりません。" }
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
        const addedTagIds = (product.tagIds || []).filter(
          (tagId) => !oldTagIds.includes(tagId),
        )
        const allChangedTagIds = Array.from(
          new Set([...removedTagIds, ...addedTagIds]),
        )
        if (allChangedTagIds.length > 0) {
          if (addedTagIds.length > 0) {
            const addedRes = await adjustTagRelationCounts(
              dbClient,
              addedTagIds,
              1,
            )
            if (!addedRes.ok)
              return { ok: false, message: "エラーが発生しました。" }
          }
          if (removedTagIds.length > 0) {
            const removedRes = await adjustTagRelationCounts(
              dbClient,
              removedTagIds,
              -1,
            )
            if (!removedRes.ok)
              return { ok: false, message: "エラーが発生しました。" }
          }
        }
        await deleteOrphanedTags(dbClient, removedTagIds)
      }

      return adapters.updateProduct({ product, dbClient })
    },
    deleteProduct: async ({ product, dbClient }) => {
      const foundProductResult = await repository.findProductById({
        dbClient,
        product: { id: product.id },
      })
      if (!foundProductResult.ok) {
        return { ok: true, value: undefined }
      }
      const foundProduct = foundProductResult.value

      await repository.deleteProductImageByProductId({
        productImage: { productId: product.id },
        dbClient,
      })

      const productCountRes = await repository.getProductCountByStoreId({
        dbClient,
        store: { id: 1 },
      })
      if (!productCountRes.ok)
        return { ok: false, message: "エラーが発生しました。" }

      const newCount = productCountRes.value - 1
      const setRes = await repository.setProductCountByStoreId({
        dbClient,
        store: { id: 1, value: newCount < 0 ? 0 : newCount },
      })
      if (!setRes.ok) return { ok: false, message: "エラーが発生しました。" }

      if (foundProduct.tagIds && foundProduct.tagIds.length > 0) {
        const tagIds = foundProduct.tagIds
        const adjustRes = await adjustTagRelationCounts(dbClient, tagIds, -1)
        if (!adjustRes.ok)
          return { ok: false, message: "エラーが発生しました。" }
      }

      await deleteOrphanedTags(dbClient, foundProduct.tagIds)
      return adapters.deleteProduct({ product, dbClient })
    },
    createProductTag: async ({ dbClient, productTag }) => {
      const validateTagResult = validateProductTag(productTag)
      if (!validateTagResult.ok) return validateTagResult

      const tagCountLimitResult = await verifyProductTagCountLimit(dbClient)
      if (!tagCountLimitResult.ok) return tagCountLimitResult

      const createTagResult = await adapters.createProductTag({
        productTag,
        dbClient,
      })
      if (!createTagResult.ok) return createTagResult

      const tagCountRes = await repository.getProductTagCountByStoreId({
        dbClient,
        store: { id: 1 },
      })
      if (tagCountRes.ok) {
        await repository.setProductTagCountByStoreId({
          dbClient,
          store: { id: 1, value: tagCountRes.value + 1 },
        })
      }
      return createTagResult
    },
    deleteAllProductTagsByIds: async ({ dbClient, productTag }) => {
      const deleteResult = await adapters.deleteAllProductTagsByIds({
        dbClient,
        productTag,
      })
      if (!deleteResult.ok) return deleteResult

      const tagCountRes = await repository.getProductTagCountByStoreId({
        dbClient,
        store: { id: 1 },
      })
      if (tagCountRes.ok) {
        const newVal = Math.max(0, tagCountRes.value - productTag.ids.length)
        await repository.setProductTagCountByStoreId({
          dbClient,
          store: { id: 1, value: newVal },
        })
      }
      return deleteResult
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
    setProductCountByStoreId: async ({ dbClient, store }) => {
      return adapters.setProductCountByStoreId({ dbClient, store })
    },
    setProductTagCountByStoreId: async ({ dbClient, store }) => {
      return adapters.setProductTagCountByStoreId({
        dbClient,
        store,
      })
    },
    setAllProductTagRelationCountsByTagIds: async ({
      dbClient,
      productTags,
    }) => {
      return adapters.setAllProductTagRelationCountsByTagIds({
        dbClient,
        productTags,
      })
    },
  } satisfies Repository

  return repository
}
