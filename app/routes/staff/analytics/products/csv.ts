import { createRoute } from "honox/factory"
import { exportProductCatalogCsv } from "../../../../usecases/exportProductCatalogCsv"
import { createCsvDownloadResponse } from "../-helpers/csvResponse"

export default createRoute(async (c) => {
  const result = await exportProductCatalogCsv({
    dbClient: c.get("dbClient"),
  })
  return createCsvDownloadResponse(
    result.csv,
    "product-catalog",
    result.exportedAt,
  )
})
