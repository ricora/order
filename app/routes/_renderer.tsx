import { Style } from "hono/css"
import { jsxRenderer, useRequestContext } from "hono/jsx-renderer"
import { Link, Script } from "honox/server"
import Toast from "../components/ui/toast"
import colorSchemeInitScript from "../helpers/ui/colorSchemaInit.entry.ts?js"
import { deleteToastCookie, getToastCookie } from "../helpers/ui/toast"

export default jsxRenderer(({ children }) => {
  const c = useRequestContext()
  const { toastType, toastMessage } = getToastCookie(c)

  if (toastType || toastMessage) {
    deleteToastCookie(c)
  }

  return (
    <html lang="en" class="h-full">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: must inline pre-render color scheme script to prevent FOUC (Flash of Unstyled Content) */}
        <script dangerouslySetInnerHTML={{ __html: colorSchemeInitScript }} />
        <link rel="icon" href="/favicon.ico" />
        <Link href="/app/style.css" rel="stylesheet" />
        <Script src="/app/client.ts" async />
        <Style />
      </head>
      <body class="h-full">
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50">
            <Toast message={toastMessage} type={toastType} />
          </div>
        )}
        {children}
      </body>
    </html>
  )
})
