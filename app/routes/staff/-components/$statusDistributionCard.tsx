import type { ChartConfig } from "../../../components/ui/$chart"
import Chart from "../../../components/ui/$chart"
import type { StaffDashboardData } from "../../../usecases/getStaffDashboardData"

const STATUS_COLORS: Record<
  StaffDashboardData["statusDistribution"][number]["status"],
  string
> = {
  pending: "var(--color-chart-1)",
  processing: "var(--color-chart-2)",
  completed: "var(--color-chart-3)",
  cancelled: "var(--color-chart-4)",
}

type StatusDistributionCardProps = {
  data: StaffDashboardData["statusDistribution"]
}

const StatusDistributionCard = ({ data }: StatusDistributionCardProps) => {
  const chartConfig: ChartConfig = {
    type: "line",
    data: {
      labels: data.map((entry) => entry.label),
      datasets: [
        {
          label: "注文数",
          data: data.map((entry) => entry.count),
          fill: true,
        },
      ],
    },
    options: {
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true },
      },
      plugins: {
        legend: { display: false },
      },
    },
  }

  return (
    <section class="flex flex-col rounded-lg border bg-bg p-6">
      <div class="mb-4">
        <h2 class="font-bold text-lg">ステータス別件数</h2>
        <p class="text-muted-fg text-sm">
          各ステータスの件数と比率を把握できます
        </p>
      </div>
      <div class="h-64">
        <Chart
          ariaLabel="ステータス別の件数推移"
          class="size-full"
          config={chartConfig}
        />
      </div>
      <ul class="mt-4 grid grid-cols-2 gap-4 text-sm">
        {data.map((entry) => (
          <li
            key={entry.status}
            class="flex items-center justify-between gap-3"
          >
            <div class="flex items-center gap-2">
              <span
                class="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[entry.status] }}
              />
              <span class="text-secondary-fg">{entry.label}</span>
            </div>
            <span class="font-semibold">{entry.count}件</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default StatusDistributionCard
