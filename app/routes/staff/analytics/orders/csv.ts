import { createRoute } from "honox/factory"
import { exportOrderHistoryCsv } from "../../../../usecases/exportOrderHistoryCsv"
import { createCsvDownloadResponse } from "../-helpers/csvResponse"

export default createRoute(async (c) => {
  const result = await exportOrderHistoryCsv({
    dbClient: c.get("dbClient"),
  })
  return createCsvDownloadResponse(
    result.csv,
    "order-history",
    result.exportedAt,
  )
})
