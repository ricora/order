export const buildCsvFilename = (prefix: string, exportedAt: Date) => {
  const timestamp = exportedAt
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "-")
    .replace("Z", "")
  return `${prefix}-${timestamp}.csv`
}

export const createCsvDownloadResponse = (csv: string, filename: string) => {
  const bomPrefixed = `\ufeff${csv}`
  return new Response(bomPrefixed, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
