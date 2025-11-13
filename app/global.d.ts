import type {} from "hono"

declare module "hono" {
  interface Env {
    Variables: {
      dbClient: import("./infrastructure/db/client").DbClient
    }
  }
}

declare global {
  module "*?js" {
    const code: string
    export default code
  }
}
