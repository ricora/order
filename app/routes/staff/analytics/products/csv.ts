import { createRoute } from "honox/factory"
import { exportProductCatalogCsv } from "../../../../usecases/queries/exportProductCatalogCsv"
import { createCsvDownloadResponse } from "../-helpers/csvResponse"

export default createRoute(async (c) => {
  const res = await exportProductCatalogCsv({
    dbClient: c.get("dbClient"),
    imageBaseUrl: new URL(c.req.url).origin,
  })
  if (!res.ok) throw new Error(res.message)
  return createCsvDownloadResponse(
    res.value.csv,
    "product-catalog",
    res.value.exportedAt,
  )
})
