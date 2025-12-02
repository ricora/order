import { jsxRenderer } from "hono/jsx-renderer"
import staffSidebarInitScript from "./-helpers/sidebar-entry?js"

export default jsxRenderer(({ children, Layout }) => {
  return (
    <Layout>
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: must inline pre-render staff sidebar script to prevent FOUC (Flash of Unstyled Content)
        dangerouslySetInnerHTML={{ __html: staffSidebarInitScript }}
      />
      {children}
    </Layout>
  )
})
