import type { ChartConfig } from "../../../components/ui/$chart"
import Chart from "../../../components/ui/$chart"
import type { StaffDashboardData } from "../../../usecases/getStaffDashboardData"
import { formatDateJP } from "../../../utils/date"
import { formatCurrencyJPY } from "../../../utils/money"

type DailyOrdersTrendCardProps = {
  data: StaffDashboardData["dailyOrders"]
}

const DailyOrdersTrendCard = ({ data }: DailyOrdersTrendCardProps) => {
  const labels = data.map((entry) => formatDateJP(entry.date))
  const orderCounts = data.map((entry) => entry.orderCount)
  const revenues = data.map((entry) => entry.revenue)

  const chartConfig: ChartConfig = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "注文数",
          data: orderCounts,
          yAxisID: "orders",
          tension: 0.35,
          fill: false,
        },
        {
          label: "売上",
          data: revenues,
          yAxisID: "revenue",
          tension: 0.35,
          fill: false,
        },
      ],
    },
    options: {
      interaction: { mode: "index", intersect: false },
      scales: {
        x: { grid: { display: false } },
        orders: {
          type: "linear",
          position: "left",
          beginAtZero: true,
          title: { display: true, text: "件数" },
          ticks: {
            callback: (value) => {
              const numericValue =
                typeof value === "number" ? value : Number(value)
              if (Number.isNaN(numericValue)) {
                return String(value)
              }
              return `${numericValue}件`
            },
          },
        },
        revenue: {
          type: "linear",
          position: "right",
          beginAtZero: true,
          grid: { display: false },
          title: { display: true, text: "売上" },
          ticks: {
            callback: (value) => {
              const numericValue =
                typeof value === "number" ? value : Number(value)
              if (Number.isNaN(numericValue)) {
                return String(value)
              }
              return formatCurrencyJPY(numericValue)
            },
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const parsedValue =
                typeof context.parsed === "number"
                  ? context.parsed
                  : ((context.parsed as { y?: number })?.y ?? 0)
              if (context.dataset.yAxisID === "revenue") {
                return `${context.dataset.label ?? ""}: ${formatCurrencyJPY(parsedValue)}`
              }
              return `${context.dataset.label ?? ""}: ${parsedValue}件`
            },
          },
        },
      },
    },
  }

  const lastDay = data[data.length - 1]

  return (
    <section class="flex flex-col rounded-lg border bg-bg p-6">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 class="font-bold text-lg">7日間の推移</h2>
          <p class="text-muted-fg text-sm">日別の注文数と売上の推移です</p>
        </div>
        {lastDay ? (
          <div class="text-right text-sm">
            <p class="text-muted-fg">最新日 ({formatDateJP(lastDay.date)})</p>
            <p class="font-semibold text-secondary-fg">
              {lastDay.orderCount}件 / {formatCurrencyJPY(lastDay.revenue)}
            </p>
          </div>
        ) : null}
      </div>
      <div class="rounded-lg border border-border/50 bg-muted p-4">
        <div class="mb-2 text-sm font-semibold text-secondary-fg">
          注文数 / 売上の7日間推移
        </div>
        <div class="h-72">
          <Chart
            ariaLabel="日別の注文数と売上の推移"
            class="size-full"
            config={chartConfig}
          />
        </div>
      </div>
    </section>
  )
}

export default DailyOrdersTrendCard
