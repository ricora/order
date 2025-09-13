import { eq } from "drizzle-orm"
import type {
  FindAllProductTags,
  FindProductTagById,
} from "../../../domain/product/repositories/productTagQueryRepository"
import { productTagTable } from "../../db/schema"

export const findProductTagByIdImpl: FindProductTagById = async ({
  dbClient,
  productTag,
}) => {
  const dbTag = (
    await dbClient
      .select()
      .from(productTagTable)
      .where(eq(productTagTable.id, productTag.id))
  )[0]
  if (!dbTag) return Promise.resolve(null)
  return Promise.resolve({ id: dbTag.id, name: dbTag.name })
}

export const findAllProductTagsImpl: FindAllProductTags = async ({
  dbClient,
}) => {
  const rows = await dbClient.select().from(productTagTable)
  return Promise.resolve(
    rows.map((r: { id: number; name: string }) => ({ id: r.id, name: r.name })),
  )
}
