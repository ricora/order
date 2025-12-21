import type { Order } from "../../domain/order/entities"
import { orderRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const { updateOrder: updateOrderRepo } = orderRepository

const WHITELISTED_ERRORS_ARRAY = [
  "顧客名は50文字以内である必要があります。",
  "コメントは250文字以内である必要があります。",
  "注文が見つかりません。",
  "注文の状態は'pending', 'processing', 'completed', 'cancelled'のいずれかである必要があります。",
] as const

type WhitelistedError = (typeof WHITELISTED_ERRORS_ARRAY)[number]

const WHITELISTED_ERRORS = new Set<string>(
  WHITELISTED_ERRORS_ARRAY as readonly string[],
)

const isWhitelistedError = (v: unknown): v is WhitelistedError =>
  typeof v === "string" && WHITELISTED_ERRORS.has(v)

export type SetOrderDetailsError = "エラーが発生しました。" | WhitelistedError
export type SetOrderDetails = UsecaseFunction<
  {
    order: Pick<Order, "id"> &
      Partial<Pick<Order, "customerName" | "comment" | "status">>
  },
  Order,
  SetOrderDetailsError
>

export const setOrderDetails: SetOrderDetails = async ({ dbClient, order }) => {
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
      if (isWhitelistedError(result.message)) {
        return { ok: false, message: result.message } as const
      }
      return { ok: false, message: errorMessage } as const
    }
    return { ok: true, value: result.value } as const
  })
  if (!txResult.ok) {
    if (isWhitelistedError(txResult.message)) {
      return { ok: false as const, message: txResult.message }
    }
    return { ok: false as const, message: errorMessage }
  }
  return { ok: true as const, value: txResult.value }
}
