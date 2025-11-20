import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"
import type {
  FindAllDailyOrderAggregations,
  FindOrderStatusCounts,
} from "../domain/order/repositories/orderQueryRepository"
import * as orderQueryRepository from "../domain/order/repositories/orderQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import {
  addDays,
  buildDateRange,
  endOfDay,
  formatDateKey,
  startOfDay,
} from "../utils/date"
import { getStaffDashboardPageData } from "./getStaffDashboardPageData"

const dbClient = {} as DbClient
const DAILY_RANGE_DAYS = 7
const FIXED_NOW = new Date("2025-02-08T10:15:30.000Z")

const getDateRangeStart = () =>
  startOfDay(addDays(FIXED_NOW, -(DAILY_RANGE_DAYS - 1)))
const getDateRangeEnd = () => endOfDay(FIXED_NOW)
const buildExpectedDailyKeys = () =>
  buildDateRange(getDateRangeStart(), DAILY_RANGE_DAYS).map(formatDateKey)
const createAggregationDate = (base: Date, offset: number, hour = 10) => {
  const date = addDays(base, offset)
  date.setHours(hour, 0, 0, 0)
  return date
}

type OrderStatusCount = Awaited<ReturnType<FindOrderStatusCounts>>[number]
type OrderDailyAggregation =
  Awaited<ReturnType<FindAllDailyOrderAggregations>>[number]

describe("getStaffDashboardPageData", () => {
  afterEach(() => {
    mock.restore()
  })

  it("直近7日間の集計と注文状況を取得できる", async () => {
    const statusCounts: OrderStatusCount[] = [
      { status: "pending", count: 5 },
      { status: "completed", count: 8 },
    ]
    spyOn(orderQueryRepository, "findOrderStatusCounts").mockResolvedValue(
      statusCounts,
    )

    const summaryEntries: Array<
      [number, { orderCount: number; revenue: number }]
    > = [
      [0, { orderCount: 3, revenue: 4500 }],
      [3, { orderCount: 1, revenue: 800 }],
      [6, { orderCount: 4, revenue: 6000 }],
    ]
    const dateRangeStart = getDateRangeStart()
    const summaryByOffset = new Map(summaryEntries)
    const dailyAggregations: OrderDailyAggregation[] = summaryEntries.map(
      ([offset, summary]) => ({
        date: createAggregationDate(dateRangeStart, offset, 9 + offset),
        ...summary,
      }),
    )
    const findAllDailyOrderAggregationsSpy = spyOn(
      orderQueryRepository,
      "findAllDailyOrderAggregations",
    ).mockResolvedValue(dailyAggregations)

    const result = await getStaffDashboardPageData({
      dbClient,
      getCurrentTime: () => FIXED_NOW,
    })

    expect(orderQueryRepository.findOrderStatusCounts).toHaveBeenCalledWith({
      dbClient,
    })
    expect(findAllDailyOrderAggregationsSpy).toHaveBeenCalledWith({
      dbClient,
      from: dateRangeStart,
      to: getDateRangeEnd(),
      pagination: { offset: 0, limit: DAILY_RANGE_DAYS },
    })

    const expectedDailyOrders = buildExpectedDailyKeys().map(
      (dateKey, index) => {
        const summary = summaryByOffset.get(index)
        return {
          date: dateKey,
          orderCount: summary?.orderCount ?? 0,
          revenue: summary?.revenue ?? 0,
        }
      },
    )
    expect(result.dailyOrders).toEqual(expectedDailyOrders)

    expect(result.statusDistribution).toEqual([
      { status: "pending", label: "受付待ち", count: 5 },
      { status: "processing", label: "処理中", count: 0 },
      { status: "completed", label: "完了", count: 8 },
      { status: "cancelled", label: "取消済", count: 0 },
    ])

    const totalOrders = Array.from(summaryByOffset.values()).reduce(
      (total, day) => total + day.orderCount,
      0,
    )
    const totalRevenue = Array.from(summaryByOffset.values()).reduce(
      (total, day) => total + day.revenue,
      0,
    )
    const todaySummary =
      summaryByOffset.get(DAILY_RANGE_DAYS - 1) ??
      ({ orderCount: 0, revenue: 0 } as const)

    expect(result.summary).toEqual({
      todayOrderCount: todaySummary.orderCount,
      todayRevenue: todaySummary.revenue,
      pendingOrderCount: 5,
      averageOrderValue7d: Math.round(totalRevenue / totalOrders),
      totalRevenue7d: totalRevenue,
    })
  })

  it("データがない場合はゼロ埋めした結果を返す", async () => {
    spyOn(orderQueryRepository, "findOrderStatusCounts").mockResolvedValue([])
    spyOn(
      orderQueryRepository,
      "findAllDailyOrderAggregations",
    ).mockResolvedValue([])

    const result = await getStaffDashboardPageData({
      dbClient,
      getCurrentTime: () => FIXED_NOW,
    })

    expect(result.statusDistribution).toEqual([
      { status: "pending", label: "受付待ち", count: 0 },
      { status: "processing", label: "処理中", count: 0 },
      { status: "completed", label: "完了", count: 0 },
      { status: "cancelled", label: "取消済", count: 0 },
    ])

    expect(result.dailyOrders).toEqual(
      buildExpectedDailyKeys().map((dateKey) => ({
        date: dateKey,
        orderCount: 0,
        revenue: 0,
      })),
    )

    expect(result.summary).toEqual({
      todayOrderCount: 0,
      todayRevenue: 0,
      pendingOrderCount: 0,
      averageOrderValue7d: 0,
      totalRevenue7d: 0,
    })
  })
})
