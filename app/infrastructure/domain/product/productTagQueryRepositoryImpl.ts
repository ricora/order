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
  const dbProductTag = await dbClient.query.productTagTable.findFirst({
    where: eq(productTagTable.id, productTag.id),
  })
  if (!dbProductTag) return null

  return { id: dbProductTag.id, name: dbProductTag.name }
}

export const findAllProductTagsImpl: FindAllProductTags = async ({
  dbClient,
}) => {
  const dbProductTags = await dbClient.query.productTagTable.findMany()
  return dbProductTags.map((dbProductTag) => ({
    id: dbProductTag.id,
    name: dbProductTag.name,
  }))
}
