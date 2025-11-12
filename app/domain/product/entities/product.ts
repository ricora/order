type Product = {
  id: number
  name: string
  tagIds: number[]
  price: number
  stock: number
  image: {
    data: string
    mimeType: string
  } | null
}

export default Product
