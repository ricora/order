import type { FC } from "hono/jsx"
import { validator } from "hono/validator"
import { createRoute } from "honox/factory"
import { tv } from "tailwind-variants"
import { registerProduct } from "../../../usecases/commands/registerProduct"
import {
  getProductsManagementPageData,
  LOW_STOCK_THRESHOLD,
} from "../../../usecases/queries/getProductsManagementPageData"
import { formatCurrencyJPY } from "../../../utils/money"
import CircleCheckIcon from "../../-components/icons/lucide/circleCheckIcon"
import PackageIcon from "../../-components/icons/lucide/packageIcon"
import SirenIcon from "../../-components/icons/lucide/sirenIcon"
import TriangleAlertIcon from "../../-components/icons/lucide/triangleAlertIcon"
import Badge from "../../-components/ui/badge"
import Chip from "../../-components/ui/chip"
import ItemCollectionViewer from "../../-components/ui/itemCollectionViewer"
import { setToastCookie } from "../../-helpers/ui/toast"
import Layout from "../-components/layout"
import ProductRegistrationForm from "./-components/$productRegistrationForm"
import { parseProductRegistrationFormData } from "./-helpers/parseProductRegistrationFormData"

const statusCardVariants = tv({
  slots: {
    container: "flex flex-col rounded-lg border p-4",
    header: "flex flex-row items-center justify-between pb-2",
    title: "font-medium text-md",
    icon: "h-4 w-4",
    value: "font-bold text-3xl",
    description: "mt-3 text-xs",
  },
  variants: {
    variant: {
      info: {
        container: "border-info-subtle bg-info-subtle",
        title: "text-info-subtle-fg",
        icon: "text-info-subtle-fg",
        value: "text-info-subtle-fg",
        description: "text-info-subtle-fg",
      },
      success: {
        container: "border-success-subtle bg-success-subtle",
        title: "text-success-subtle-fg",
        icon: "text-success-subtle-fg",
        value: "text-success-subtle-fg",
        description: "text-success-subtle-fg",
      },
      warning: {
        container: "border-warning-subtle bg-warning-subtle",
        title: "text-warning-subtle-fg",
        icon: "text-warning-subtle-fg",
        value: "text-warning-subtle-fg",
        description: "text-warning-subtle-fg",
      },
      danger: {
        container: "border-danger-subtle bg-danger-subtle",
        title: "text-danger-subtle-fg",
        icon: "text-danger-subtle-fg",
        value: "text-danger-subtle-fg",
        description: "text-danger-subtle-fg",
      },
    },
  },
})

type StatusCardProps = {
  variant: "info" | "success" | "warning" | "danger"
  icon: FC
  title: string
  value: number
  description: string
}

const StatusCard = ({
  variant,
  icon,
  title,
  value,
  description,
}: StatusCardProps) => {
  const {
    container,
    header,
    title: titleClass,
    icon: iconClass,
    value: valueClass,
    description: descriptionClass,
  } = statusCardVariants({ variant })
  const Icon = icon
  return (
    <div class={container()}>
      <div class={header()}>
        <span class={titleClass()}>{title}</span>
        <div class={iconClass()}>
          <Icon />
        </div>
      </div>
      <div class={valueClass()}>{value}</div>
      <p class={descriptionClass()}>{description}</p>
    </div>
  )
}

type ProductStockStatusCardsProps = {
  totalProducts: number
  inStockCount: number
  outOfStockCount: number
  lowStockCount: number
}

const ProductStockStatusCards = ({
  totalProducts,
  inStockCount,
  outOfStockCount,
  lowStockCount,
}: ProductStockStatusCardsProps) => (
  <div class="mx-auto max-w-7xl rounded-lg border bg-bg p-6">
    <div class="mb-2 flex items-baseline justify-between">
      <h2 class="font-bold text-lg">在庫状況</h2>
    </div>
    <div class="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-4">
      <StatusCard
        variant="info"
        icon={PackageIcon}
        title="総商品数"
        value={totalProducts}
        description="登録済み商品"
      />
      <StatusCard
        variant="success"
        icon={CircleCheckIcon}
        title="在庫十分"
        value={inStockCount}
        description={`在庫${LOW_STOCK_THRESHOLD + 1}個以上`}
      />
      <StatusCard
        variant="warning"
        icon={TriangleAlertIcon}
        title="在庫わずか"
        value={lowStockCount}
        description={`在庫${LOW_STOCK_THRESHOLD}個以下`}
      />
      <StatusCard
        variant="danger"
        icon={SirenIcon}
        title="在庫切れ"
        value={outOfStockCount}
        description="要補充商品"
      />
    </div>
  </div>
)

