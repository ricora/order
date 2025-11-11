type Order = {
  id: number
  customerName: string | null
  createdAt: Date
  updatedAt: Date
  status: "pending" | "processing" | "completed" | "cancelled"
  orderItems: {
    productId: number | null
    productName: string
    unitAmount: number
    quantity: number
  }[]
  totalAmount: number
}
export default Order
