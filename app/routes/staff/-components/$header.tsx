import type { FC } from "hono/jsx"

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

export const Header = ({ currentPath }: { currentPath: string }) => {
  return (
    <header className="sticky top-0 flex h-16 items-center border-b bg-navbar px-6 text-navbar-fg">
      <Breadcrumbs currentPath={currentPath} />
    </header>
  )
}
