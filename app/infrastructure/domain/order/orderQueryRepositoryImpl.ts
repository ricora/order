import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm"
import type {
  FindAllDailyOrderAggregations,
  FindAllOrders,
  FindAllOrdersByActiveStatusOrderByUpdatedAtAsc,
  FindAllOrdersByInactiveStatusOrderByUpdatedAtDesc,
  FindOrderById,
  FindOrderStatusCounts,
} from "../../../domain/order/repositories/orderQueryRepository"
import { orderTable } from "../../db/schema"

export const findOrderByIdImpl: FindOrderById = async ({ dbClient, order }) => {
  const dbOrder = await dbClient.query.orderTable.findFirst({
    where: eq(orderTable.id, order.id),
    with: {
      orderItems: true,
    },
  })
  if (!dbOrder) return null

  return {
    id: dbOrder.id,
    customerName: dbOrder.customerName,
    createdAt: dbOrder.createdAt,
    status: dbOrder.status,
    updatedAt: dbOrder.updatedAt,
    orderItems: dbOrder.orderItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitAmount: item.unitAmount,
      quantity: item.quantity,
    })),
    totalAmount: dbOrder.totalAmount,
  }
}

export const findAllOrdersImpl: FindAllOrders = async ({
  dbClient,
  pagination,
}) => {
  const dbOrders = await dbClient.query.orderTable.findMany({
    with: {
      orderItems: true,
    },
    orderBy: [asc(orderTable.id)],
    offset: pagination.offset,
    limit: pagination.limit,
  })
  const orders = dbOrders.map((dbOrder) => ({
    id: dbOrder.id,
    customerName: dbOrder.customerName,
    createdAt: dbOrder.createdAt,
    status: dbOrder.status,
    updatedAt: dbOrder.updatedAt,
    orderItems: dbOrder.orderItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitAmount: item.unitAmount,
      quantity: item.quantity,
    })),
    totalAmount: dbOrder.totalAmount,
  }))
  return orders
}

export const findAllOrdersByActiveStatusByUpdatedAtAscImpl: FindAllOrdersByActiveStatusOrderByUpdatedAtAsc =
  async ({ dbClient, pagination }) => {
    const dbOrders = await dbClient.query.orderTable.findMany({
      where: inArray(orderTable.status, ["pending", "processing"]),
      with: {
        orderItems: true,
      },
      orderBy: [asc(orderTable.updatedAt)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    const orders = dbOrders.map((dbOrder) => ({
      id: dbOrder.id,
      customerName: dbOrder.customerName,
      createdAt: dbOrder.createdAt,
      status: dbOrder.status,
      updatedAt: dbOrder.updatedAt,
      orderItems: dbOrder.orderItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitAmount: item.unitAmount,
        quantity: item.quantity,
      })),
      totalAmount: dbOrder.totalAmount,
    }))
    return orders
  }

export const findAllOrdersByInactiveStatusByUpdatedAtDescImpl: FindAllOrdersByInactiveStatusOrderByUpdatedAtDesc =
  async ({ dbClient, pagination }) => {
    const dbOrders = await dbClient.query.orderTable.findMany({
      where: inArray(orderTable.status, ["completed", "cancelled"]),
      with: {
        orderItems: true,
      },
      orderBy: [desc(orderTable.updatedAt)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    const orders = dbOrders.map((dbOrder) => ({
      id: dbOrder.id,
      customerName: dbOrder.customerName,
      createdAt: dbOrder.createdAt,
      status: dbOrder.status,
      updatedAt: dbOrder.updatedAt,
      orderItems: dbOrder.orderItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitAmount: item.unitAmount,
        quantity: item.quantity,
      })),
      totalAmount: dbOrder.totalAmount,
    }))
    return orders
  }

export const findOrderStatusCountsImpl: FindOrderStatusCounts = async ({
  dbClient,
}) => {
  const rows = await dbClient
    .select({
      status: orderTable.status,
      count: sql<number>`count(${orderTable.id})`,
    })
    .from(orderTable)
    .groupBy(orderTable.status)

  return rows.map((row) => ({
    status: row.status,
    count: Number(row.count ?? 0),
  }))
}

export const findAllDailyOrderAggregationsImpl: FindAllDailyOrderAggregations =
  async ({ dbClient, pagination, orderCreatedAtRange }) => {
    const dayExpression = sql<Date>`date_trunc('day', ${orderTable.createdAt})`
    const rows = await dbClient
      .select({
        day: dayExpression,
        orderCount: sql<number>`count(${orderTable.id})`,
        revenue: sql<number>`coalesce(sum(${orderTable.totalAmount}), 0)`,
      })
      .from(orderTable)
      .where(
        and(
          gte(orderTable.createdAt, orderCreatedAtRange.from),
          lte(orderTable.createdAt, orderCreatedAtRange.to),
        ),
      )
      .groupBy(dayExpression)
      .orderBy(dayExpression)
      .limit(pagination.limit)
      .offset(pagination.offset)

    const aggregations = rows.map((row) => {
      const dayValue =
        row.day instanceof Date ? row.day : new Date(row.day as string)
      if (Number.isNaN(dayValue.getTime())) {
        throw new Error(
          `Invalid date value encountered in daily order aggregation: ${row.day}`,
        )
      }
      return {
        date: dayValue,
        orderCount: Number(row.orderCount ?? 0),
        revenue: Number(row.revenue ?? 0),
      }
    })

    return aggregations
  }
