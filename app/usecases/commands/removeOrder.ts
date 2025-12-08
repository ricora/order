import type Order from "../../domain/order/entities/order"
import type { Result } from "../../domain/types"
import type { DbClient } from "../../libs/db/client"
import { orderRepository } from "../repositories-provider"

const { deleteOrder } = orderRepository

export type RemoveOrderParams = {
  dbClient: DbClient
  order: Pick<Order, "id">
}

export const removeOrder = async ({
  dbClient,
  order,
}: RemoveOrderParams): Promise<Result<void, "エラーが発生しました。">> => {
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
