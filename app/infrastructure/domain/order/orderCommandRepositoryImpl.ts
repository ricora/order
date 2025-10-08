import type Order from "../../../domain/order/entities/order"
import type { CreateOrder } from "../../../domain/order/repositories/orderCommandRepository"
import { orderItemTable, orderTable } from "../../db/schema"

export const createOrderImpl: CreateOrder = async ({ dbClient, order }) => {
  try {
    const dbOrder = (
      await dbClient
        .insert(orderTable)
        .values({
          customerName: order.customerName,
          createdAt: order.createdAt,
          totalAmount: order.totalAmount,
        })
        .returning()
    )[0]
    if (!dbOrder) throw new Error("DBへの挿入に失敗しました")

    const dbOrderItems = await dbClient
      .insert(orderItemTable)
      .values(
        order.orderItems.map((item) => ({
          orderId: dbOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitAmount: item.unitAmount,
          productName: item.productName,
        })),
      )
      .returning()

    const newOrder: Order = {
      id: dbOrder.id,
      customerName: dbOrder.customerName,
      createdAt: dbOrder.createdAt,
      orderItems: dbOrderItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitAmount: item.unitAmount,
        quantity: item.quantity,
      })),
      totalAmount: dbOrder.totalAmount,
    }
    return newOrder
  } catch {
    throw new Error("注文の作成に失敗しました")
  }
}
