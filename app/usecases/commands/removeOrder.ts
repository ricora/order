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
  const errorMessage = "エラーが発生しました。" as const
  try {
    const txResult = await dbClient.transaction(async (tx) => {
      const result = await deleteOrder({ dbClient: tx, order })
      if (!result.ok) {
        throw new Error()
      }
      return { ok: true, value: result.value } as const
    })
    return txResult
  } catch {
    return { ok: false, message: errorMessage } as const
  }
}
