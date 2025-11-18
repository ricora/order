import { createRoute } from "honox/factory"
export default createRoute(async (c) => {
  return c.redirect(`/staff/products/${c.req.param("id")}/edit`)
})
