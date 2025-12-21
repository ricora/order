import type { Order } from "../../domain/order/entities"
import { orderRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const {
  findAllOrdersByActiveStatusOrderByUpdatedAtAsc,
  findAllOrdersByInactiveStatusOrderByUpdatedAtDesc,
} = orderRepository

/** 処理待ちまたは処理中の注文の取得件数 */
const ACTIVE_ORDERS_LIMIT = 100
/** 完了または取り消しの注文の取得件数 */
const INACTIVE_ORDERS_LIMIT = 50

export type GetOrderProgressManagerComponentData = UsecaseFunction<
  unknown,
  {
    pendingOrders: Order[]
    processingOrders: Order[]
    completedOrders: Order[]
    cancelledOrders: Order[]
  },
  "エラーが発生しました。"
>

export const getOrderProgressManagerComponentData: GetOrderProgressManagerComponentData =
  async ({ dbClient }) => {
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
