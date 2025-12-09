import { MAX_STORE_PRODUCT_TAG_COUNT } from "../../domain/product/constants"
import type { Product, ProductImage } from "../../domain/product/entities"
import type { Result } from "../../domain/types"
import type { DbClient, TransactionDbClient } from "../../libs/db/client"
import { productRepository } from "../repositories-provider"

const {
  createProduct,
  createProductImage,
  createProductTag,
  findAllProductTags,
} = productRepository

const INTERNAL_ERROR = "エラーが発生しました。"

const WHITELISTED_ERRORS_ARRAY = [
  "商品名は1文字以上50文字以内である必要があります。",
  "商品タグは20個以内である必要があります。",
  "価格は0以上の整数である必要があります。",
  "価格は1000000000以下である必要があります。",
  "在庫数は0以上の整数である必要があります。",
  "在庫数は1000000000以下である必要があります。",
  "タグ名は1文字以上50文字以内である必要があります。",
  "1店舗あたりの商品数は1000件までです。",
  "画像のMIMEタイプはimage/jpeg, image/png, image/webp, image/gifのいずれかである必要があります。",
  "画像データの形式が不正です。",
  "画像データのサイズは約7.5MB以内である必要があります。",
  "同じ名前の商品が既に存在します。",
] as const

type WhitelistedError = (typeof WHITELISTED_ERRORS_ARRAY)[number]

export type RegisterProductError = typeof INTERNAL_ERROR | WhitelistedError
const WHITELISTED_ERRORS = new Set<string>(
  WHITELISTED_ERRORS_ARRAY as readonly string[],
)

const isWhitelistedError = (v: unknown): v is WhitelistedError =>
  typeof v === "string" && WHITELISTED_ERRORS.has(v)

const resolveTagNamesToIds = async ({
  dbClient,
  tagNames,
}: {
  dbClient: TransactionDbClient
  tagNames: string[]
}): Promise<Result<number[], RegisterProductError>> => {
  if (!tagNames || tagNames.length === 0) return { ok: true, value: [] }
  const tagsResult = await findAllProductTags({
    dbClient,
    pagination: { offset: 0, limit: MAX_STORE_PRODUCT_TAG_COUNT },
  })
  if (!tagsResult.ok) return { ok: false, message: INTERNAL_ERROR }
  const tagNameToId = new Map(tagsResult.value.map((tag) => [tag.name, tag.id]))
  const tagIds: number[] = []
  for (const tagName of tagNames) {
    const trimmed = tagName.trim()
    if (!trimmed) continue
    const id = tagNameToId.get(trimmed)
    if (id !== undefined) {
      tagIds.push(id)
    } else {
      const newTagResult = await createProductTag({
        productTag: { name: trimmed },
        dbClient,
      })
      if (!newTagResult.ok) {
        const msg = newTagResult.message
        if (isWhitelistedError(msg)) {
          return { ok: false, message: msg }
        }
        return { ok: false, message: INTERNAL_ERROR }
      }
      tagIds.push(newTagResult.value.id)
      tagNameToId.set(trimmed, newTagResult.value.id)
    }
  }
  return { ok: true, value: tagIds }
}

type ProductImageInput =
  | Pick<ProductImage, "data" | "mimeType">
  | null
  | undefined

export type CreateProductPayload = Omit<Product, "tagIds" | "id"> & {
  tags: string[]
  image?: ProductImageInput
}

export type RegisterProductParams = {
  dbClient: DbClient
  product: CreateProductPayload
}

export const registerProduct = async ({
  dbClient,
  product,
}: RegisterProductParams): Promise<Result<Product, RegisterProductError>> => {
  try {
    const createPayload = product
    const txResult = await dbClient.transaction<
      Result<Product, RegisterProductError>
    >(async (tx) => {
      const tagResult = await resolveTagNamesToIds({
        dbClient: tx,
        tagNames: createPayload.tags,
      })
      if (!tagResult.ok) return tagResult
      const tagIds = tagResult.value
      const createdProductResult = await createProduct({
        product: {
          name: createPayload.name.trim(),
          tagIds,
          price: createPayload.price,
          stock: createPayload.stock,
        },
        dbClient: tx,
      })
      if (!createdProductResult.ok) {
        const msg = createdProductResult.message
        if (isWhitelistedError(msg)) {
          return { ok: false, message: msg }
        }
        return { ok: false, message: INTERNAL_ERROR }
      }
      if (createPayload.image) {
        const now = new Date()
        const imageResult = await createProductImage({
          dbClient: tx,
          productImage: {
            productId: createdProductResult.value.id,
            data: createPayload.image.data,
            mimeType: createPayload.image.mimeType,
            createdAt: now,
            updatedAt: now,
          },
        })
        if (!imageResult.ok) {
          const msg = imageResult.message
          if (isWhitelistedError(msg)) {
            return { ok: false, message: msg }
          }
          return { ok: false, message: INTERNAL_ERROR }
        }
      }
      return { ok: true, value: createdProductResult.value }
    })
    return txResult
  } catch {
    return { ok: false, message: INTERNAL_ERROR }
  }
}
