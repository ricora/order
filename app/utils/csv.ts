type CsvValue = string | number | boolean | Date | null | undefined

const toStringValue = (value: CsvValue): string => {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "boolean") return value ? "true" : "false"
  return String(value)
}

const needsQuoting = (value: string): boolean => {
  return /[",\r\n]/.test(value)
}

const escapeCsvValue = (value: string): string => {
  return `"${value.replace(/"/g, '""')}"`
}

export const toCsv = (rows: CsvValue[][]): string => {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const stringValue = toStringValue(value)
          if (needsQuoting(stringValue)) {
            return escapeCsvValue(stringValue)
          }
          return stringValue
        })
        .join(","),
    )
    .join("\n")
}
