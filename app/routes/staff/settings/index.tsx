import { createRoute } from "honox/factory"
import Layout from "../-components/layout"
import ColorSchemeSelector from "./-components/$colorSchemeSelector"

export default createRoute(async (c) => {
  return c.render(
    <Layout title="設定" description="アプリケーションの設定を管理します。">
      <ColorSchemeSelector />
    </Layout>,
  )
})
