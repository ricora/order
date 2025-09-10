import { drizzle } from "drizzle-orm/postgres-js"

export const dbClient = drizzle(process.env.DATABASE_URL || "")

/** Query系で利用するDBクライアント */
export type DbClient = typeof dbClient

/** Command系で利用するDBクライアント */
export type TransactionDbClient = Parameters<
  Parameters<typeof dbClient.transaction>[0]
>[0]
