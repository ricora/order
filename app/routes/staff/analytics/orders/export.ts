import { createRoute } from "honox/factory"
import { exportOrderHistoryCsv } from "../../../../usecases/exportOrderHistoryCsv"
import {
  buildCsvFilename,
  createCsvDownloadResponse,
} from "../-helpers/csvResponse"

export default createRoute(async (c) => {
  const result = await exportOrderHistoryCsv({
    dbClient: c.get("dbClient"),
  })
  const filename = buildCsvFilename("order-history", result.exportedAt)
  return createCsvDownloadResponse(result.csv, filename)
})
