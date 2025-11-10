import type { FC, PropsWithChildren } from "hono/jsx"
import { useRequestContext } from "hono/jsx-renderer"
import { SidebarLayout } from "./$staffSidebar"

export const Layout: FC<
  PropsWithChildren<{ title: string; description: string }>
> = ({ children, title, description }) => {
  const c = useRequestContext()
  return (
    <SidebarLayout currentPath={c.req.path}>
      <main className="min-w-0 flex-1 pt-16 overflow-auto">
        <div className="p-4">
          <div className="mx-auto mt-2 mb-6 max-w-7xl rounded-lg border bg-bg p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="font-bold text-2xl text-fg">{title}</h1>
                <p className="mt-1 text-muted-fg">{description}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl flex-1 space-y-6">
          <div className="bg-muted p-4">{children}</div>
        </div>
      </main>
    </SidebarLayout>
  )
}

export default Layout
