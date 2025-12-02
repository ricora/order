import type { FC } from "hono/jsx"
import { createRoute } from "honox/factory"
import ChartColumnIcon from "../-components/icons/lucide/chartColumnIcon"
import ChefHatIcon from "../-components/icons/lucide/chefHatIcon"
import ClipboardListIcon from "../-components/icons/lucide/clipboardListIcon"
import PackageIcon from "../-components/icons/lucide/packageIcon"
import SettingsIcon from "../-components/icons/lucide/settingsIcon"
import ShoppingCartIcon from "../-components/icons/lucide/shoppingCartIcon"
import Layout from "./-components/layout"

type DashboardCard = {
  title: string
  description: string
  href: string
  icon: FC
}

const dashboardCards: DashboardCard[] = [
  {
    title: "注文一覧",
    description: "注文の確認と管理を行います",
    href: "/staff/orders",
    icon: ClipboardListIcon,
  },
  {
    title: "注文登録",
    description: "新しい注文を登録します",
    href: "/staff/orders/new",
    icon: ShoppingCartIcon,
  },
  {
    title: "注文進捗管理",
    description: "注文の調理進捗を管理します",
    href: "/staff/orders/progress",
    icon: ChefHatIcon,
  },
  {
    title: "商品管理",
    description: "商品情報の登録や編集を行います",
    href: "/staff/products",
    icon: PackageIcon,
  },
  {
    title: "売上分析",
    description: "売上データの分析を行います",
    href: "/staff/analytics",
    icon: ChartColumnIcon,
  },
  {
    title: "設定",
    description: "システム設定を変更します",
    href: "/staff/settings",
    icon: SettingsIcon,
  },
]

const DashboardCard: FC<DashboardCard> = ({
  title,
  description,
  href,
  icon: Icon,
}) => {
  return (
    <a
      href={href}
      className="group block rounded-lg border bg-bg p-6 transition hover:bg-muted"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-muted p-3 text-secondary-fg transition group-hover:bg-accent">
          <div className="h-6 w-6">
            <Icon />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-secondary-fg">{title}</h3>
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
            <DashboardCard {...card} />
          ))}
        </div>
      </div>
    </Layout>,
  )
})
