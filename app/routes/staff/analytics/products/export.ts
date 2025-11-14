import { createRoute } from "honox/factory"
import { exportProductCatalogCsv } from "../../../../usecases/exportProductCatalogCsv"
import {
  buildCsvFilename,
  createCsvDownloadResponse,
} from "../-helpers/csvResponse"

export default createRoute(async (c) => {
  const result = await exportProductCatalogCsv({
    dbClient: c.get("dbClient"),
  })
  const filename = buildCsvFilename("product-catalog", result.exportedAt)
  return createCsvDownloadResponse(result.csv, filename)
})
