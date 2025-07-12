import { createRoute } from "honox/factory"
import { ProductManagement } from "./-components/$page"

export default createRoute((c) => {
  return c.render(<ProductManagement />)
})
