/**
 * 注文ステータスの定義
 *
 * システム全体で使用するステータス値の正規定義
 */
export const ORDER_STATUSES = [
  "pending",
  "processing",
  "completed",
  "cancelled",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

type Order = {
  id: number
  customerName: string | null
  createdAt: Date
  updatedAt: Date
  status: OrderStatus
  orderItems: {
    productId: number | null
    productName: string
    unitAmount: number
    quantity: number
  }[]
  totalAmount: number
}
export default Order
