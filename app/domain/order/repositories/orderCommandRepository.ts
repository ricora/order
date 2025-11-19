import {
  createOrderImpl,
  updateOrderImpl,
} from "../../../infrastructure/domain/order/orderCommandRepositoryImpl"
import { countStringLength } from "../../../utils/text"
import type { CommandRepositoryFunction, WithRepositoryImpl } from "../../types"
import type Order from "../entities/order"
import { ORDER_STATUSES } from "../entities/order"

const ALLOWED_ORDER_STATUSES = new Set(ORDER_STATUSES)

const validateOrder = (
  order: Partial<Omit<Order, "id">>,
  commandType: "create" | "update",
) => {
  if (order.status) {
    if (!ALLOWED_ORDER_STATUSES.has(order.status)) {
      throw new Error(
        "注文の状態は'pending', 'processing', 'completed', 'cancelled'のいずれかである必要があります",
      )
    }

    if (commandType === "create") {
      if (order.status !== "pending") {
        throw new Error(
          "新規に登録する注文の状態は'pending'である必要があります",
        )
      }
    }
  }
  if (order.customerName !== undefined) {
    if (
      order.customerName !== null &&
      countStringLength(order.customerName) > 50
    ) {
      throw new Error("顧客名は50文字以内である必要があります")
    }
  }
  if (order.orderItems) {
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
  if (commandType === "create") {
    if (
      order.createdAt === undefined ||
      order.updatedAt === undefined ||
      order.createdAt.getTime() !== order.updatedAt.getTime()
    ) {
      throw new Error(
        "新規に登録する注文の作成日時と更新日時は同じである必要があります",
      )
    }
  }
}

export type CreateOrder = CommandRepositoryFunction<
  { order: Omit<Order, "id"> },
  Order | null
>
export type UpdateOrder = CommandRepositoryFunction<
  {
    order: Pick<Order, "id" | "updatedAt"> &
      Partial<Pick<Order, "customerName" | "status">>
  },
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
  validateOrder(order, "create")
  return repositoryImpl({ order, dbClient })
}

export const updateOrder: WithRepositoryImpl<UpdateOrder> = async ({
  repositoryImpl = updateOrderImpl,
  dbClient,
  order,
}) => {
  validateOrder(order, "update")
  return repositoryImpl({ order, dbClient })
}
