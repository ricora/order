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
  ],
)

/** 商品画像 */
export const productImageTable = pgTable(
  "product_image",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    productId: integer("product_id")
      .notNull()
      .unique()
      .references(() => productTable.id, { onDelete: "cascade" }),
    data: text("data"),
    mimeType: text("mime_type"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "product_image_consistency",
      sql`(${table.data} IS NULL AND ${table.mimeType} IS NULL) OR (${table.data} IS NOT NULL AND ${table.mimeType} IS NOT NULL)`,
    ),
    check(
      "product_image_mime_type_length",
      sql`${table.mimeType} IS NULL OR (char_length(${table.mimeType}) >= 1 AND char_length(${table.mimeType}) <= 100)`,
    ),
    check(
      "product_image_data_length",
      // Base64エンコードされたデータの最大長を10MBに設定
      sql`${table.data} IS NULL OR (char_length(${table.data}) >= 1 AND char_length(${table.data}) <= 10485760)`,
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

export const productRelations = relations(productTable, ({ one, many }) => ({
  productTags: many(productTagRelationTable),
  productImage: one(productImageTable),
}))

export const productTagRelations = relations(productTagTable, ({ many }) => ({
  productTags: many(productTagRelationTable),
}))

export const productImageRelations = relations(
  productImageTable,
  ({ one }) => ({
    product: one(productTable, {
      fields: [productImageTable.productId],
      references: [productTable.id],
    }),
  }),
)

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
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("order_created_at_idx").on(table.createdAt),
    index("order_updated_at_idx").on(table.updatedAt),
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
