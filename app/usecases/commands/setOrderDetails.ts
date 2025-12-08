import type Order from "../../domain/order/entities/order"
import type { Result } from "../../domain/types"
import type { DbClient } from "../../libs/db/client"
import { orderRepository } from "../repositories-provider"

const { updateOrder: updateOrderRepo } = orderRepository

export type SetOrderDetailsParams = {
  dbClient: DbClient
  order: Pick<Order, "id"> &
    Partial<Pick<Order, "customerName" | "comment" | "status">>
}

export const setOrderDetails = async ({
  dbClient,
  order,
}: SetOrderDetailsParams): Promise<
  Result<Order, "エラーが発生しました。" | "注文が見つかりません。">
> => {
  const errorMessage = "エラーが発生しました。"
  const txResult = await dbClient.transaction(async (tx) => {
    const result = await (async () => {
      try {
        return await updateOrderRepo({
          dbClient: tx,
          order: {
            id: order.id,
            customerName: order.customerName,
            comment: order.comment,
            status: order.status,
            updatedAt: new Date(),
          },
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
