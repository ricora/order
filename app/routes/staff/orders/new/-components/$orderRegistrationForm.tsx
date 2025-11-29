import type { FC } from "hono/jsx"
import { useCallback, useEffect, useMemo, useState } from "hono/jsx"
import { tv } from "tailwind-variants"
import { createHonoClient } from "../../../../../helpers/api/hono-client"
import type { RegisterOrderParams } from "../../../../../usecases/commands/registerOrder"
import type { OrderRegistrationFormComponentData } from "../../../../../usecases/queries/getOrderRegistrationFormComponentData"
import { formatCurrencyJPY } from "../../../../../utils/money"
import RotateCwIcon from "../../../../-components/icons/lucide/rotateCwIcon"
import SendIcon from "../../../../-components/icons/lucide/sendIcon"
import Trash2Icon from "../../../../-components/icons/lucide/trash2Icon"
import GraphemeInput from "../../../../-components/ui/$graphemeInput"
import GraphemeTextarea from "../../../../-components/ui/$graphemeTextarea"
import Button from "../../../../-components/ui/button"
import Chip from "../../../../-components/ui/chip"
import ChipButton from "../../../../-components/ui/chipButton"
import Input from "../../../../-components/ui/input"
import Label from "../../../../-components/ui/label"

type OrderItem = RegisterOrderParams["order"]["orderItems"][number] & {
  productName: string
  unitAmount: number
}

const productButton = tv({
  base: "group w-full rounded border px-3 py-3 text-left transition",
  variants: {
    disabled: {
      true: "cursor-not-allowed bg-bg opacity-50",
      false:
        "cursor-pointer bg-bg hover:border-primary-subtle hover:bg-primary-subtle",
    },
  },
  defaultVariants: {
    disabled: false,
  },
})

