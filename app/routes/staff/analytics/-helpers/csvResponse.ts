import { formatDateTimeIsoJP } from "../../../../utils/date"

const buildCsvFilename = (prefix: string, exportedAt: Date) => {
  const isoTimestamp = formatDateTimeIsoJP(exportedAt)
  const datePart = isoTimestamp.split("+", 1)[0] ?? isoTimestamp
  const timestamp = datePart.replace(/[T:]/g, "-")
  return `${prefix}-${timestamp}.csv`
}

export const createCsvDownloadResponse = (
  csv: string,
  prefix: string,
  exportedAt: Date = new Date(),
) => {
  const bomPrefixed = `\ufeff${csv}`
  return new Response(bomPrefixed, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildCsvFilename(
        prefix,
        exportedAt,
      )}"`,
      "Cache-Control": "no-store",
    },
  })
}
