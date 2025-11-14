import { build } from "esbuild"
import type { Plugin, ResolvedConfig } from "vite"

const INLINE_JS_QUERY = "?js"

export const inlineJsPlugin = (): Plugin => {
  let config: ResolvedConfig

  return {
    name: "inline-js-loader",
    configResolved(resolved) {
      config = resolved
    },
    async resolveId(id, importer, options) {
      if (!id.endsWith(INLINE_JS_QUERY)) return null
      const bareId = id.slice(0, -INLINE_JS_QUERY.length)
      const resolved = await this.resolve(bareId, importer, {
        ...options,
        skipSelf: true,
      })
      if (!resolved) return null
      return `${resolved.id}${INLINE_JS_QUERY}`
    },
    async load(id) {
      if (!id.endsWith(INLINE_JS_QUERY)) return null
      const entryFile = id.slice(0, -INLINE_JS_QUERY.length)

      const shouldMinify = config?.command !== "serve"

      const result = await build({
        absWorkingDir: config?.root,
        entryPoints: [entryFile],
        bundle: true,
        format: "iife",
        platform: "browser",
        write: false,
        target: "es2019",
        minify: shouldMinify,
        sourcemap: false,
      })

      const code = result.outputFiles?.[0]?.text ?? ""
      return `export default ${JSON.stringify(code)}`
    },
  }
}
