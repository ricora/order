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
let dbClientInitPromise: Promise<DbClient> | null = null

export const createDbClient = async (): Promise<DbClient> => {
  if (dbClientInstance) {
    return dbClientInstance
  }
  if (dbClientInitPromise) {
    return dbClientInitPromise
  }
  dbClientInitPromise = (async (): Promise<DbClient> => {
    try {
      // プロダクションビルドではPGliteを依存関係から除外する
      if (!process.env.DATABASE_URL) {
        if (!hasWarned) {
          console.warn(`DATABASE_URL environment variable is not set.
Development environment will fall back to PGlite which provides a filesystem Postgres for development and testing.
Production environment requires a valid Postgres connection string.`)
          hasWarned = true
        }

        const { drizzle } = await import("drizzle-orm/pglite")
        dbClientInstance = drizzle("./pgdata", { schema })
        return dbClientInstance
      }

      const { drizzle } = await import("drizzle-orm/postgres-js")
      dbClientInstance = drizzle(process.env.DATABASE_URL, { schema })
      return dbClientInstance
    } catch (err) {
      dbClientInitPromise = null
      throw err
    }
  })()

  return dbClientInitPromise
}
