import { asc, desc, eq, inArray } from "drizzle-orm"
import { orderItemTable, orderTable } from "../../libs/db/schema"
import type { Order } from "./entities"
import type { Repository } from "./repository"

export const adapters = {
  findOrderById: async ({ dbClient, order }) => {
    const dbOrder = await dbClient.query.orderTable.findFirst({
      where: eq(orderTable.id, order.id),
      with: {
        orderItems: true,
      },
    })
    if (!dbOrder)
      return {
        ok: false,
        message: "注文が見つかりません。",
      }

    return {
      ok: true,
      value: {
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
      },
    }
  },

  findAllOrdersOrderByIdAsc: async ({ dbClient, pagination }) => {
    const dbOrders = await dbClient.query.orderTable.findMany({
      with: {
        orderItems: true,
      },
      orderBy: [asc(orderTable.id)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return {
      ok: true,
      value: dbOrders.map((dbOrder) => ({
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
      })),
    }
  },

  findAllOrdersOrderByIdDesc: async ({ dbClient, pagination }) => {
    const dbOrders = await dbClient.query.orderTable.findMany({
      with: {
        orderItems: true,
      },
      orderBy: [desc(orderTable.id)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return {
      ok: true,
      value: dbOrders.map((dbOrder) => ({
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
      })),
    }
  },

  findAllOrdersByActiveStatusOrderByUpdatedAtAsc: async ({
    dbClient,
    pagination,
  }) => {
    const dbOrders = await dbClient.query.orderTable.findMany({
      where: inArray(orderTable.status, ["pending", "processing"]),
      with: {
        orderItems: true,
      },
      orderBy: [asc(orderTable.updatedAt)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return {
      ok: true,
      value: dbOrders.map((dbOrder) => ({
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
      })),
    }
  },

  findAllOrdersByInactiveStatusOrderByUpdatedAtDesc: async ({
    dbClient,
    pagination,
  }) => {
    const dbOrders = await dbClient.query.orderTable.findMany({
      where: inArray(orderTable.status, ["completed", "cancelled"]),
      with: {
        orderItems: true,
      },
      orderBy: [desc(orderTable.updatedAt)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return {
      ok: true,
      value: dbOrders.map((dbOrder) => ({
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
      })),
    }
  },

  createOrder: async ({ dbClient, order }) => {
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
    if (!dbOrder) {
      return {
        ok: false,
        message: "エラーが発生しました。",
      }
    }

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
    return { ok: true, value: newOrder }
  },

  updateOrder: async ({ dbClient, order }) => {
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
    if (!updatedOrder) {
      return {
        ok: false,
        message: "注文が見つかりません。",
      }
    }

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
    return {
      ok: true,
      value: newOrder,
    }
  },

  deleteOrder: async ({ dbClient, order }) => {
    await dbClient
      .delete(orderItemTable)
      .where(eq(orderItemTable.orderId, order.id))
    await dbClient.delete(orderTable).where(eq(orderTable.id, order.id))
    return {
      ok: true,
      value: undefined,
    }
  },
} satisfies Repository
