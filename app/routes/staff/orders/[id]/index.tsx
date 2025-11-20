import { createRoute } from "honox/factory"
export default createRoute(async (c) => {
  return c.redirect(`/staff/orders/${c.req.param("id")}/edit`)
})
