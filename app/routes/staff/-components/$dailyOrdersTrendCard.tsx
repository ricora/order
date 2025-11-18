import type { ChartConfig } from "../../../components/ui/$chart"
import Chart from "../../../components/ui/$chart"
import type { StaffDashboardData } from "../../../usecases/getStaffDashboardData"
import { formatDateJP } from "../../../utils/date"
import { formatCurrencyJPY } from "../../../utils/money"

type DailyOrdersTrendCardProps = {
  data: StaffDashboardData["dailyOrders"]
}

const DailyOrdersTrendCard = ({ data }: DailyOrdersTrendCardProps) => {
  const chartConfig: ChartConfig = {
    type: "line",
    data: {
      labels: data.map((entry) => formatDateJP(entry.date)),
      datasets: [
        {
          label: "注文数",
          data: data.map((entry) => entry.orderCount),
          yAxisID: "orders",
          fill: true,
        },
        {
          label: "売上",
          data: data.map((entry) => entry.revenue),
          yAxisID: "revenue",
        },
      ],
    },
    options: {
      scales: {
        x: { grid: { display: false } },
        orders: {
          position: "left",
          beginAtZero: true,
          title: { display: true, text: "件数" },
        },
        revenue: {
          position: "right",
          beginAtZero: true,
          grid: { display: false },
          title: { display: true, text: "売上" },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const parsedValue = (() => {
                const raw = context.parsed as unknown
                if (typeof raw === "number") {
                  return raw
                }
                if (typeof raw === "object" && raw !== null) {
                  return (raw as { y?: number }).y ?? 0
                }
                return 0
              })()
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
            <p class="text-muted-fg">
              最新日 ({formatDateJP(lastDay.date)})
            </p>
            <p class="font-semibold text-secondary-fg">
              {lastDay.orderCount}件 / {formatCurrencyJPY(lastDay.revenue)}
            </p>
          </div>
        ) : null}
      </div>
      <div class="h-64">
        <Chart
          ariaLabel="日別の注文数と売上の推移"
          class="size-full"
          config={chartConfig}
        />
      </div>
    </section>
  )
}

export default DailyOrdersTrendCard
