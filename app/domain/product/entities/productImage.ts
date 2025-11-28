type ProductImage = {
  id: number
  productId: number
  data: string
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
  createdAt: Date
  updatedAt: Date
}

export default ProductImage
