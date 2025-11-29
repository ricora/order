import { createRoute } from "honox/factory"
import { removeOrder } from "../../../../../usecases/commands/removeOrder"
import { getOrderDeletePageData } from "../../../../../usecases/queries/getOrderDeletePageData"
import ChevronLeftIcon from "../../../../-components/icons/lucide/chevronLeftIcon"
import Trash2Icon from "../../../../-components/icons/lucide/trash2Icon"
import Button from "../../../../-components/ui/button"
import Callout from "../../../../-components/ui/callout"
import LinkButton from "../../../../-components/ui/linkButton"
import { setToastCookie } from "../../../../-helpers/ui/toast"
import Layout from "../../../-components/layout"
import OrderSummary from "../-components/orderSummary"

export const POST = createRoute(async (c) => {
  try {
    const id = Number(c.req.param("id"))
    if (!Number.isInteger(id) || id <= 0) {
      return c.notFound()
    }

    await removeOrder({
      dbClient: c.get("dbClient"),
      order: { id },
    })

    setToastCookie(c, "success", "注文を削除しました")
    return c.redirect("/staff/orders")
  } catch (e) {
    setToastCookie(c, "error", String(e))
    return c.redirect(c.req.url)
  }
})

export default createRoute(async (c) => {
  const idParam = c.req.param("id")
  const id = Number(idParam)
  if (!Number.isInteger(id) || id <= 0) {
    return c.notFound()
  }

  const { order } = await getOrderDeletePageData({
    order: { id },
    dbClient: c.get("dbClient"),
  })
  if (!order) return c.notFound()
  return c.render(
    <Layout title={"注文削除"} description={"注文情報の削除を行います。"}>
      <div class="rounded-lg border bg-bg p-6">
        <h2 class="mb-2 font-semibold text-lg">注文削除</h2>
        <div class="p-4">
          <p class="text-sm">
            注文#{order.id}
            を削除してもよろしいですか？この操作は取り消せません。
          </p>

          <div class="my-4">
            <OrderSummary order={order} />
          </div>

          <div class="my-2">
            <Callout variant="danger" title="警告">
              ほとんどの場合において、注文のステータスを「取消済」に変更すれば問題ありません。この操作は慎重に行ってください。
            </Callout>
          </div>

          <div class="mt-6 flex flex-col-reverse items-center justify-between gap-2 sm:flex-row">
            <div class="w-full sm:w-auto">
              <LinkButton href="/staff/orders" leftIcon={ChevronLeftIcon}>
                注文一覧に戻る
              </LinkButton>
            </div>
            <div class="w-full sm:w-auto">
              <form method="post">
                <div>
                  <Button type="submit" variant="danger" leftIcon={Trash2Icon}>
                    削除する
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>,
  )
})
