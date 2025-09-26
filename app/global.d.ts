import type {} from "hono"

declare module "hono" {
  interface Env {
    Variables: {
      dbClient: import("./infrastructure/db/client").DbClient
    }
  }
}
