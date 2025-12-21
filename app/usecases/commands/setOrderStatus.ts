import type { Order } from "../../domain/order/entities"
import { orderRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const { updateOrder } = orderRepository

export type SetOrderStatusError =
  | "エラーが発生しました。"
  | "注文が見つかりません。"
export type SetOrderStatus = UsecaseFunction<
  { order: Pick<Order, "id" | "status"> },
  Order,
  SetOrderStatusError
>

export const setOrderStatus: SetOrderStatus = async ({ dbClient, order }) => {
  const errorMessage = "エラーが発生しました。"
  const txResult = await dbClient.transaction(async (tx) => {
    const result = await (async () => {
      try {
        return await updateOrder({
          dbClient: tx,
          order: { id: order.id, status: order.status, updatedAt: new Date() },
        })
      } catch {
        return { ok: false, message: errorMessage } as const
      }
    })()
    if (!result.ok) {
      if (result.message === "注文が見つかりません。") {
        return { ok: false, message: result.message } as const
      }
      return { ok: false, message: errorMessage } as const
    }
    return { ok: true, value: result.value } as const
  })
  return txResult
}
