import type Order from "../../domain/order/entities/order"
import type { Result } from "../../domain/types"
import type { DbClient } from "../../libs/db/client"
import { orderRepository } from "../repositories-provider"

const { updateOrder } = orderRepository

export type SetOrderStatusParams = {
  dbClient: DbClient
  order: Pick<Order, "id" | "status">
}

export const setOrderStatus = async ({
  dbClient,
  order,
}: SetOrderStatusParams): Promise<
  Result<Order, "エラーが発生しました。" | "注文が見つかりません。">
> => {
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
  if (!txResult.ok) return txResult
  return { ok: true, value: txResult.value }
}
