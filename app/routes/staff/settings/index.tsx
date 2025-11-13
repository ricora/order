import { createRoute } from "honox/factory"
import Layout from "../-components/layout"

export default createRoute(async (c) => {
  return c.render(
    <Layout title="設定" description="アプリケーションの設定を管理します。">
      <div className="rounded-lg border bg-bg p-6">
        <p className="text-muted-fg">設定項目はここに追加されます。</p>
      </div>
    </Layout>,
  )
})
