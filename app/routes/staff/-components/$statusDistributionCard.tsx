import type { ChartConfig } from "../../../components/ui/$chart"
import Chart from "../../../components/ui/$chart"
import type { StaffDashboardData } from "../../../usecases/getStaffDashboardData"

type StatusDistributionCardProps = {
  data: StaffDashboardData["statusDistribution"]
}

const STATUS_COLOR_TOKENS: Record<
  StaffDashboardData["statusDistribution"][number]["status"],
  string
> = {
  pending: "--color-chart-1",
  processing: "--color-chart-2",
  completed: "--color-chart-3",
  cancelled: "--color-chart-4",
}

const StatusDistributionCard = ({ data }: StatusDistributionCardProps) => {
  const chartConfig: ChartConfig = {
    type: "pie",
    data: {
      labels: data.map((entry) => entry.label),
      datasets: [
        {
          label: "件数",
          data: data.map((entry) => entry.count),
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          position: "right",
        },
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
          ariaLabel="ステータス別件数の内訳"
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
                style={{
                  backgroundColor: `var(${STATUS_COLOR_TOKENS[entry.status]})`,
                }}
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
