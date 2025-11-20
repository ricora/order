import type Order from "../domain/order/entities/order"
import { ORDER_STATUSES as DOMAIN_ORDER_STATUSES } from "../domain/order/constants"
import {
  findAllDailyOrderAggregations,
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

const ORDER_STATUS_LABELS: Record<Order["status"], string> = {
  pending: "受付待ち",
  processing: "処理中",
  completed: "完了",
  cancelled: "取消済",
} as const

const ORDER_STATUSES: { status: Order["status"]; label: string }[] =
  DOMAIN_ORDER_STATUSES.map((status) => ({
    status,
    label: ORDER_STATUS_LABELS[status],
  }))

const DAILY_RANGE_DAYS = 7
const DAY_IN_MS = 1000 * 60 * 60 * 24
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
  getCurrentTime?: () => Date
}

export const getStaffDashboardData = async ({
  dbClient,
  getCurrentTime = () => new Date(),
}: GetStaffDashboardDataParams): Promise<StaffDashboardData> => {
  const now = getCurrentTime()
  const dateRangeStart = startOfDay(addDays(now, -(DAILY_RANGE_DAYS - 1)))
  const dateRangeEnd = endOfDay(now)
  const pagination = {
    offset: 0,
    limit: Math.round(
      (dateRangeEnd.getTime() - dateRangeStart.getTime()) / DAY_IN_MS,
    ) + 1,
  }
  const todayKey = formatDateKey(startOfDay(now))

  const [statusCounts, dailyAggregations] = await Promise.all([
    findOrderStatusCounts({ dbClient }),
    findAllDailyOrderAggregations({
      dbClient,
      from: dateRangeStart,
      to: dateRangeEnd,
      pagination,
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
