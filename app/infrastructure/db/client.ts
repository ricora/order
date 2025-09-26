import * as schema from "./schema"

let hasWarned = false

export const createDbClient = async () => {
  if (!process.env.DATABASE_URL) {
    if (!hasWarned) {
      console.warn(`DATABASE_URL environment variable is not set.
Using native filesystem Postgres database via PGLite for testing purposes.`)
      hasWarned = true
    }

    const { drizzle } = await import("drizzle-orm/pglite")
    return drizzle("./pgdata", { schema })
  }
  const { drizzle } = await import("drizzle-orm/postgres-js")
  return drizzle(process.env.DATABASE_URL, { schema })
}

/** Query系で利用するDBクライアント */
export type DbClient = Awaited<ReturnType<typeof createDbClient>>

/** Command系で利用するDBクライアント */
export type TransactionDbClient = Parameters<
  Parameters<DbClient["transaction"]>[0]
>[0]
