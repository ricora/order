import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/islands/ui/breadcrumb"
import { Separator } from "@/islands/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/islands/ui/sidebar"
import {
  BarChart3,
  ChefHat,
  ChefHatIcon,
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
} from "lucide-react"
import type { FC, ReactNode } from "react"

type RouteGroup = {
  label: string
  routes: Route[]
}

type Route = {
  label: string
  href: string
  icon: FC
}

const routes = [
  {
    label: "メイン",
    routes: [
      {
        href: "/staff",
        label: "ダッシュボード",
        icon: LayoutDashboard,
      },
      {
        href: "/staff/register",
        label: "レジ",
        icon: ShoppingCart,
      },
      {
        href: "/staff/kitchen",
        label: "厨房管理",
        icon: ChefHat,
      },
    ],
  },
  {
    label: "管理",
    routes: [
      {
        href: "/staff/products",
        label: "商品管理",
        icon: Package,
      },
      {
        href: "/staff/orders",
        label: "注文履歴",
        icon: ClipboardList,
      },
    ],
  },
  {
    label: "分析・設定",
    routes: [
      {
        href: "/staff/analytics",
        label: "売上分析",
        icon: BarChart3,
      },
      {
        href: "/staff/settings",
        label: "設定",
        icon: Settings,
      },
    ],
  },
] as const satisfies RouteGroup[]

type StaffSidebarProps = {
  pathname: string
}

const StaffSidebar: FC<StaffSidebarProps> = ({ pathname }) => {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/staff">
                <div className="grid aspect-square size-8 place-items-center rounded-md">
                  <ChefHatIcon className="size-6" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Order</span>
                  <span className="text-muted-foreground">
                    View and manage orders
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {routes.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.routes.map((route) => (
                  <SidebarMenuItem key={route.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === route.href}
                      tooltip={route.label}
                    >
                      <a href={route.href}>
                        <route.icon />
                        <span>{route.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}

type PathnamePart = {
  label: string
  href: string
  raw: string
}

const prettifyPathname = (pathname: string) => {
  const ignoreParts = ["staff"]
  const basePath = "/staff"
  const parts = pathname
    .split("/")
    .filter(Boolean)
    .map((part) => ({
      raw: part,
      label: part
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    }))
    .reduce((acc, part) => {
      acc.push({
        ...part,
        href: `/${acc.map((p) => p.raw).join("/")}/${part.raw}`,
      })
      return acc
    }, [] as PathnamePart[])
    .filter(({ raw }) => !ignoreParts.includes(raw))

  if (parts.length === 0) {
    return [{ label: "Dashboard", href: basePath, raw: "" }]
  }
  return parts
}

type StaffHeaderProps = {
  pathname: string
}

const StaffHeader: FC<StaffHeaderProps> = ({ pathname }) => {
  const pathnameParts = prettifyPathname(pathname)

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 !h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {pathnameParts.map((part, index) => (
              <BreadcrumbItem key={part.href}>
                <BreadcrumbLink href={part.href}>{part.label}</BreadcrumbLink>
                {index < pathnameParts.length - 1 && <BreadcrumbSeparator />}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}

type StaffLayoutProps = {
  pathname: string
  children?: ReactNode
}

export function StaffLayout({ children, pathname }: StaffLayoutProps) {
  return (
    <SidebarProvider>
      <StaffSidebar pathname={pathname} />
      <main className="w-full">
        <StaffHeader pathname={pathname} />
        {children}
      </main>
    </SidebarProvider>
  )
}
