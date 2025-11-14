import type {
  CreateProductPayload,
  UpdateProductPayload,
} from "../../../../usecases/registerProduct"

const createInvalidRequestError = () => new Error("不正なリクエストです")

const ensureRecord = (body: unknown): Record<string, unknown> => {
  if (typeof body !== "object" || body === null) {
    throw createInvalidRequestError()
  }
  return body as Record<string, unknown>
}

const parseName = (value: unknown): CreateProductPayload["name"] => {
  if (typeof value !== "string") {
    throw createInvalidRequestError()
  }
  return value
}

const parseNonNegativeInteger = (
  value: unknown,
): CreateProductPayload["price"] => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    throw createInvalidRequestError()
  }
  return parsed
}

const convertFileToImageData = async (
  file: File,
): Promise<NonNullable<CreateProductPayload["image"]>> => {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const base64 = Buffer.from(bytes).toString("base64")
  return { data: base64, mimeType: file.type }
}

const parseCreateImage = async (
  value: unknown,
): Promise<CreateProductPayload["image"]> => {
  if (value instanceof File && value.size > 0) {
    return convertFileToImageData(value)
  }
  return null
}

const parseUpdateImage = async (
  value: unknown,
): Promise<UpdateProductPayload["image"]> => {
  if (value instanceof File && value.size > 0) {
    return convertFileToImageData(value)
  }
  return undefined
}

const parseTags = (value: unknown): CreateProductPayload["tags"] => {
  if (value === undefined) return []
  if (typeof value === "string") return [value]
  if (Array.isArray(value) && value.every((tag) => typeof tag === "string")) {
    return value
  }
  throw createInvalidRequestError()
}

const parseOptionalTags = (value: unknown): UpdateProductPayload["tags"] => {
  if (value === undefined) return undefined
  if (typeof value === "string") return [value]
  if (Array.isArray(value) && value.every((tag) => typeof tag === "string")) {
    return value
  }
  throw createInvalidRequestError()
}

export const parseCreateProductRequestBody = async (
  body: unknown,
): Promise<CreateProductPayload> => {
  const record = ensureRecord(body)

  const name = parseName(record.name)
  const price = parseNonNegativeInteger(record.price)
  const stock = parseNonNegativeInteger(record.stock)
  const image = await parseCreateImage(record.image)
  const tags = parseTags(record.tags)

  return { name, price, stock, image, tags }
}

export const parseUpdateProductRequestBody = async (
  body: unknown,
): Promise<Omit<UpdateProductPayload, "id">> => {
  const record = ensureRecord(body)

  const name = record.name === undefined ? undefined : parseName(record.name)
  const price =
    record.price === undefined
      ? undefined
      : parseNonNegativeInteger(record.price)
  const stock =
    record.stock === undefined
      ? undefined
      : parseNonNegativeInteger(record.stock)
  const image = await parseUpdateImage(record.image)
  const tags = parseOptionalTags(record.tags)

  return { name, price, stock, image, tags }
}
