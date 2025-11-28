/**
 * テスト環境のためのDrizzle Kitの設定ファイル
 */
import { Readable, Writable } from "node:stream"
import zlib from "node:zlib"
import { defineConfig } from "drizzle-kit"

/**
 * This is a polyfill for the CompressionStream.
 * This solves the issue where Drizzle Studio Can't find variable: CompressionStream
 *
 * ![BUG]: ReferenceError: Can't find variable: CompressionStream
 * @see https://github.com/drizzle-team/drizzle-orm/issues/3880
 *
 * Bun doesn't have CompressionStream yet
 * @see https://github.com/oven-sh/bun/issues/1723
 */
// @ts-expect-error
globalThis.CompressionStream ??= class CompressionStream {
  readable
  writable
  constructor(format: "deflate" | "deflate-raw" | "gzip") {
    const handle = {
      deflate: zlib.createDeflate,
      "deflate-raw": zlib.createDeflateRaw,
      gzip: zlib.createGzip,
    }[format]()
    this.readable = Readable.toWeb(handle)
    this.writable = Writable.toWeb(handle)
  }
}

export default defineConfig({
  out: "./drizzle-test",
  schema: "./app/libs/db/schema.ts",
  dialect: "postgresql",
  driver: "pglite",
  dbCredentials: {
    url: "./pgdata",
  },
})
