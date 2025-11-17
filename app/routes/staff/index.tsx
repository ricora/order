import type { FC } from "hono/jsx"
import { createRoute } from "honox/factory"
import ChartColumnIcon from "../../components/icons/lucide/chartColumnIcon"
import ChefHatIcon from "../../components/icons/lucide/chefHatIcon"
import ClipboardListIcon from "../../components/icons/lucide/clipboardListIcon"
import PackageIcon from "../../components/icons/lucide/packageIcon"
import SettingsIcon from "../../components/icons/lucide/settingsIcon"
import ShoppingCartIcon from "../../components/icons/lucide/shoppingCartIcon"
import { getStaffDashboardData } from "../../usecases/getStaffDashboardData"
import { formatCurrencyJPY } from "../../utils/money"
import DailyOrdersTrendCard from "./-components/$dailyOrdersTrendCard"
import StatusDistributionCard from "./-components/$statusDistributionCard"
import DashboardStatCard from "./-components/dashboardStatCard"
import Layout from "./-components/layout"

type QuickAccessCard = {
  title: string
  description: string
  href: string
  icon: FC
}

const quickAccessCards: QuickAccessCard[] = [
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

const QuickAccessCard: FC<QuickAccessCard> = ({
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

export default createRoute(async (c) => {
  const dashboardData = await getStaffDashboardData({
    dbClient: c.get("dbClient"),
  })

  const statCards = [
    {
      title: "本日の注文数",
      value: `${dashboardData.summary.todayOrderCount}件`,
      description: "本日0時以降の累計",
    },
    {
      title: "本日の売上",
      value: formatCurrencyJPY(dashboardData.summary.todayRevenue),
      description: "税込み想定",
    },
    {
      title: "未処理の注文",
      value: `${dashboardData.summary.pendingOrderCount}件`,
      description: "pending状態の件数",
    },
    {
      title: "7日間の平均客単価",
      value: formatCurrencyJPY(dashboardData.summary.averageOrderValue7d),
      description: `7日間の売上合計 ${formatCurrencyJPY(
        dashboardData.summary.totalRevenue7d,
      )}`,
    },
  ]

  return c.render(
    <Layout title="ダッシュボード" description="Order管理システムへようこそ">
      <div className="space-y-6">
        <section className="rounded-lg border bg-bg p-6">
          <h2 className="mb-4 font-bold text-lg">サマリー</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <DashboardStatCard
                key={card.title}
                title={card.title}
                value={card.value}
                description={card.description}
              />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <StatusDistributionCard data={dashboardData.statusDistribution} />
          <DailyOrdersTrendCard data={dashboardData.dailyOrders} />
        </section>

        <section className="rounded-lg border bg-bg p-6">
          <h2 className="mb-4 font-bold text-lg">クイックアクセス</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quickAccessCards.map((card) => (
              <QuickAccessCard key={card.href} {...card} />
            ))}
          </div>
        </section>
      </div>
    </Layout>,
  )
})
