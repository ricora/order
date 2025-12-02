import { createRoute } from "honox/factory"
import ToastProvider from "../../../-components/ui/$toastProvider"
import Layout from "../../-components/layout"
import OrderProgressManager from "./-components/$orderProgressManager"

export default createRoute(async (c) => {
  return c.render(
    <Layout title={"注文進捗管理"} description={"注文の進捗を管理します。"}>
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-lg border bg-bg p-3 sm:p-6">
        <ToastProvider />
        <OrderProgressManager />
      </div>
    </Layout>,
  )
})
