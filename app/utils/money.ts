const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
})

/**
 * 日本円の金額を通貨形式でフォーマットする
 *
 * @param amount - フォーマットしたい金額
 * @returns 日本円の通貨表記（例: `￥1,234`）
 */
export const formatCurrencyJPY = (amount: number): string => {
  if (!Number.isFinite(amount)) {
    throw new Error("amount must be a finite number")
  }

  return currencyFormatter.format(amount)
}
