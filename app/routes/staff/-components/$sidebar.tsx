import type { FC, PropsWithChildren } from "hono/jsx"
import { twJoin } from "tailwind-merge"
import { tv } from "tailwind-variants"
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
import { useIsMobile } from "../../../hooks/useIsMobile"
import {
  DESKTOP_SIDEBAR_TOGGLE_BUTTON_ID,
  toggleSidebarState,
} from "../-helpers/sidebar"

export const sidebarToggleButtonStyles = tv({
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
        base: "mr-4 hidden rounded-lg transition hover:bg-muted md:block",
        icon: "size-4",
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
  gitCommitHash,
}: {
  currentPath: string
  className?: string
  gitCommitHash: string | undefined
}) => (
  <aside
    className={twJoin(
      "fixed top-0 left-0 flex h-screen w-64 flex-col overflow-y-auto border-sidebar-border border-r bg-sidebar text-sidebar-fg",
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
    <div className="px-6 py-3 text-muted-fg text-xs">
      {gitCommitHash ? `Version ${gitCommitHash}` : null}
    </div>
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

const MobileSidebar: FC<{
  currentPath: string
  gitCommitHash: string | undefined
}> = ({ currentPath, gitCommitHash }) => {
  return (
    <DrawerRoot side="left">
      <MobileSidebarToggleButton />
      <DrawerOverlay />
      <DrawerContent className="w-64">
        <SidebarInternal
          currentPath={currentPath}
          gitCommitHash={gitCommitHash}
        />
      </DrawerContent>
    </DrawerRoot>
  )
}

export const DesktopSidebarToggleButton = () => {
  const { base, icon } = sidebarToggleButtonStyles({ device: "desktop" })

  return (
    <button
      id={DESKTOP_SIDEBAR_TOGGLE_BUTTON_ID}
      type="button"
      className={base()}
      onClick={toggleSidebarState}
    >
      <div className={icon()}>
        <PanelLeftIcon />
      </div>
    </button>
  )
}
const DesktopSidebar: FC<{
  currentPath: string
  gitCommitHash: string | undefined
}> = ({ currentPath, gitCommitHash }) => (
  <SidebarInternal
    currentPath={currentPath}
    gitCommitHash={gitCommitHash}
    className="hidden staff-sidebar-open:md:flex staff-sidebar-closed:md:hidden"
  />
)

export const Sidebar: FC<{
  currentPath: string
  gitCommitHash: string | undefined
}> = ({ currentPath, gitCommitHash }) => {
  const isMobile = useIsMobile()

  return isMobile ? (
    <MobileSidebar currentPath={currentPath} gitCommitHash={gitCommitHash} />
  ) : (
    <DesktopSidebar currentPath={currentPath} gitCommitHash={gitCommitHash} />
  )
}
