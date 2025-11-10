import { createRoute } from "honox/factory"
import { tv } from "tailwind-variants"
import ItemCollectionViewer from "../../../components/ui/itemCollectionViewer"
import { getOrdersManagementPageData } from "../../../usecases/getOrdersManagementPageData"
import { formatDateTimeJP } from "../../../utils/date"
import { formatCurrencyJPY } from "../../../utils/money"
import Layout from "../-components/layout"
import OrderStatusBadge from "./-components/orderStatusBadge"

const orderItemRow = tv({
  base: "flex items-center justify-between rounded border border-border/50 bg-muted px-2 py-1",
})

export default createRoute(async (c) => {
  const url = new URL(c.req.url)
  const viewMode = c.req.query("view") === "card" ? "card" : "table"
  const urlSearch = url.search

  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10))

  const { orders } = await getOrdersManagementPageData({
    dbClient: c.get("dbClient"),
    page,
  })

  return c.render(
    <Layout title={"注文一覧"} description={"注文の一覧を表示します。"}>
      <ItemCollectionViewer
        title="注文一覧"
        columns={[
          { header: "注文ID", align: "left" },
          { header: "注文日時", align: "left" },
          { header: "顧客名", align: "left" },
          { header: "注文内容", align: "left" },
          { header: "合計金額", align: "right" },
          { header: "ステータス", align: "center" },
        ]}
        items={orders.map((order) => ({
          id: order.id,
          fields: [
            { type: "text", value: `#${order.id}` },
            {
              type: "text",
              value: formatDateTimeJP(order.createdAt),
            },
            { type: "text", value: order.customerName ?? "-" },
            {
              type: "custom",
              content: (
                <div className="space-y-1">
                  {order.orderItems.map((item) => (
                    <div className={orderItemRow()}>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-sm">
                          {item.productName}
                        </div>
                      </div>
                      <div className="ml-4 text-sm">×{item.quantity}</div>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              type: "custom",
              content: (
                <span className="font-mono">
                  {formatCurrencyJPY(order.totalAmount)}
                </span>
              ),
            },
            {
              type: "custom",
              content: <OrderStatusBadge status={order.status} />,
            },
          ],
          editUrl: `/staff/orders/${order.id}/edit`,
          deleteUrl: `/staff/orders/${order.id}/delete`,
        }))}
        viewMode={viewMode}
        urlSearch={urlSearch}
        emptyMessage="注文が登録されていません"
      />
    </Layout>,
  )
})
