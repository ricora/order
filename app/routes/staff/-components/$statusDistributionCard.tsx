import type { ChartConfig } from "../../../components/ui/$chart"
import Chart from "../../../components/ui/$chart"
import type { StaffDashboardData } from "../../../usecases/getStaffDashboardData"

type StatusDistributionCardProps = {
  data: StaffDashboardData["statusDistribution"]
}

const StatusDistributionCard = ({ data }: StatusDistributionCardProps) => {
  const chartConfig: ChartConfig = {
    type: "pie",
    data: {
      labels: data.map((entry) => entry.label),
      datasets: [
        {
          label: "注文数",
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
      <div class="mb-4 space-y-1">
        <h2 class="font-bold text-lg">ステータス別注文数</h2>
        <p class="text-muted-fg text-sm">
          各ステータスの注文数と比率を把握できます
        </p>
      </div>
      <div class="h-64">
        <Chart
          ariaLabel="ステータス別注文数の内訳"
          class="size-full"
          config={chartConfig}
        />
      </div>
    </section>
  )
}

export default StatusDistributionCard
