import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
} from "drizzle-orm/pg-core"

/** 商品 */
export const productTable = pgTable(
  "product",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull().unique(),
    image: text("image"),
    price: integer("price").notNull(),
    stock: integer("stock").notNull(),
  },
  (table) => [
    index("product_name_idx").on(table.name),
    check("product_price_positive", sql`${table.price} >= 0`),
    check("product_stock_positive", sql`${table.stock} >= 0`),
    check(
      "product_name_length",
      sql`char_length(${table.name}) >= 1 AND char_length(${table.name}) <= 50`,
    ),
    check(
      "product_image_url",
      sql`${table.image} IS NULL OR (char_length(${table.image}) >= 1 AND char_length(${table.image}) <= 500 AND ${table.image} ~ '^https?://')`,
    ),
  ],
)

/** 商品タグ */
export const productTagTable = pgTable(
  "product_tag",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull().unique(),
  },
  (table) => [
    index("product_tag_name_idx").on(table.name),
    check(
      "product_tag_name_length",
      sql`char_length(${table.name}) >= 1 AND char_length(${table.name}) <= 50`,
    ),
  ],
)

/** 商品と商品タグの関係 */
export const productTagRelationTable = pgTable(
  "product_tag_relation",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => productTagTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.tagId] }),
    index("product_tag_relation_product_idx").on(table.productId),
    index("product_tag_relation_tag_idx").on(table.tagId),
  ],
)
