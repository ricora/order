import { useEffect } from "hono/jsx"
import type { ChartOptions } from "../../../components/ui/$chart"
import Chart from "../../../components/ui/$chart"
import type { StaffDashboardData } from "../../../usecases/getStaffDashboardData"

const STATUS_COLORS: Record<
  StaffDashboardData["statusDistribution"][number]["status"],
  string
> = {
  pending: "#f87171",
  processing: "#facc15",
  completed: "#34d399",
  cancelled: "#94a3b8",
}

type StatusDistributionCardProps = {
  data: StaffDashboardData["statusDistribution"]
}

const StatusDistributionCard = ({ data }: StatusDistributionCardProps) => {
  const xValues = data.map((_, index) => index)
  const counts = data.map((entry) => entry.count)

  const chartOptions: ChartOptions = {
    width: "100%",
    height: "100%",
    scales: {
      x: { time: false },
    },
    series: [
      {},
      {
        label: "注文数",
        fill: "rgba(59, 130, 246, 0.3)",
        stroke: "#3b82f6",
        points: { show: true },
      },
    ],
    axes: [
      {
        values: (_, ticks) =>
          ticks.map((tick) => {
            const index = Math.round(tick)
            if (index < 0 || index >= data.length) return ""
            return data[index]?.label ?? ""
          }),
        grid: { show: false },
      },
      {
        grid: { stroke: "rgba(148, 163, 184, 0.4)" },
      },
    ],
  }

  useEffect(() => {
    console.log("StatusDistributionCard mounted")
  }, [])

  console.log("Rendering StatusDistributionCard")

  return (
    <section className="flex flex-col rounded-lg border bg-bg p-6">
      <div className="mb-4">
        <h2 className="font-bold text-lg">ステータス別件数</h2>
        <p className="text-muted-fg text-sm">
          各ステータスの件数と比率を把握できます
        </p>
      </div>
      <div className="h-64">
        <Chart
          options={chartOptions}
          data={[xValues, counts]}
          class="h-full w-full"
        />
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-4 text-sm">
        {data.map((entry) => (
          <li
            key={entry.status}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[entry.status] }}
              />
              <span className="text-secondary-fg">{entry.label}</span>
            </div>
            <span className="font-semibold">{entry.count}件</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default StatusDistributionCard
