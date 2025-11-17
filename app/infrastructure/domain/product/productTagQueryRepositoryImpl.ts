import { asc, count, eq, inArray } from "drizzle-orm"
import type {
  CountProductTags,
  FindAllProductTagRelationCountsByTagIds,
  FindAllProductTags,
  FindAllProductTagsByIds,
  FindProductTagById,
} from "../../../domain/product/repositories/productTagQueryRepository"
import { productTagRelationTable, productTagTable } from "../../db/schema"

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
  pagination,
}) => {
  const dbProductTags = await dbClient.query.productTagTable.findMany({
    orderBy: [asc(productTagTable.id)],
    offset: pagination.offset,
    limit: pagination.limit,
  })
  return dbProductTags.map((dbProductTag) => ({
    id: dbProductTag.id,
    name: dbProductTag.name,
  }))
}

export const findAllProductTagsByIdsImpl: FindAllProductTagsByIds = async ({
  dbClient,
  productTag,
  pagination,
}) => {
  const dbProductTags = await dbClient.query.productTagTable.findMany({
    where: inArray(productTagTable.id, productTag.ids),
    orderBy: [asc(productTagTable.id)],
    offset: pagination.offset,
    limit: pagination.limit,
  })
  return dbProductTags.map((dbProductTag) => ({
    id: dbProductTag.id,
    name: dbProductTag.name,
  }))
}

export const countProductTagsImpl: CountProductTags = async ({ dbClient }) => {
  return await dbClient.$count(productTagTable)
}

export const findAllProductTagRelationCountsByTagIdsImpl: FindAllProductTagRelationCountsByTagIds =
  async ({ dbClient, productTag, pagination }) => {
    const results = await dbClient
      .select({
        tagId: productTagRelationTable.tagId,
        count: count(),
      })
      .from(productTagRelationTable)
      .where(inArray(productTagRelationTable.tagId, productTag.ids))
      .groupBy(productTagRelationTable.tagId)
      .offset(pagination.offset)
      .limit(pagination.limit)

    return results.map((result) => ({
      tagId: result.tagId,
      count: result.count,
    }))
  }
