import { eq } from "drizzle-orm"
import type Order from "../../../domain/order/entities/order"
import type {
  CreateOrder,
  DeleteOrder,
  UpdateOrder,
} from "../../../domain/order/repositories/orderCommandRepository"
import { orderItemTable, orderTable } from "../../db/schema"

export const createOrderImpl: CreateOrder = async ({ dbClient, order }) => {
  try {
    const dbOrder = (
      await dbClient
        .insert(orderTable)
        .values({
          customerName: order.customerName,
          comment: order.comment,
          createdAt: order.createdAt,
          status: order.status,
          totalAmount: order.totalAmount,
          updatedAt: order.createdAt,
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
      comment: dbOrder.comment,
      createdAt: dbOrder.createdAt,
      status: dbOrder.status,
      updatedAt: dbOrder.updatedAt,
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

export const updateOrderImpl: UpdateOrder = async ({ dbClient, order }) => {
  try {
    const updatedOrder = (
      await dbClient
        .update(orderTable)
        .set({
          customerName: order.customerName,
          comment: order.comment,
          status: order.status,
          updatedAt: order.updatedAt,
        })
        .where(eq(orderTable.id, order.id))
        .returning()
    )[0]
    if (!updatedOrder) return null

    const dbOrderItems = await dbClient
      .select()
      .from(orderItemTable)
      .where(eq(orderItemTable.orderId, updatedOrder.id))

    const newOrder: Order = {
      id: updatedOrder.id,
      customerName: updatedOrder.customerName,
      comment: updatedOrder.comment,
      createdAt: updatedOrder.createdAt,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updatedAt,
      orderItems: dbOrderItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitAmount: item.unitAmount,
        quantity: item.quantity,
      })),
      totalAmount: updatedOrder.totalAmount,
    }
    return newOrder
  } catch {
    throw new Error("注文の更新に失敗しました")
  }
}

export const deleteOrderImpl: DeleteOrder = async ({ dbClient, order }) => {
  try {
    await dbClient
      .delete(orderItemTable)
      .where(eq(orderItemTable.orderId, order.id))
    await dbClient.delete(orderTable).where(eq(orderTable.id, order.id))
  } catch {
    throw new Error("注文の削除に失敗しました")
  }
}
