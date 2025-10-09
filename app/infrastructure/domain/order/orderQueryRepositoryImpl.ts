import { eq } from "drizzle-orm"
import type {
  FindAllOrders,
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
    createdAt: dbOrder.createdAt,
    orderItems: dbOrder.orderItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitAmount: item.unitAmount,
      quantity: item.quantity,
    })),
    totalAmount: dbOrder.totalAmount,
  }
}

export const findAllOrdersImpl: FindAllOrders = async ({ dbClient }) => {
  const dbOrders = await dbClient.query.orderTable.findMany({
    with: {
      orderItems: true,
    },
  })
  const orders = dbOrders.map((dbOrder) => ({
    id: dbOrder.id,
    customerName: dbOrder.customerName,
    createdAt: dbOrder.createdAt,
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
