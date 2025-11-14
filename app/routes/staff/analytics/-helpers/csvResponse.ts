const buildCsvFilename = (prefix: string, exportedAt: Date) => {
  const timestamp = exportedAt
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "-")
    .replace("Z", "")
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
