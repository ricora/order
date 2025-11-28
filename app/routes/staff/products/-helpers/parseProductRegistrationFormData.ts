import { ALLOWED_PRODUCT_IMAGE_MIME_TYPES_ARRAY } from "../../../../domain/product/constants"
import type ProductImage from "../../../../domain/product/entities/productImage"

const isAllowedProductImageMimeType = (
  v: unknown,
): v is ProductImage["mimeType"] =>
  typeof v === "string" &&
  (ALLOWED_PRODUCT_IMAGE_MIME_TYPES_ARRAY as readonly string[]).includes(v)

export const createInvalidRequestError = () => new Error("不正なリクエストです")

export type ParsedProductRegistrationFormData = {
  name: string
  price: number
  stock: number
  tags: string[]
  image: Pick<ProductImage, "data" | "mimeType"> | null | undefined
}

export const parseProductRegistrationFormData = async (
  value: unknown,
): Promise<ParsedProductRegistrationFormData> => {
  const record = ensureRecord(value)

  const name = parseName(record.name)
  const price = parseNonNegativeInteger(record.price)
  const stock = parseNonNegativeInteger(record.stock)
  const tags = parseOptionalTags(record.tags) ?? []
  const image = await parseCreateImage(record.image)

  return { name, price, stock, tags, image }
}

const ensureRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object") throw createInvalidRequestError()
  return value as Record<string, unknown>
}

const parseName = (value: unknown): string => {
  if (typeof value !== "string") throw createInvalidRequestError()
  const trimmed = value.trim()
  if (trimmed.length === 0) throw createInvalidRequestError()
  return trimmed
}

const parseNonNegativeInteger = (value: unknown): number => {
  if (typeof value !== "string") throw createInvalidRequestError()
  const maybe = parseInt(value, 10)
  if (Number.isNaN(maybe)) throw createInvalidRequestError()
  return maybe
}

const convertFileToImageData = async (
  file: File,
): Promise<ParsedProductRegistrationFormData["image"]> => {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const base64 = Buffer.from(bytes).toString("base64")
  const mimeType = file.type
  if (!isAllowedProductImageMimeType(mimeType)) {
    throw createInvalidRequestError()
  }
  return { data: base64, mimeType: mimeType }
}

const parseCreateImage = async (
  value: unknown,
): Promise<ParsedProductRegistrationFormData["image"]> => {
  if (value instanceof File && value.size > 0) {
    return await convertFileToImageData(value)
  }
  return undefined
}

const parseTags = (value: unknown): string[] => {
  if (typeof value === "string") return [value]
  if (Array.isArray(value) && value.every((t) => typeof t === "string")) {
    return value as string[]
  }
  throw createInvalidRequestError()
}

const parseOptionalTags = (value: unknown): string[] | undefined => {
  if (value === undefined) return undefined
  return parseTags(value)
}
