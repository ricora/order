import type { Order } from "../../domain/order/entities"
import { orderRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const { deleteOrder } = orderRepository

export type RemoveOrder = UsecaseFunction<
  { order: Pick<Order, "id"> },
  void,
  never
>

export const removeOrder: RemoveOrder = async ({ dbClient, order }) => {
  const errorMessage = "エラーが発生しました。"
  const txResult = await dbClient.transaction(async (tx) => {
    const result = await (async () => {
      try {
        return await deleteOrder({ dbClient: tx, order })
      } catch {
        return { ok: false, message: errorMessage } as const
      }
    })()
    if (!result.ok) {
      return { ok: false, message: errorMessage } as const
    }
    return { ok: true, value: result.value } as const
  })
  return txResult
}
