import type { FC } from "hono/jsx"
import { createRoute } from "honox/factory"
import { tv } from "tailwind-variants"
import CircleCheckIcon from "../../../components/icons/lucide/circleCheckIcon"
import PackageIcon from "../../../components/icons/lucide/packageIcon"
import SirenIcon from "../../../components/icons/lucide/sirenIcon"
import TriangleAlertIcon from "../../../components/icons/lucide/triangleAlertIcon"
import Badge from "../../../components/ui/badge"
import Chip from "../../../components/ui/chip"
import ItemCollectionViewer from "../../../components/ui/itemCollectionViewer"
import { setToastCookie } from "../../../helpers/ui/toast"
import {
  getProductsManagementPageData,
  LOW_STOCK_THRESHOLD,
} from "../../../usecases/getProductsManagementPageData"
import { registerProduct } from "../../../usecases/registerProduct"
import { formatCurrencyJPY } from "../../../utils/money"
import Layout from "../-components/layout"
import ProductRegistrationForm from "./-components/$productRegistrationForm"
import { parseProductRequestBody } from "./-helpers/parseRequestBody"

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
    <div className={container()}>
      <div className={header()}>
        <span className={titleClass()}>{title}</span>
        <div className={iconClass()}>
          <Icon />
        </div>
      </div>
      <div className={valueClass()}>{value}</div>
      <p className={descriptionClass()}>{description}</p>
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
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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

export const POST = createRoute(async (c) => {
  try {
    const body = await c.req.parseBody({ all: true })
    const { name, image, price, stock, tags } = parseProductRequestBody(body)

    await registerProduct({
      dbClient: c.get("dbClient"),
      product: {
        name,
        image,
        price,
        stock,
        tags,
      },
    })

    setToastCookie(c, "success", "商品を登録しました")
  } catch (e) {
    setToastCookie(c, "error", String(e))
  }
  return c.redirect(c.req.url)
})

export default createRoute(async (c) => {
  const url = new URL(c.req.url)
  const viewMode = c.req.query("view") === "card" ? "card" : "table"
  const urlSearch = url.search

  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10))

  const {
    products,
    totalProducts,
    inStockCount,
    outOfStockCount,
    lowStockCount,
    hasNextPage,
    currentPage,
  } = await getProductsManagementPageData({
    dbClient: c.get("dbClient"),
    page,
  })

  return c.render(
    <Layout title={"商品管理"} description={"商品情報の登録や編集を行います。"}>
      <ProductStockStatusCards
        totalProducts={totalProducts}
        inStockCount={inStockCount}
        outOfStockCount={outOfStockCount}
        lowStockCount={lowStockCount}
      />
      <ProductRegistrationForm />
      <ItemCollectionViewer
        title="商品一覧"
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
            { type: "image", src: product.image, alt: product.name },
            { type: "text", value: product.name },
            {
              type: "custom",
              content: (
                <div className="flex flex-wrap gap-1">
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
                <span className="font-mono">
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
