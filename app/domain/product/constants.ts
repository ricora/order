import type { ProductImage } from "./entities"

/** 商品画像として許可されているMIMEタイプの配列 */
export const ALLOWED_PRODUCT_IMAGE_MIME_TYPES_ARRAY = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const satisfies readonly ProductImage["mimeType"][]

/** 商品画像として許可されているMIMEタイプの集合 */
export const ALLOWED_PRODUCT_IMAGE_MIME_TYPES = new Set<
  ProductImage["mimeType"]
>(ALLOWED_PRODUCT_IMAGE_MIME_TYPES_ARRAY)

/** 商品画像の最大base64文字列長 */
export const MAX_PRODUCT_IMAGE_BASE64_SIZE = Math.floor(7.5 * 1024 * 1024) // base64エンコード後のサイズは元のバイナリサイズの約133%になるため、逆算（10MB / 1.33 ≈ 7.5MB）して制限を設定する
/** 単一店舗に存在できる商品数の最大値 */
export const MAX_STORE_PRODUCT_COUNT = 1000

/** 単一店舗に存在できる商品タグ数の最大値 */
export const MAX_STORE_PRODUCT_TAG_COUNT = 1000

/** 単一商品に紐づけ可能なタグ数の最大値 */
export const MAX_TAGS_PER_PRODUCT = 20

/** 商品の価格の最大値 */
export const MAX_PRODUCT_PRICE = 1_000_000_000

/** 商品の在庫数の最大値 */
export const MAX_PRODUCT_STOCK = 1_000_000_000
