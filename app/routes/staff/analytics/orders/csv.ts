import { createRoute } from "honox/factory"
import { exportOrderHistoryCsv } from "../../../../usecases/queries/exportOrderHistoryCsv"
import { createCsvDownloadResponse } from "../-helpers/csvResponse"

export default createRoute(async (c) => {
  const res = await exportOrderHistoryCsv({ dbClient: c.get("dbClient") })
  if (!res.ok) throw new Error(res.message)
  return createCsvDownloadResponse(
    res.value.csv,
    "order-history",
    res.value.exportedAt,
  )
})
