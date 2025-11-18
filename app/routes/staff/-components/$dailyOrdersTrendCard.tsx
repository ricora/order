import type { ChartOptions } from "../../../components/ui/$chart"
import { useChart } from "../../../components/ui/$chart"
import type { StaffDashboardData } from "../../../usecases/getStaffDashboardData"
import { formatDateJP } from "../../../utils/date"
import { formatCurrencyJPY } from "../../../utils/money"

type DailyOrdersTrendCardProps = {
  data: StaffDashboardData["dailyOrders"]
}

const DailyOrdersTrendCard = ({ data }: DailyOrdersTrendCardProps) => {
  const xValues = data.map((entry) => new Date(entry.date).getTime())
  const orderCounts = data.map((entry) => entry.orderCount)
  const revenues = data.map((entry) => entry.revenue)

  const chartOptions: ChartOptions = {
    width: "100%",
    height: "100%",
    scales: {
      x: { time: true },
      orders: { auto: true },
      revenue: { auto: true },
    },
    series: [
      {},
      {
        label: "注文数",
        stroke: "#10b981",
        fill: "rgba(16, 185, 129, 0.2)",
        scale: "orders",
        points: { show: true },
      },
      {
        label: "売上",
        stroke: "#f97316",
        scale: "revenue",
        points: { show: true },
      },
    ],
    axes: [
      {
        grid: { show: false },
      },
      {
        label: "件数",
        scale: "orders",
        grid: { stroke: "rgba(148,163,184,0.4)" },
      },
      {
        label: "売上",
        scale: "revenue",
        side: 1,
        grid: { show: false },
      },
    ],
  }

  const lastDay = data[data.length - 1]
  const { ref } = useChart({
    options: chartOptions,
    data: [xValues, orderCounts, revenues],
  })

  return (
    <section className="flex flex-col rounded-lg border bg-bg p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 className="font-bold text-lg">7日間の推移</h2>
          <p className="text-muted-fg text-sm">日別の注文数と売上の推移です</p>
        </div>
        {lastDay ? (
          <div className="text-right text-sm">
            <p className="text-muted-fg">
              最新日 ({formatDateJP(lastDay.date)})
            </p>
            <p className="font-semibold text-secondary-fg">
              {lastDay.orderCount}件 / {formatCurrencyJPY(lastDay.revenue)}
            </p>
          </div>
        ) : null}
      </div>
      <div className="h-64">
        <div ref={ref} className="h-full w-full" />
      </div>
    </section>
  )
}

export default DailyOrdersTrendCard