const statusLabel: Record<string, string> = {
  inStock: "在庫あり",
  lowStock: "在庫わずか",
  outOfStock: "在庫切れ",
}

const statusVariantMap: Record<string, "danger" | "warning" | "success"> = {
  inStock: "success",
  lowStock: "warning",
  outOfStock: "danger",
}

type OrderStatusBadgeProps = {
  status: "inStock" | "lowStock" | "outOfStock"
}

const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  return (
    <Badge variant={statusVariantMap[status]}>
      {statusLabel[status] ?? status}
    </Badge>
  )
}

export const POST = createRoute(
  validator("form", async (value, c) => {
    const parsed = await parseProductRegistrationFormData(value)
    if (parsed === null) {
      setToastCookie(c, "error", "不正なリクエストです")
      return c.redirect(c.req.url)
    }
    return { product: parsed }
  }),
  async (c) => {
    const { product } = c.req.valid("form")
    const res = await registerProduct({
      dbClient: c.get("dbClient"),
      product,
    })
    if (!res.ok) {
      setToastCookie(c, "error", res.message)
      return c.redirect(c.req.url)
    }
    setToastCookie(c, "success", "商品を登録しました")
    return c.redirect(c.req.url)
  },
)

export default createRoute(async (c) => {
  const url = new URL(c.req.url)
  const viewMode = c.req.query("view") === "card" ? "card" : "table"
  const urlSearch = url.search

  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10))
  const sort = c.req.query("sort") === "desc" ? "desc" : "asc"

  const res = await getProductsManagementPageData({
    dbClient: c.get("dbClient"),
    page,
    sort,
  })
  if (!res.ok) throw new Error(res.message)
  const {
    products,
    totalProducts,
    inStockCount,
    outOfStockCount,
    lowStockCount,
    hasNextPage,
    currentPage,
  } = res.value

  return c.render(
    <Layout title="商品管理" description="商品情報の登録や編集を行います。">
      <ProductStockStatusCards
        totalProducts={totalProducts}
        inStockCount={inStockCount}
        outOfStockCount={outOfStockCount}
        lowStockCount={lowStockCount}
      />
      <div>
        <ProductRegistrationForm />
      </div>
      <ItemCollectionViewer
        title="商品一覧"
        sort={sort}
        columns={[
          { header: "画像", align: "left" },
          { header: "商品名", align: "left" },
          { header: "タグ", align: "left" },
          { header: "価格", align: "right" },
          { header: "在庫", align: "center" },
          { header: "ステータス", align: "center" },
        ]}
        items={products.map((product) => ({
          id: product.id,
          fields: [
            {
              type: "image",
              src: `/images/products/${product.id}`,
              alt: product.name,
            },
            { type: "text", value: product.name },
            {
              type: "custom",
              content: (
                <div class="flex flex-wrap gap-1">
                  {product.tags.map((tag) => (
                    <Chip key={tag} size="xs">
                      {tag}
                    </Chip>
                  ))}
                </div>
              ),
            },
            {
              type: "custom",
              content: (
                <span class="font-mono">
                  {formatCurrencyJPY(product.price)}
                </span>
              ),
            },
            { type: "number", value: product.stock },
            {
              type: "custom",
              content: <OrderStatusBadge status={product.status} />,
            },
          ],
          editUrl: `/staff/products/${product.id}/edit`,
          deleteUrl: `/staff/products/${product.id}/delete`,
        }))}
        viewMode={viewMode}
        urlSearch={urlSearch}
        emptyMessage="商品が登録されていません"
        currentPage={currentPage}
        hasNextPage={hasNextPage}
      />
    </Layout>,
  )
})
