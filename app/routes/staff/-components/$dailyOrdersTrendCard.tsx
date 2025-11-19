import type { ChartConfig } from "../../../components/ui/$chart"
import Chart from "../../../components/ui/$chart"
import type { StaffDashboardData } from "../../../usecases/getStaffDashboardData"
import { formatDateJP } from "../../../utils/date"
import { formatCurrencyJPY } from "../../../utils/money"

type DailyOrdersTrendCardProps = {
  data: StaffDashboardData["dailyOrders"]
}

/**
 * チャートの値を数値に変換する
 * @param value - チャートライブラリから渡される値（数値または複雑な型の可能性がある）
 * @returns 数値に変換された値、変換できない場合はnull
 */
const parseChartValue = (value: unknown): number | null => {
  if (typeof value === "number") {
    return value
  }
  if (typeof value === "object" && value !== null && "y" in value) {
    const yValue = (value as { y?: unknown }).y
    if (typeof yValue === "number") {
      return yValue
    }
  }
  const numericValue = Number(value)
  return Number.isNaN(numericValue) ? null : numericValue
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
              const numericValue = parseChartValue(value)
              return numericValue !== null ? `${numericValue}件` : String(value)
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
              const numericValue = parseChartValue(value)
              return numericValue !== null
                ? formatCurrencyJPY(numericValue)
                : String(value)
            },
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const parsedValue = parseChartValue(context.parsed) ?? 0
              const label = context.dataset.label ?? ""
              if (context.dataset.yAxisID === "revenue") {
                return `${label}: ${formatCurrencyJPY(parsedValue)}`
              }
              return `${label}: ${parsedValue}件`
            },
          },
        },
      },
    },
  }

  return (
    <section class="flex flex-col rounded-lg border bg-bg p-6">
      <div class="mb-4 space-y-1">
        <h2 class="font-bold text-lg">7日間の推移</h2>
        <p class="text-muted-fg text-sm">日別の注文数と売上の推移です</p>
      </div>
      <Chart
        ariaLabel="日別の注文数と売上の推移"
        class="h-80 rounded-lg border bg-muted/30 p-4"
        config={chartConfig}
      />
    </section>
  )
}

export default DailyOrdersTrendCard
