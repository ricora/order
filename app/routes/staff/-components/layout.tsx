import type { FC, PropsWithChildren } from "hono/jsx"
import { useRequestContext } from "hono/jsx-renderer"
import StaffSidebar from "./$staffSidebar"

type Breadcrumb = {
  label: string
  href: string
}

const buildBreadcrumbs = (path: string): Breadcrumb[] => {
  const ignoreParts = ["staff"]
  const basePath = "/staff"
  const parts = path
    .split("/")
    .filter(Boolean)
    .map((part) => ({
      raw: part,
      label: part
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    }))
    .reduce(
      (acc, part) => {
        acc.push({
          ...part,
          href: `/${acc.map((p) => p.raw).join("/")}/${part.raw}`,
        })
        return acc
      },
      [] as { label: string; href: string; raw: string }[],
    )
    .filter(({ raw }) => !ignoreParts.includes(raw))

  if (parts.length === 0) {
    return [{ label: "Dashboard", href: basePath }]
  }
  return parts
}

const Breadcrumbs: FC<{ currentPath: string }> = ({ currentPath }) => {
  const breadcrumbs = buildBreadcrumbs(currentPath)
  return (
    <nav className="flex items-center gap-2" aria-label="Breadcrumb">
      {breadcrumbs.map((item, idx) => (
        <span key={item.href} className="flex items-center gap-2">
          <a
            href={item.href}
            className="font-medium text-muted-fg text-sm hover:text-primary"
          >
            {item.label}
          </a>
          {idx < breadcrumbs.length - 1 && (
            <span className="text-muted-fg/40">/</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export const Layout: FC<
  PropsWithChildren<{ title: string; description: string }>
> = ({ children, title, description }) => {
  const c = useRequestContext()
  return (
    <div className="flex min-h-screen bg-muted">
      <StaffSidebar currentPath={c.req.path} />
      <div className="flex min-w-0 flex-1 flex-col md:ml-64">
        <header className="fixed top-0 right-0 left-0 z-30 flex h-16 items-center border-b bg-navbar px-6 text-navbar-fg md:left-64">
          <Breadcrumbs currentPath={c.req.path} />
        </header>
        <main className="min-w-0 flex-1 pt-16">
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
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
