import type Order from "../../domain/order/entities/order"
import type { DbClient } from "../../libs/db/client"
import { orderRepository } from "../repositories-provider"

const {
  findAllOrdersByActiveStatusOrderByUpdatedAtAsc,
  findAllOrdersByInactiveStatusOrderByUpdatedAtDesc,
} = orderRepository

export type GetOrderProgressManagerComponentDataParams = {
  dbClient: DbClient
}

export type OrderProgressManagerComponentData = {
  pendingOrders: Order[]
  processingOrders: Order[]
  completedOrders: Order[]
  cancelledOrders: Order[]
}

/** 処理待ちまたは処理中の注文の取得件数 */
const ACTIVE_ORDERS_LIMIT = 100
/** 完了または取り消しの注文の取得件数 */
const INACTIVE_ORDERS_LIMIT = 50

export const getOrderProgressManagerComponentData = async ({
  dbClient,
}: GetOrderProgressManagerComponentDataParams): Promise<OrderProgressManagerComponentData> => {
  const activeOrders = await findAllOrdersByActiveStatusOrderByUpdatedAtAsc({
    dbClient,
    pagination: { offset: 0, limit: ACTIVE_ORDERS_LIMIT },
  })

  const inactiveOrders =
    await findAllOrdersByInactiveStatusOrderByUpdatedAtDesc({
      dbClient,
      pagination: { offset: 0, limit: INACTIVE_ORDERS_LIMIT },
    })

  const pendingOrders = activeOrders.filter((o) => o.status === "pending")
  const processingOrders = activeOrders.filter((o) => o.status === "processing")
  const completedOrders = inactiveOrders.filter((o) => o.status === "completed")
  const cancelledOrders = inactiveOrders.filter((o) => o.status === "cancelled")

  return {
    pendingOrders,
    processingOrders,
    completedOrders,
    cancelledOrders,
  }
}
