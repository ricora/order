import { drizzle } from "drizzle-orm/postgres-js"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.")
}
export const dbClient = drizzle(process.env.DATABASE_URL)

/** Query系で利用するDBクライアント */
export type DbClient = typeof dbClient

/** Command系で利用するDBクライアント */
export type TransactionDbClient = Parameters<
  Parameters<typeof dbClient.transaction>[0]
>[0]
