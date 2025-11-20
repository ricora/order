import { Style } from "hono/css"
import { jsxRenderer, useRequestContext } from "hono/jsx-renderer"
import { Link, Script } from "honox/server"
import Toast from "../components/ui/toast"
import colorSchemeInitScript from "../helpers/ui/color-scheme-entry?js"
import { deleteToastCookie, getToastCookie } from "../helpers/ui/toast"
import staffSidebarInitScript from "./staff/-helpers/sidebar-entry?js"

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
        {c.req.path.startsWith("/staff") && (
          <script
            // biome-ignore lint/security/noDangerouslySetInnerHtml: must inline pre-render staff sidebar script to prevent FOUC (Flash of Unstyled Content)
            dangerouslySetInnerHTML={{ __html: staffSidebarInitScript }}
          />
        )}
        <link rel="icon" href="/favicon.ico" />
        {/* Preload frequently used fonts to prevent FOUT (Flash of Unstyled Text) */}
        <link
          rel="preload"
          as="font"
          href="/fonts/m-plus-rounded-1c/m-plus-rounded-1c-regular.ttf"
          type="font/ttf"
          crossorigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          href="/fonts/m-plus-rounded-1c/m-plus-rounded-1c-bold.ttf"
          type="font/ttf"
          crossorigin="anonymous"
        />
        <Link href="/app/style.css" rel="stylesheet" />
        <Script src="/app/client.ts" async />
        <Style />
      </head>
      <body class="h-full">
        {toastMessage && (
          <div class="fixed right-4 bottom-4 z-50 flex max-w-[420px] flex-col items-end gap-2">
            <div class="w-max self-end">
              <Toast message={toastMessage} type={toastType} />
            </div>
          </div>
        )}
        {children}
      </body>
    </html>
  )
})
