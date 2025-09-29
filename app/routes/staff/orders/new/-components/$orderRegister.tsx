import type { FC } from "hono/jsx"
import { useMemo, useState } from "hono/jsx"
import { tv } from "tailwind-variants"
import type { ProductForUI } from "../"

type OrderItem = {
  productId: number
  name: string
  price: number
  quantity: number
}

const tagFilterButton = tv({
  base: "cursor-pointer rounded border px-2 py-1 text-sm transition",
  variants: {
    isActive: {
      true: "bg-primary text-primary-fg",
      false: "bg-white hover:border-primary-subtle hover:bg-primary-subtle",
    },
  },
  defaultVariants: {
    isActive: false,
  },
})

const submitOrderButton = tv({
  base: "flex items-center gap-2 rounded border px-4 py-2 font-medium text-sm transition",
  variants: {
    isDisabled: {
      true: "cursor-not-allowed border-border bg-muted text-muted-fg",
      false:
        "cursor-pointer border-primary bg-primary text-primary-fg hover:bg-primary/90",
    },
  },
  defaultVariants: {
    isDisabled: false,
  },
})

const OrderRegister: FC<{ products: ProductForUI[] }> = ({ products }) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [items, setItems] = useState<OrderItem[]>([])

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  function addProduct(p: ProductForUI) {
    setItems((prev) => {
      const id = String(p.id)
      const existing = prev.find((it) => String(it.productId) === id)
      if (existing) {
        return prev.map((it) =>
          String(it.productId) === id
            ? { ...it, quantity: Math.min((it.quantity || 0) + 1, p.stock) }
            : it,
        )
      }
      return [
        ...prev,
        { productId: p.id, name: p.name, price: p.price, quantity: 1 },
      ]
    })
  }

  function setQuantity(productId: number | string, quantity: number) {
    setItems((prev) =>
      prev
        .map((it) =>
          String(it.productId) === String(productId) ? { ...it, quantity } : it,
        )
        .filter((it) => it.quantity > 0),
    )
  }

  function removeItem(productId: number | string) {
    setItems((prev) =>
      prev.filter((it) => String(it.productId) !== String(productId)),
    )
  }

  function clearItems() {
    setItems([])
  }

  const reservedMap: Record<string, number> = {}
  items.forEach((it) => {
    reservedMap[String(it.productId)] =
      (reservedMap[String(it.productId)] || 0) + (it.quantity || 0)
  })

  const total = items.reduce((s, it) => s + it.price * (it.quantity || 0), 0)
  const formattedTotal = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(total)

  const allTags = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => p.tags.forEach((t) => set.add(t)))
    return Array.from(set)
  }, [products])

  const slice = useMemo(() => {
    if (selectedTags.length === 0) return products
    return products.filter((p) => selectedTags.every((t) => p.tags.includes(t)))
  }, [products, selectedTags])

  const isCartEmpty = items.length === 0

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="md:col-span-3">
        <div className="mb-3">
          <h3 className="mb-2 font-semibold">タグ一覧</h3>
          <div className="mb-3 flex max-h-35 flex-wrap gap-2 overflow-auto rounded border border-border/50 bg-muted p-2">
            {allTags.map((tag) => {
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  className={tagFilterButton({ isActive: active })}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              )
            })}
          </div>
          <div className="mb-1 text-muted-fg text-xs">
            タグをクリックして商品を絞り込めます。複数選択はAND絞り込みになります。
          </div>
        </div>
      </div>

      <section className="md:col-span-1">
        <div className="mb-3">
          <h3 className="mb-1 font-semibold">商品</h3>
        </div>
        <div className="rounded border bg-bg p-3">
          <div className="mb-2 space-y-1 text-muted-fg text-xs">
            <div>クリックでカートに追加します。</div>
            <div>表示件数: {slice.length}件</div>
          </div>
          <div
            id="product-list-wrapper"
            className="max-h-[60vh] overflow-auto rounded border border-border/50 bg-muted p-2 md:max-h-[70vh]"
          >
            <div id="product-list" className="space-y-2 p-1">
              {slice.map((p) => {
                const remaining = Math.max(
                  0,
                  p.stock - (reservedMap[String(p.id)] || 0),
                )
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full cursor-pointer rounded border bg-white px-3 py-3 text-left transition hover:border-primary-subtle hover:bg-primary-subtle"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={p.image || "/placeholder.svg?height=60&width=60"}
                          alt={p.name}
                          className="h-10 w-10 flex-shrink-0 rounded object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{p.name}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.tags.map((tag) => (
                              <span
                                key={tag}
                                className="whitespace-nowrap rounded border bg-muted px-2 py-0.5 text-muted-fg text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="mt-1 text-muted-fg text-xs">
                            残り:{" "}
                            <span data-remaining-for={p.id}>{remaining}</span>
                          </div>
                        </div>
                      </div>

                      <div className="font-mono">
                        {new Intl.NumberFormat("ja-JP", {
                          style: "currency",
                          currency: "JPY",
                        }).format(p.price)}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="md:col-span-2">
        <div className="mb-3">
          <h3 className="mb-1 font-semibold">カート</h3>
        </div>
        <div className="rounded border bg-bg p-3">
          <form method="post" id="order-form" className="space-y-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-muted-fg text-xs">
                総額:{" "}
                <span id="order-total" className="font-mono">
                  {formattedTotal}
                </span>
              </div>
              <button
                type="button"
                onClick={clearItems}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-md border bg-bg px-3 py-2 font-medium text-danger-subtle-fg text-sm transition hover:border-danger-subtle hover:bg-danger-subtle"
              >
                クリア
              </button>
            </div>

            <div
              id="order-items"
              className="max-h-[50vh] space-y-3 overflow-auto rounded border border-border/50 bg-muted p-3"
            >
              {items.length === 0 && (
                <div className="py-6 text-center text-muted-fg">
                  カートに商品がありません
                </div>
              )}

              {items.map((it) => {
                const prod = products.find(
                  (p) => String(p.id) === String(it.productId),
                )
                const maxStock = prod ? prod.stock : undefined
                return (
                  <div
                    key={String(it.productId)}
                    className="rounded border bg-white p-3"
                    data-product-id={String(it.productId)}
                    data-price={String(it.price)}
                  >
                    <input
                      type="hidden"
                      name="items[][productId]"
                      value={String(it.productId)}
                    />
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <img
                          src={
                            prod?.image || "/placeholder.svg?height=60&width=60"
                          }
                          alt={it.name}
                          className="h-10 w-10 flex-shrink-0 rounded object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{it.name}</div>
                          <div className="mt-1 truncate font-mono text-muted-fg text-sm">{`${new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(it.price)} × ${it.quantity} = ${new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(it.price * it.quantity)}`}</div>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-2 md:mt-0 md:gap-4">
                        <label
                          htmlFor={`quantity-${String(it.productId)}`}
                          className="block text-sm"
                        >
                          数量
                        </label>
                        <input
                          type="hidden"
                          name="items[][quantity]"
                          value={String(it.quantity)}
                        />
                        <input
                          type="number"
                          id={`quantity-${String(it.productId)}`}
                          className="w-20 rounded border px-2 py-1 text-right text-fg text-sm md:w-24"
                          value={String(it.quantity)}
                          min={1}
                          max={maxStock}
                          onChange={(e: Event) => {
                            const target = e.target as HTMLInputElement
                            const v = Number(target.value) || 0
                            const clamped =
                              maxStock !== undefined
                                ? Math.min(Math.max(1, v), maxStock)
                                : Math.max(1, v)
                            setQuantity(it.productId, clamped)
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => removeItem(it.productId)}
                          className="flex cursor-pointer items-center justify-center gap-2 rounded-md border bg-bg px-3 py-2 font-medium text-danger-subtle-fg text-sm transition hover:border-danger-subtle hover:bg-danger-subtle"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <label htmlFor="customerName" className="text-sm">
                  顧客名
                </label>
                <input
                  id="customerName"
                  name="customerName"
                  className="rounded border px-3 py-2 text-fg text-sm"
                  placeholder="顧客名（省略可）"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isCartEmpty}
                className={submitOrderButton({ isDisabled: isCartEmpty })}
              >
                注文を登録
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

export default OrderRegister
