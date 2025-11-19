import type { StaffDashboardData } from "../../../usecases/getStaffDashboardData"
import { formatCurrencyJPY } from "../../../utils/money"

export type DashboardStatCard = {
  title: string
  value: string
  description: string
}

/**
 * ダッシュボードの統計カードデータを生成する
 *
 * @param summary - スタッフダッシュボードのサマリーデータ
 * @returns 統計カードの配列
 */
export const buildDashboardStatCards = (
  summary: StaffDashboardData["summary"],
): DashboardStatCard[] => {
  return [
    {
      title: "本日の注文数",
      value: `${summary.todayOrderCount}件`,
      description: "本日0時以降の累計",
    },
    {
      title: "本日の売上",
      value: formatCurrencyJPY(summary.todayRevenue),
      description: "税込み想定",
    },
    {
      title: "未処理の注文",
      value: `${summary.pendingOrderCount}件`,
      description: "pending状態の件数",
    },
    {
      title: "7日間の平均客単価",
      value: formatCurrencyJPY(summary.averageOrderValue7d),
      description: `7日間の売上合計 ${formatCurrencyJPY(summary.totalRevenue7d)}`,
    },
  ]
}
