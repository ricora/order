import { relations, sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

// product
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
    index("product_stock_idx").on(table.stock),
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

export const productRelations = relations(productTable, ({ many }) => ({
  productTags: many(productTagRelationTable),
}))

export const productTagRelations = relations(productTagTable, ({ many }) => ({
  productTags: many(productTagRelationTable),
}))

export const productToProductTagRelations = relations(
  productTagRelationTable,
  ({ one }) => ({
    product: one(productTable, {
      fields: [productTagRelationTable.productId],
      references: [productTable.id],
    }),
    productTag: one(productTagTable, {
      fields: [productTagRelationTable.tagId],
      references: [productTagTable.id],
    }),
  }),
)

// order
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "completed",
  "cancelled",
])

/** 注文 */
export const orderTable = pgTable(
  "order",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    customerName: text("customer_name"),
    totalAmount: integer("total_amount").notNull(),
    status: orderStatusEnum().notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("order_created_at_idx").on(table.createdAt),
    check("order_total_amount_positive", sql`${table.totalAmount} >= 0`),
    check(
      "order_customer_name_length",
      sql`${table.customerName} IS NULL OR (char_length(${table.customerName}) >= 1 AND char_length(${table.customerName}) <= 50)`,
    ),
  ],
)

/** 注文項目 */
export const orderItemTable = pgTable(
  "order_item",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orderTable.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => productTable.id, {
      onDelete: "set null",
    }),
    quantity: integer("quantity").notNull(),
    unitAmount: integer("unit_amount").notNull(),
    productName: text("product_name").notNull(),
  },
  (table) => [
    index("order_item_order_idx").on(table.orderId),
    check("order_item_quantity_positive", sql`${table.quantity} >= 1`),
    check("order_item_unit_amount_positive", sql`${table.unitAmount} >= 0`),
  ],
)

export const orderRelations = relations(orderTable, ({ many }) => ({
  orderItems: many(orderItemTable),
}))

export const orderItemRelations = relations(orderItemTable, ({ one }) => ({
  order: one(orderTable, {
    fields: [orderItemTable.orderId],
    references: [orderTable.id],
  }),
}))