const OrderRegistrationForm: FC = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [items, setItems] = useState<OrderItem[]>([])
  const [products, setProducts] = useState<
    OrderRegistrationFormComponentData["products"]
  >([])
  const [tags, setTags] = useState<OrderRegistrationFormComponentData["tags"]>(
    [],
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const MAX_DISTINCT_ORDER_ITEMS = 20

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const honoClient = createHonoClient()
      const response = await honoClient["order-registration-form"].$get()
      if (!response.ok) {
        throw new Error(
          `Failed to fetch products: ${response.status} ${response.statusText}`,
        )
      }
      const { products: fetchedProducts, tags: fetchedTags } =
        await response.json()
      setProducts(fetchedProducts)
      setTags(fetchedTags)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const addProduct = (
    product: OrderRegistrationFormComponentData["products"][number],
  ) => {
    setItems((prevItems) => {
      const productIdStr = String(product.id)
      const existingItem = prevItems.find(
        (item) => String(item.productId) === productIdStr,
      )

      if (!existingItem && prevItems.length >= MAX_DISTINCT_ORDER_ITEMS) {
        return prevItems
      }

      const reservedForThis = prevItems.reduce((sum, currentItem) => {
        return (
          sum +
          (String(currentItem.productId) === productIdStr
            ? currentItem.quantity || 0
            : 0)
        )
      }, 0)
      const remainingForThis = product.stock - reservedForThis
      if (remainingForThis <= 0) return prevItems

      if (existingItem) {
        return prevItems.map((item) =>
          String(item.productId) === productIdStr
            ? {
                ...item,
                quantity: Math.min((item.quantity || 0) + 1, product.stock),
              }
            : item,
        )
      }
      return [
        ...prevItems,
        {
          productId: product.id,
          productName: product.name,
          unitAmount: product.price,
          quantity: 1,
        },
      ]
    })
  }

  const setQuantity = (productId: number | string | null, quantity: number) => {
    setItems((prevItems) =>
      prevItems
        .map((item) =>
          String(item.productId) === String(productId)
            ? { ...item, quantity }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const removeItem = (productId: number | string | null) => {
    setItems((prevItems) =>
      prevItems.filter((item) => String(item.productId) !== String(productId)),
    )
  }

  const clearItems = () => {
    setItems([])
  }

  const reservedMap: Record<string, number> = {}
  items.forEach((item) => {
    reservedMap[String(item.productId)] =
      (reservedMap[String(item.productId)] || 0) + (item.quantity || 0)
  })

  const total = items.reduce(
    (s, item) => s + item.unitAmount * (item.quantity || 0),
    0,
  )
  const formattedTotal = formatCurrencyJPY(total)

  const allTags = useMemo(() => tags.map((t) => t.name), [tags])

  const slice = useMemo(() => {
    if (selectedTags.length === 0) return products
    return products.filter((product) =>
      selectedTags.every((t) => product.tags.includes(t)),
    )
  }, [products, selectedTags])

  const isCartEmpty = items.length === 0
  const [customerName, setCustomerName] = useState("")
  const [comment, setComment] = useState("")

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="md:col-span-3">
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">タグ一覧</h3>
            <Button
              type="button"
              variant="secondary"
              onClick={fetchData}
              disabled={isLoading}
              ariaLabel="商品一覧を更新する"
            >
              <div class="size-4">
                <RotateCwIcon />
              </div>
              <span>{isLoading ? "読み込み中..." : "商品一覧を更新する"}</span>
            </Button>
          </div>
          {isLoading ? (
            <div className="mb-3 flex items-center justify-center rounded border border-border/50 bg-muted p-6">
              <div className="text-muted-fg text-sm">読み込み中...</div>
            </div>
          ) : (
            <div className="mb-3 flex max-h-35 flex-wrap gap-2 overflow-auto rounded border border-border/50 bg-muted p-2">
              {error ? (
                <div className="items-center justify-center text-center text-muted-fg text-sm">
                  タグ一覧の取得に失敗しました。しばらくしてから再試行してください。
                </div>
              ) : (
                allTags.map((tag) => {
                  const active = selectedTags.includes(tag)
                  return (
                    <ChipButton
                      key={tag}
                      isActive={active}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </ChipButton>
                  )
                })
              )}
            </div>
          )}
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
          <div className="mb-3 h-12 space-y-1 text-muted-fg text-xs">
            <div>クリックでカートに追加します。</div>
            <div>表示件数 {slice.length}件</div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center rounded border border-border/50 bg-muted p-12">
              <div className="text-muted-fg text-sm">読み込み中...</div>
            </div>
          ) : (
            <div
              id="product-list-wrapper"
              className="max-h-[60vh] overflow-auto rounded border border-border/50 bg-muted p-3 md:max-h-[70vh]"
            >
              {error ? (
                <div className="items-center justify-center text-center text-muted-fg text-sm">
                  商品一覧の取得に失敗しました。しばらくしてから再試行してください。
                </div>
              ) : (
                <div id="product-list" className="space-y-3">
                  {slice.map((product) => {
                    const remaining = Math.max(
                      0,
                      product.stock - (reservedMap[String(product.id)] || 0),
                    )
                    const disabledForProduct =
                      remaining <= 0 ||
                      (items.length >= MAX_DISTINCT_ORDER_ITEMS &&
                        !items.some(
                          (it) => String(it.productId) === String(product.id),
                        ))

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        disabled={disabledForProduct}
                        className={productButton({
                          disabled: disabledForProduct,
                        })}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <img
                              src={`/images/products/${product.id}`}
                              alt={product.name}
                              className="h-10 w-10 shrink-0 rounded object-cover"
                              loading="lazy"
                            />
                            <div className="min-w-0">
                              <div className="truncate font-medium transition-colors group-hover:text-primary-subtle-fg">
                                {product.name}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {product.tags.map((tag) => (
                                  <Chip key={tag} size="xs">
                                    {tag}
                                  </Chip>
                                ))}
                              </div>
                              <div className="mt-1 text-muted-fg text-xs">
                                残り
                                <span data-remaining-for={product.id}>
                                  {remaining}
                                </span>
                                個
                              </div>
                            </div>
                          </div>

                          <div className="font-mono transition-colors group-hover:text-primary-subtle-fg">
                            {formatCurrencyJPY(product.price)}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="md:col-span-2">
        <div className="mb-3">
          <h3 className="mb-1 font-semibold">カート</h3>
        </div>
        <div className="rounded border bg-bg p-3">
          <form method="post" id="order-form" className="space-y-4">
            <div className="mb-3 flex h-12 items-center justify-between">
              <div className="text-muted-fg text-xs">
                総額{" "}
                <span id="order-total" className="font-mono">
                  {formattedTotal}
                </span>
              </div>
              <Button
                type="button"
                variant="danger"
                onClick={clearItems}
                ariaLabel="カートを空にする"
              >
                <div className="size-4">
                  <Trash2Icon />
                </div>
                <span>カートを空にする</span>
              </Button>
            </div>

            <div
              id="order-items"
              className="h-[50vh] space-y-3 overflow-auto rounded border border-border/50 bg-muted p-3"
            >
              {items.length === 0 && (
                <div className="flex h-full items-center justify-center text-center text-muted-fg">
                  カートに商品がありません
                </div>
              )}

              {items.map((item) => {
                const productInList = products.find(
                  (product) => String(product.id) === String(item.productId),
                )
                const maxStock = productInList ? productInList.stock : undefined
                return (
                  <div
                    key={String(item.productId)}
                    className="rounded border bg-bg p-3"
                    data-product-id={String(item.productId)}
                    data-price={String(item.unitAmount)}
                  >
                    <input
                      type="hidden"
                      name="items[][productId]"
                      value={String(item.productId)}
                    />
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <img
                          src={`/images/products/${item.productId}`}
                          alt={item.productName}
                          className="h-10 w-10 shrink-0 rounded object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {item.productName}
                          </div>
                          <div className="mt-1 truncate font-mono text-muted-fg text-sm">{`${formatCurrencyJPY(item.unitAmount)} × ${item.quantity} = ${formatCurrencyJPY(item.unitAmount * item.quantity)}`}</div>
                        </div>
                      </div>

                      <div className="mt-2 flex shrink-0 items-center gap-2 md:mt-0 md:gap-4">
                        <Label
                          htmlFor={`quantity-${String(item.productId)}`}
                          required
                        >
                          数量
                        </Label>
                        <input
                          type="hidden"
                          name="items[][quantity]"
                          value={String(item.quantity)}
                        />
                        <div className="w-20 md:w-24">
                          <Input
                            id={`quantity-${String(item.productId)}`}
                            type="number"
                            value={String(item.quantity)}
                            min={1}
                            max={maxStock}
                            required
                            onChange={(e: Event) => {
                              const target = e.target as HTMLInputElement
                              const v = Number(target.value) || 0
                              const clamped =
                                maxStock !== undefined
                                  ? Math.min(Math.max(1, v), maxStock)
                                  : Math.max(1, v)
                              setQuantity(item.productId, clamped)
                            }}
                          />
                        </div>

                        <div className="shrink-0">
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => removeItem(item.productId)}
                            ariaLabel="削除"
                          >
                            <div className="size-4">
                              <Trash2Icon />
                            </div>
                            <span>削除</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <Label htmlFor="customerName">顧客名</Label>
                <GraphemeInput
                  id="customerName"
                  name="customerName"
                  value={customerName}
                  onChange={setCustomerName}
                  maxLength={50}
                  placeholder="顧客名"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex-1">
                <Label htmlFor="comment">備考欄</Label>
                <GraphemeTextarea
                  id="comment"
                  name="comment"
                  value={comment}
                  onChange={setComment}
                  maxLength={250}
                  placeholder="注文に関する備考のコメントを入力"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="ml-auto">
                <Button type="submit" disabled={isCartEmpty}>
                  <div className="size-4">
                    <SendIcon />
                  </div>
                  <span>注文を登録</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

export default OrderRegistrationForm
