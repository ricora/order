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
            className="text-sm text-gray-600 hover:text-blue-600 font-medium"
          >
            {item.label}
          </a>
          {idx < breadcrumbs.length - 1 && (
            <span className="text-gray-300">/</span>
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
    <div className="flex min-h-screen bg-gray-50">
      <StaffSidebar currentPath={c.req.path} />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <header className="flex h-16 items-center border-b bg-white px-6 fixed top-0 left-0 right-0 md:left-64 z-30">
          <Breadcrumbs currentPath={c.req.path} />
        </header>
        <main className="flex-1 min-w-0 pt-16">
          <div className="p-4">
            <div className="bg-white rounded-lg border p-6 mt-2 mb-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  <p className="text-gray-600 mt-1">{description}</p>
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
