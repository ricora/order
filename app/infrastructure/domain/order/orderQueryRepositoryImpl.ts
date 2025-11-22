import { asc, desc, eq, inArray } from "drizzle-orm"
import type {
  FindAllOrdersByActiveStatusOrderByUpdatedAtAsc,
  FindAllOrdersByInactiveStatusOrderByUpdatedAtDesc,
  FindAllOrdersOrderByIdAsc,
  FindAllOrdersOrderByIdDesc,
  FindOrderById,
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
    comment: dbOrder.comment,
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

export const findAllOrdersOrderByIdAscImpl: FindAllOrdersOrderByIdAsc = async ({
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
    comment: dbOrder.comment,
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

export const findAllOrdersOrderByIdDescImpl: FindAllOrdersOrderByIdDesc =
  async ({ dbClient, pagination }) => {
    const dbOrders = await dbClient.query.orderTable.findMany({
      with: {
        orderItems: true,
      },
      orderBy: [desc(orderTable.id)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    const orders = dbOrders.map((dbOrder) => ({
      id: dbOrder.id,
      customerName: dbOrder.customerName,
      comment: dbOrder.comment,
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
      comment: dbOrder.comment,
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
      comment: dbOrder.comment,
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
