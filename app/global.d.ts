import type {} from "hono"
import "@hono/react-renderer"

declare module "hono" {
  interface Env {}
}

declare module "@hono/react-renderer" {
  interface Props {
    title?: string
  }
}
