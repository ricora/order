import type { FC, PropsWithChildren } from "hono/jsx"
import { createContext, useContext, useEffect, useState } from "hono/jsx"
import ChartColumnIcon from "../../../components/icons/lucide/chartColumnIcon"
import ChefHatIcon from "../../../components/icons/lucide/chefHatIcon"
import ClipboardListIcon from "../../../components/icons/lucide/clipboardListIcon"
import LayoutDashboardIcon from "../../../components/icons/lucide/layoutDashboard"
import PackageIcon from "../../../components/icons/lucide/packageIcon"
import PanelLeftIcon from "../../../components/icons/lucide/panelLeftIcon"
import SettingsIcon from "../../../components/icons/lucide/settingsIcon"
import ShoppingCartIcon from "../../../components/icons/lucide/shoppingCartIcon"
import {
  DrawerContent,
  DrawerOverlay,
  DrawerRoot,
  DrawerTrigger,
} from "../../../components/ui/$drawer"
import { tv } from "tailwind-variants"
import { twJoin } from "tailwind-merge"
import { useIsMobile } from "../../../hooks/useIsMobile"
import { Header } from "./$header"

const sidebarToggleButtonStyles = tv({
  slots: {
    base: "p-2",
    icon: "",
  },
  variants: {
    device: {
      mobile: {
        base: "fixed bottom-5 left-5 rounded-full border bg-bg p-3 transition hover:bg-muted",
        icon: "size-6",
      },
      desktop: {
        base: "fixed top-5 left-6",
        icon: "size-6",
      },
    },
    open: {
      true: {},
      false: {},
    },
  },
})

const SidebarNavSection: FC<PropsWithChildren<{ label: string }>> = ({
  label,
  children,
}) => (
  <div>
    <div className="px-6 py-1 font-semibold text-sidebar-accent-fg/80 text-xs">
      {label}
    </div>
    <ul>{children}</ul>
  </div>
)

const SidebarNavItem: FC<
  PropsWithChildren<{
    href: string
    icon: FC
    currentPath: string
  }>
> = ({ href, icon: Icon, currentPath, children }) => {
  const isActive = currentPath === href
  return (
    <li class="px-3 py-0.5">
      <a
        href={href}
        className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-medium text-sm transition ${
          isActive
            ? "bg-primary-subtle font-bold text-primary-subtle-fg"
            : "text-sidebar-fg hover:bg-sidebar-accent/60"
        }`}
        aria-current={isActive ? "page" : undefined}
      >
        <div className="h-5 w-5 shrink-0">
          <Icon />
        </div>

        <span className="whitespace-nowrap">{children}</span>
      </a>
    </li>
  )
}

const SidebarInternal = ({
  currentPath,
  className,
}: {
  currentPath: string
  className?: string
}) => (
  <aside
    className={twJoin(
      "sticky top-0 left-0 flex h-screen w-64 flex-col border-sidebar-border border-r bg-sidebar text-sidebar-fg",
      className,
    )}
  >
    <div className="flex items-center border-sidebar-border border-b px-0 py-5">
      <div className="ml-4 grid aspect-square size-8 place-items-center rounded-md bg-sidebar-accent">
        <div className="size-6">
          <ChefHatIcon />
        </div>
      </div>
      <div className="ml-2 flex flex-col gap-0.5 leading-none">
        <span className="font-semibold text-lg">Order</span>
        <span className="whitespace-nowrap text-sidebar-accent-fg/80 text-xs">
          View and manage orders
        </span>
      </div>
    </div>
    <nav className="flex-1 space-y-6 px-0 py-4">
      <SidebarNavSection label="メイン">
        <SidebarNavItem
          href="/staff"
          icon={LayoutDashboardIcon}
          currentPath={currentPath}
        >
          ダッシュボード
        </SidebarNavItem>
      </SidebarNavSection>
      <SidebarNavSection label="注文">
        <SidebarNavItem
          href="/staff/orders"
          icon={ClipboardListIcon}
          currentPath={currentPath}
        >
          注文一覧
        </SidebarNavItem>
        <SidebarNavItem
          href="/staff/orders/new"
          icon={ShoppingCartIcon}
          currentPath={currentPath}
        >
          注文登録
        </SidebarNavItem>
        <SidebarNavItem
          href="/staff/orders/progress"
          icon={ChefHatIcon}
          currentPath={currentPath}
        >
          注文進捗管理
        </SidebarNavItem>
      </SidebarNavSection>
      <SidebarNavSection label="商品">
        <SidebarNavItem
          href="/staff/products"
          icon={PackageIcon}
          currentPath={currentPath}
        >
          商品管理
        </SidebarNavItem>
      </SidebarNavSection>
      <SidebarNavSection label="分析・設定">
        <SidebarNavItem
          href="/staff/analytics"
          icon={ChartColumnIcon}
          currentPath={currentPath}
        >
          売上分析
        </SidebarNavItem>
        <SidebarNavItem
          href="/staff/settings"
          icon={SettingsIcon}
          currentPath={currentPath}
        >
          設定
        </SidebarNavItem>
      </SidebarNavSection>
    </nav>
  </aside>
)

const MobileSidebarToggleButton: FC = () => {
  const { base, icon } = sidebarToggleButtonStyles({ device: "mobile" })

  return (
    <DrawerTrigger className={base()}>
      <div className={icon()}>
        <PanelLeftIcon />
      </div>
    </DrawerTrigger>
  )
}

const MobileSidebar: FC<{ currentPath: string }> = ({ currentPath }) => {
  return (
    <DrawerRoot side="left">
      <MobileSidebarToggleButton />
      <DrawerOverlay />
      <DrawerContent>
        <SidebarInternal currentPath={currentPath} />
      </DrawerContent>
    </DrawerRoot>
  )
}

const SidebarContext = createContext<{
  isOpen: boolean
  toggle: () => void
}>({
  isOpen: true,
  toggle: () => {},
})

const SidebarProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true)
  const toggle = () => setIsOpen((prev) => !prev)

  return (
    <SidebarContext.Provider value={{ isOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error(
      "useDesktopSidebar must be used within a DesktopSidebarProvider",
    )
  }
  return context
}

const DesktopSidebarToggleButton: FC = () => {
  const { base, icon } = sidebarToggleButtonStyles({ device: "desktop" })
  const { toggle } = useSidebar()

  return (
    <button type="button" className={base()} onClick={toggle}>
      <div className={icon()}>
        <PanelLeftIcon />
      </div>
    </button>
  )
}

const DesktopSidebar: FC<{ currentPath: string }> = ({ currentPath }) => {
  const { isOpen } = useSidebar()

  return (
    <>
      <DesktopSidebarToggleButton />
      <SidebarInternal
        currentPath={currentPath}
        className={isOpen ? "flex" : "hidden"}
      />
    </>
  )
}

export const Sidebar: FC<{ currentPath: string }> = ({ currentPath }) => {
  const isMobile = useIsMobile()

  return isMobile ? (
    <MobileSidebar currentPath={currentPath} />
  ) : (
    <DesktopSidebar currentPath={currentPath} />
  )
}

export const SidebarLayout = ({
  children,
  currentPath,
}: PropsWithChildren<{ currentPath: string }>) => {
  return (
    <SidebarProvider>
      <div class="flex h-full flex-row bg-muted">
        <Sidebar currentPath={currentPath} />
        <div class="flex-1">
          <Header currentPath={currentPath} />
          {children}
        </div>
      </div>
    </SidebarProvider>
  )
}
