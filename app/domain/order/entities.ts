export type Order = {
  id: number
  customerName: string | null
  comment: string | null
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
