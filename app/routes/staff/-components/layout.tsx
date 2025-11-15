import type { FC, PropsWithChildren } from "hono/jsx"
import { useRequestContext } from "hono/jsx-renderer"
import { Header } from "./$header"
import { Sidebar } from "./$sidebar"
import { MAIN_CONTENT_ID } from "../-helpers/sidebar"

export const Layout: FC<
  PropsWithChildren<{ title: string; description: string }>
> = ({ children, title, description }) => {
  const c = useRequestContext()
  return (
    <div className="min-h-full bg-muted">
      <Sidebar currentPath={c.req.path} />
      <div
        className="ml-0 staff-sidebar-closed:md:ml-0 staff-sidebar-open:md:ml-64"
        id={MAIN_CONTENT_ID}
      >
        <Header currentPath={c.req.path} />
        <main className="flex min-w-0 flex-1 flex-col items-center gap-6 overflow-auto px-5 py-6">
          <div className="w-full max-w-7xl rounded-lg border bg-bg p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="font-bold text-2xl text-fg">{title}</h1>
                <p className="mt-1 text-muted-fg">{description}</p>
              </div>
            </div>
          </div>
          <div className="w-full max-w-7xl flex-1 space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default Layout
