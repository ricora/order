import type { Order } from "../../domain/order/entities"
import type { Result } from "../../domain/types"
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
}: GetOrderProgressManagerComponentDataParams): Promise<
  Result<OrderProgressManagerComponentData, "エラーが発生しました。">
> => {
  try {
    const activeOrdersResult =
      await findAllOrdersByActiveStatusOrderByUpdatedAtAsc({
        dbClient,
        pagination: { offset: 0, limit: ACTIVE_ORDERS_LIMIT },
      })
    if (!activeOrdersResult.ok) {
      return { ok: false, message: "エラーが発生しました。" }
    }
    const activeOrders = activeOrdersResult.value

    const inactiveOrdersResult =
      await findAllOrdersByInactiveStatusOrderByUpdatedAtDesc({
        dbClient,
        pagination: { offset: 0, limit: INACTIVE_ORDERS_LIMIT },
      })
    if (!inactiveOrdersResult.ok) {
      return { ok: false, message: "エラーが発生しました。" }
    }
    const inactiveOrders = inactiveOrdersResult.value

    const pendingOrders = activeOrders.filter((o) => o.status === "pending")
    const processingOrders = activeOrders.filter(
      (o) => o.status === "processing",
    )
    const completedOrders = inactiveOrders.filter(
      (o) => o.status === "completed",
    )
    const cancelledOrders = inactiveOrders.filter(
      (o) => o.status === "cancelled",
    )

    return {
      ok: true,
      value: {
        pendingOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
      },
    }
  } catch {
    return { ok: false, message: "エラーが発生しました。" }
  }
}
