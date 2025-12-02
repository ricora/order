import type { FC } from "hono/jsx"
import { tv } from "tailwind-variants"
import ChevronRightIcon from "../../-components/icons/lucide/chevronRightIcon"
import HouseIcon from "../../-components/icons/lucide/house"
import { DesktopSidebarToggleButton } from "./$sidebar"

type Breadcrumb = {
  label: string
  href: string
}

const buildBreadcrumbs = (path: string): Breadcrumb[] => {
  const ignoreParts = ["staff"]
  const parts = path
    .split("/")
    .filter(Boolean)
    .filter((p) => !ignoreParts.includes(p))
    .map((part) => ({
      raw: part,
      label: part
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    }))
  const baseSegments: string[] = []
  const breadcrumbs: Breadcrumb[] = []
  for (const p of parts) {
    baseSegments.push(p.raw)
    const href = `/staff/${baseSegments.join("/")}`
    breadcrumbs.push({ href, label: p.label })
  }
  if (breadcrumbs.length === 0) {
    return [{ label: "Dashboard", href: "/staff" }]
  }
  return breadcrumbs
}

const breadcrumbTv = tv({
  base: "text-sm transition-colors duration-150",
  variants: {
    isLast: {
      true: "font-semibold text-secondary-fg",
      false: "font-medium text-muted-fg hover:text-secondary-fg",
    },
  },
  defaultVariants: { isLast: false },
})

const Breadcrumbs: FC<{ currentPath: string }> = ({ currentPath }) => {
  const breadcrumbs = buildBreadcrumbs(currentPath)
  return (
    <nav
      class="flex items-center gap-1 rounded-lg border border-border px-2 py-1"
      aria-label="Breadcrumb"
    >
      <span class="flex items-center gap-1">
        {breadcrumbs.length === 0 ? (
          <span class={breadcrumbTv({ isLast: true })}>
            <div class="size-4">
              <HouseIcon />
            </div>
            <span class="sr-only">Dashboard</span>
          </span>
        ) : (
          <a
            href="/staff"
            aria-label="Dashboard"
            class={breadcrumbTv({ isLast: false })}
          >
            <div class="size-4">
              <HouseIcon />
            </div>
          </a>
        )}
        {breadcrumbs.length > 0 && (
          <div class="size-4 text-muted-fg">
            <ChevronRightIcon />
          </div>
        )}
      </span>

      {breadcrumbs.map((item, idx) => {
        const isLast = idx === breadcrumbs.length - 1
        return (
          <span key={item.href} class="flex items-center gap-1">
            {isLast ? (
              <span class={breadcrumbTv({ isLast })}>{item.label}</span>
            ) : (
              <a href={item.href} class={breadcrumbTv({ isLast })}>
                {item.label}
              </a>
            )}
            {idx < breadcrumbs.length - 1 && (
              <div class="size-4 text-muted-fg">
                <ChevronRightIcon />
              </div>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export const Header = ({ currentPath }: { currentPath: string }) => {
  return (
    <header class="sticky top-0 z-10 flex h-16 items-center border-b bg-navbar px-6 text-navbar-fg">
      <DesktopSidebarToggleButton />
      <Breadcrumbs currentPath={currentPath} />
    </header>
  )
}
