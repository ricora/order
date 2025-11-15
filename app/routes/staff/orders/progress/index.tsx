import { createRoute } from "honox/factory"
import Layout from "../../-components/layout"
import OrderProgressManager from "./-components/$orderProgressManager"

export default createRoute(async (c) => {
  return c.render(
    <Layout title={"注文進捗管理"} description={"注文の進捗を管理します。"}>
      <div className="h-[calc(100vh-8rem)] overflow-hidden rounded-lg border bg-bg p-6">
        <h2 className="mb-4 font-bold text-lg">注文進捗管理</h2>
        <OrderProgressManager />
      </div>
    </Layout>,
  )
})
