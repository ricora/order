const createInvalidRequestError = () => {
  return new Error("不正なリクエストです")
}

type ParsedProductBody = {
  name: string
  image: string | null
  price: number
  stock: number
  tags: string[]
}

export const parseProductRequestBody = (
  body: unknown,
  opts?: { allowUndefinedTags?: boolean },
): ParsedProductBody => {
  const allowUndefinedTags = opts?.allowUndefinedTags ?? false
  if (typeof body !== "object" || body === null) {
    throw createInvalidRequestError()
  }
  const b = body as Record<string, unknown>

  const name = b.name
  if (typeof name !== "string") throw createInvalidRequestError()

  const image = b.image

  if (image !== undefined && typeof image !== "string") {
    throw createInvalidRequestError()
  }

  const price = Number(b.price as unknown)
  if (!Number.isFinite(price) || !Number.isInteger(price) || price < 0)
    throw createInvalidRequestError()

  const stock = Number(b.stock as unknown)
  if (!Number.isFinite(stock) || !Number.isInteger(stock) || stock < 0)
    throw createInvalidRequestError()

  const rawTags = b.tags

  const normalizeTags = (value: unknown, allowUndefined: boolean) => {
    if (value === undefined) return allowUndefined ? undefined : []
    if (typeof value === "string") return [value]
    if (Array.isArray(value) && value.every((t) => typeof t === "string"))
      return value
    throw createInvalidRequestError()
  }

  const tags = normalizeTags(rawTags, allowUndefinedTags)

  return { name, image: image ?? null, price, stock, tags: tags ?? [] }
}
