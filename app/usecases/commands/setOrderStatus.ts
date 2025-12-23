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
  let errorMessage: SetOrderStatusError = "エラーが発生しました。"
  try {
    const txResult = await dbClient.transaction(async (tx) => {
      const result = await updateOrder({
        dbClient: tx,
        order: { id: order.id, status: order.status, updatedAt: new Date() },
      })

      if (!result.ok) {
        if (result.message === "注文が見つかりません。") {
          errorMessage = "注文が見つかりません。"
        }
        throw new Error()
      }
      return { ok: true, value: result.value } as const
    })

    return txResult
  } catch {
    return { ok: false, message: errorMessage } as const
  }
}
