export const getStockStatus = (stock: number) => {
  if (stock === 0) {
    return "out-of-stock"
  }
  if (stock <= 5) {
    return "low-stock"
  }
  return "in-stock"
}

export type StockStatus = ReturnType<typeof getStockStatus>

export const getStockStatusLabel = (status: StockStatus) => {
  switch (status) {
    case "out-of-stock":
      return "在庫切れ"
    case "low-stock":
      return "残りわずか"
    case "in-stock":
      return "在庫あり"
  }
}
