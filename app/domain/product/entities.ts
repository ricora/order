export type Product = {
  id: number
  name: string
  tagIds: number[]
  price: number
  stock: number
}

export type ProductImage = {
  id: number
  productId: number
  data: string
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
  createdAt: Date
  updatedAt: Date
}

export type ProductTag = {
  id: number
  name: string
}
