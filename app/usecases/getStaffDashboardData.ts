import type Order from "../domain/order/entities/order"
import {
  findDailyOrderAggregations,
  findOrderStatusCounts,
} from "../domain/order/repositories/orderQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import {
  addDays,
  buildDateRange,
  endOfDay,
  formatDateKey,
  startOfDay,
} from "../utils/date"

const ORDER_STATUSES: { status: Order["status"]; label: string }[] = [
  { status: "pending", label: "受付待ち" },
  { status: "processing", label: "処理中" },
  { status: "completed", label: "完了" },
  { status: "cancelled", label: "取消済" },
]

const DAILY_RANGE_DAYS = 7
export type StaffDashboardData = {
  summary: {
    todayOrderCount: number
    todayRevenue: number
    pendingOrderCount: number
    averageOrderValue7d: number
    totalRevenue7d: number
  }
  statusDistribution: {
    status: Order["status"]
    label: string
    count: number
  }[]
  dailyOrders: {
    date: string
    orderCount: number
    revenue: number
  }[]
}

type GetStaffDashboardDataParams = {
  dbClient: DbClient
}

export const getStaffDashboardData = async ({
  dbClient,
}: GetStaffDashboardDataParams): Promise<StaffDashboardData> => {
  const now = new Date()
  const dateRangeStart = startOfDay(addDays(now, -(DAILY_RANGE_DAYS - 1)))
  const dateRangeEnd = endOfDay(now)
  const todayKey = formatDateKey(startOfDay(now))

  const [statusCounts, dailyAggregations] = await Promise.all([
    findOrderStatusCounts({ dbClient }),
    findDailyOrderAggregations({
      dbClient,
      from: dateRangeStart,
      to: dateRangeEnd,
    }),
  ])

  const statusDistribution = ORDER_STATUSES.map((entry) => ({
    ...entry,
    count:
      statusCounts.find((item) => item.status === entry.status)?.count ?? 0,
  }))

  const dailyAggregationMap = new Map(
    dailyAggregations.map((aggregation) => [
      formatDateKey(startOfDay(aggregation.date)),
      {
        orderCount: aggregation.orderCount,
        revenue: aggregation.revenue,
      },
    ]),
  )

  const dailyOrders = buildDateRange(dateRangeStart, DAILY_RANGE_DAYS).map(
    (date) => {
      const key = formatDateKey(date)
      const summary = dailyAggregationMap.get(key)

      return {
        date: key,
        orderCount: summary?.orderCount ?? 0,
        revenue: summary?.revenue ?? 0,
      }
    },
  )

  const totalOrders7d = dailyOrders.reduce(
    (total, day) => total + day.orderCount,
    0,
  )
  const totalRevenue7d = dailyOrders.reduce(
    (total, day) => total + day.revenue,
    0,
  )
  const todaySummary = dailyOrders.find((day) => day.date === todayKey)

  return {
    summary: {
      todayOrderCount: todaySummary?.orderCount ?? 0,
      todayRevenue: todaySummary?.revenue ?? 0,
      pendingOrderCount:
        statusDistribution.find((entry) => entry.status === "pending")?.count ??
        0,
      averageOrderValue7d:
        totalOrders7d > 0 ? Math.round(totalRevenue7d / totalOrders7d) : 0,
      totalRevenue7d,
    },
    statusDistribution,
    dailyOrders,
  }
}
