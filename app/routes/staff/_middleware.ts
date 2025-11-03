import { createRoute } from "honox/factory"
import { requireAuth, requireRole } from "../../middlewares/auth"

export default createRoute(
  requireAuth,
  requireRole(['admin', 'staff'])
)
