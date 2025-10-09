import { createOrderImpl } from "../../../infrastructure/domain/order/orderCommandRepositoryImpl"
import { countStringLength } from "../../../utils/text"
import type { CommandRepositoryFunction, WithRepositoryImpl } from "../../types"
import type Order from "../entities/order"

const validateOrder = (order: Omit<Order, "id">) => {
  if (order.customerName && countStringLength(order.customerName) > 50) {
    throw new Error("顧客名は50文字以内である必要があります")
  }
  if (
    order.totalAmount !==
    order.orderItems.reduce(
      (sum, item) => sum + item.unitAmount * item.quantity,
      0,
    )
  ) {
    throw new Error("合計金額が正しくありません")
  }
  if (order.orderItems.length < 1 || order.orderItems.length > 20) {
    throw new Error("注文項目は1種類以上20種類以下である必要があります")
  }
  for (const item of order.orderItems) {
    if (item.quantity < 1)
      throw new Error("注文項目の数量は1以上である必要があります")
    if (item.unitAmount < 0)
      throw new Error("注文項目の単価は0以上である必要があります")
    if (
      countStringLength(item.productName) < 1 ||
      countStringLength(item.productName) > 500
    ) {
      throw new Error("商品名は1文字以上500文字以内である必要があります")
    }
  }
}

export type CreateOrder = CommandRepositoryFunction<
  { order: Omit<Order, "id"> },
  Order | null
>
export type UpdateOrder = CommandRepositoryFunction<
  { order: Order },
  Order | null
>
export type DeleteOrder = CommandRepositoryFunction<
  { order: Pick<Order, "id"> },
  void
>

export const createOrder: WithRepositoryImpl<CreateOrder> = async ({
  repositoryImpl = createOrderImpl,
  dbClient,
  order,
}) => {
  validateOrder(order)
  return repositoryImpl({ order, dbClient })
}
