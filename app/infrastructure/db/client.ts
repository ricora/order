import * as schema from "./schema"

export const dbClient = await (async () => {
  if (!process.env.DATABASE_URL) {
    console.warn(`DATABASE_URL environment variable is not set.
Using native filesystem Postgres database via PGLite for testing purposes.`)

    const { drizzle } = await import("drizzle-orm/pglite")
    return drizzle("./pgdata", { schema })
  }
  const { drizzle } = await import("drizzle-orm/postgres-js")
  return drizzle(process.env.DATABASE_URL, { schema })
})()

/** Query系で利用するDBクライアント */
export type DbClient = typeof dbClient

/** Command系で利用するDBクライアント */
export type TransactionDbClient = Parameters<
  Parameters<typeof dbClient.transaction>[0]
>[0]
