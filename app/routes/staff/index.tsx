import type { FC } from "hono/jsx"
import { createRoute } from "honox/factory"
import ChartColumnIcon from "../../components/icons/lucide/chartColumnIcon"
import ChefHatIcon from "../../components/icons/lucide/chefHatIcon"
import ClipboardListIcon from "../../components/icons/lucide/clipboardListIcon"
import PackageIcon from "../../components/icons/lucide/packageIcon"
import SettingsIcon from "../../components/icons/lucide/settingsIcon"
import ShoppingCartIcon from "../../components/icons/lucide/shoppingCartIcon"
import Layout from "./-components/layout"

type DashboardCard = {
  title: string
  description: string
  href: string
  icon: FC
  color: string
}

const dashboardCards: DashboardCard[] = [
  {
    title: "注文一覧",
    description: "注文の確認と管理を行います",
    href: "/staff/orders",
    icon: ClipboardListIcon,
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    title: "注文登録",
    description: "新しい注文を登録します",
    href: "/staff/orders/new",
    icon: ShoppingCartIcon,
    color: "bg-green-500/10 text-green-600",
  },
  {
    title: "注文進捗管理",
    description: "注文の調理進捗を管理します",
    href: "/staff/orders/progress",
    icon: ChefHatIcon,
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    title: "商品管理",
    description: "商品情報の登録や編集を行います",
    href: "/staff/products",
    icon: PackageIcon,
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    title: "売上分析",
    description: "売上データの分析を行います",
    href: "/staff/analytics",
    icon: ChartColumnIcon,
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    title: "設定",
    description: "システム設定を変更します",
    href: "/staff/settings",
    icon: SettingsIcon,
    color: "bg-gray-500/10 text-gray-600",
  },
]

const DashboardCard: FC<DashboardCard> = ({
  title,
  description,
  href,
  icon: Icon,
  color,
}) => {
  return (
    <a
      href={href}
      className="group block rounded-lg border bg-bg p-6 transition hover:border-primary hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className={`rounded-lg p-3 ${color}`}>
          <div className="h-6 w-6">
            <Icon />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-fg text-lg group-hover:text-primary">
            {title}
          </h3>
          <p className="mt-1 text-muted-fg text-sm">{description}</p>
        </div>
      </div>
    </a>
  )
}

export default createRoute((c) => {
  return c.render(
    <Layout title="ダッシュボード" description="Order管理システムへようこそ">
      <div className="rounded-lg border bg-bg p-6">
        <h2 className="mb-4 font-bold text-lg">クイックアクセス</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboardCards.map((card) => (
            <DashboardCard key={card.href} {...card} />
          ))}
        </div>
      </div>
    </Layout>,
  )
})
