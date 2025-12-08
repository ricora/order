import { MAX_STORE_PRODUCT_TAG_COUNT } from "../../domain/product/constants"
import type Product from "../../domain/product/entities/product"
import type ProductImage from "../../domain/product/entities/productImage"
import type { Result } from "../../domain/types"
import type { DbClient, TransactionDbClient } from "../../libs/db/client"
import { productRepository } from "../repositories-provider"

const {
  updateProduct,
  createProductImage,
  deleteProductImageByProductId,
  updateProductImageByProductId,
  findProductImageByProductId,
  createProductTag,
  findAllProductTags,
} = productRepository

const INTERNAL_ERROR = "エラーが発生しました。" as const
const PRODUCT_NOT_FOUND = "商品が見つかりません。" as const

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
] as const

type WhitelistedError = (typeof WHITELISTED_ERRORS_ARRAY)[number]

type SetProductDetailsError =
  | typeof INTERNAL_ERROR
  | typeof PRODUCT_NOT_FOUND
  | WhitelistedError

const WHITELISTED_ERRORS = new Set<string>(
  WHITELISTED_ERRORS_ARRAY as readonly string[],
)

const isWhitelistedError = (v: unknown): v is WhitelistedError =>
  typeof v === "string" && WHITELISTED_ERRORS.has(v)

type ProductImageInput =
  | Pick<ProductImage, "data" | "mimeType">
  | null
  | undefined

export type UpdateProductPayload = { id: number } & Partial<
  Omit<Product, "tagIds" | "id">
> & {
    tags?: string[]
    image?: ProductImageInput
  }

const resolveTagNamesToIds = async ({
  dbClient,
  tagNames,
}: {
  dbClient: TransactionDbClient
  tagNames: string[]
}): Promise<Result<number[], SetProductDetailsError>> => {
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

export type SetProductDetailsParams = {
  dbClient: DbClient
  product: UpdateProductPayload
}

export const setProductDetails = async ({
  dbClient,
  product,
}: SetProductDetailsParams): Promise<
  Result<Product, SetProductDetailsError>
> => {
  try {
    const updatePayload = product
    const txResult = await dbClient.transaction<
      Result<Product, SetProductDetailsError>
    >(async (tx) => {
      let tagIds: number[] | undefined
      if (updatePayload.tags !== undefined) {
        const tagResult = await resolveTagNamesToIds({
          dbClient: tx,
          tagNames: updatePayload.tags,
        })
        if (!tagResult.ok) return tagResult
        tagIds = tagResult.value
      }
      const updatedProductResult = await updateProduct({
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
      if (!updatedProductResult.ok) {
        const msg = updatedProductResult.message
        if (msg === PRODUCT_NOT_FOUND) {
          return { ok: false, message: PRODUCT_NOT_FOUND }
        }
        if (isWhitelistedError(msg)) {
          return { ok: false, message: msg }
        }
        return { ok: false, message: INTERNAL_ERROR }
      }
      if (updatePayload.image !== undefined) {
        const isNullImage =
          updatePayload.image === null ||
          (typeof updatePayload.image === "object" &&
            (updatePayload.image.data === "" ||
              updatePayload.image.data == null))
        if (isNullImage) {
          await deleteProductImageByProductId({
            dbClient: tx,
            productImage: { productId: updatePayload.id },
          })
        } else if (
          updatePayload.image &&
          typeof updatePayload.image === "object"
        ) {
          const existingImage = await findProductImageByProductId({
            dbClient: tx,
            productImage: { productId: updatePayload.id },
          })
          if (existingImage?.ok) {
            const imageRes = await updateProductImageByProductId({
              dbClient: tx,
              productImage: {
                productId: updatePayload.id,
                data: updatePayload.image.data,
                mimeType: updatePayload.image.mimeType,
                updatedAt: new Date(),
              },
            })
            if (!imageRes.ok) {
              const msg = imageRes.message
              if (isWhitelistedError(msg)) return { ok: false, message: msg }
              return { ok: false, message: INTERNAL_ERROR }
            }
          } else {
            const imageRes = await createProductImage({
              dbClient: tx,
              productImage: {
                productId: updatePayload.id,
                data: updatePayload.image.data,
                mimeType: updatePayload.image.mimeType,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            })
            if (!imageRes.ok) {
              const msg = imageRes.message
              if (isWhitelistedError(msg)) return { ok: false, message: msg }
              return { ok: false, message: INTERNAL_ERROR }
            }
          }
        }
      }
      return { ok: true, value: updatedProductResult.value }
    })
    return txResult
  } catch {
    return { ok: false, message: INTERNAL_ERROR }
  }
}
