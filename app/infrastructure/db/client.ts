import type { PgliteDatabase } from "drizzle-orm/pglite"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

/** Query系で利用するDBクライアント */
export type DbClient =
  | PgliteDatabase<typeof schema>
  | PostgresJsDatabase<typeof schema>

/** Command系で利用するDBクライアント */
export type TransactionDbClient = Parameters<
  Parameters<DbClient["transaction"]>[0]
>[0]

let hasWarned = false
/**
 * DrizzleのDBクライアント。
 * DBクライアントはシングルトンとして扱う。
 */
let dbClientInstance: DbClient | null = null

export const createDbClient = async (): Promise<DbClient> => {
  if (dbClientInstance) {
    return dbClientInstance
  }
  if (!process.env.DATABASE_URL && import.meta.env.DEV) {
    if (!hasWarned) {
      console.warn(`DATABASE_URL environment variable is not set.
Using native filesystem Postgres database via PGLite for testing purposes.`)
      hasWarned = true
    }

    const { drizzle } = await import("drizzle-orm/pglite")
    dbClientInstance = drizzle("./pgdata", { schema })
    return dbClientInstance
  }
  if (!process.env.DATABASE_URL) {
    throw new Error(`DATABASE_URL environment variable is not set.
Production environment requires a valid Postgres connection string.`)
  }

  const { drizzle } = await import("drizzle-orm/postgres-js")
  dbClientInstance = drizzle(process.env.DATABASE_URL, { schema })
  return dbClientInstance
}
