type OrderStatus = "pending" | "processing" | "completed" | "cancelled"

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
