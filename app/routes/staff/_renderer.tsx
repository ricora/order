import { reactRenderer } from "@hono/react-renderer"
import { StaffLayout } from "./-components/$layout"

export default reactRenderer(({ Layout, children, c }) => (
  <Layout>
    <StaffLayout pathname={c.req.path}>{children}</StaffLayout>
  </Layout>
))
