import type { FC, PropsWithChildren } from "hono/jsx"
import { useState } from "hono/jsx"
import ChartColumnIcon from "../../../components/icons/lucide/chartColumnIcon"
import ChefHatIcon from "../../../components/icons/lucide/chefHatIcon"
import ClipboardListIcon from "../../../components/icons/lucide/clipboardListIcon"
import LayoutDashboardIcon from "../../../components/icons/lucide/layoutDashboard"
import PackageIcon from "../../../components/icons/lucide/packageIcon"
import PanelLeftIcon from "../../../components/icons/lucide/panelLeftIcon"
import SettingsIcon from "../../../components/icons/lucide/settingsIcon"
import ShoppingCartIcon from "../../../components/icons/lucide/shoppingCartIcon"

const SidebarNavSection: FC<PropsWithChildren<{ label: string }>> = ({
  label,
  children,
}) => (
  <div>
    <div className="px-6 py-1 font-semibold text-gray-500 text-xs">{label}</div>
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
    <li>
      <a
        href={href}
        className={`flex items-center gap-2 rounded-md px-6 py-2 font-medium text-sm transition ${
          isActive
            ? "bg-blue-50 font-bold text-blue-700"
            : "text-gray-700 hover:bg-gray-100"
        }
        `}
        aria-current={isActive ? "page" : undefined}
      >
        <div className="h-5 w-5 flex-shrink-0">
          <Icon />
        </div>

        <span className="whitespace-nowrap">{children}</span>
      </a>
    </li>
  )
}

const StaffSidebar: FC<{ currentPath: string }> = ({ currentPath }) => {
  const [open, setOpen] = useState(false)

  const MobileToggleButton = () => (
    <button
      type="button"
      className="fixed top-4 right-4 z-50 rounded-full border bg-white p-2 shadow transition md:hidden"
      aria-label={open ? "サイドバーを閉じる" : "サイドバーを開く"}
      onClick={() => setOpen(!open)}
    >
      <div
        className={`h-6 w-6 transform text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      >
        <PanelLeftIcon />
      </div>
    </button>
  )

  return (
    <>
      <MobileToggleButton />
      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen w-64 flex-col border-r bg-white transition-all duration-200 ${open ? "translate-x-0" : "-translate-x-full"}md:translate-x-0 md:fixed md:top-0 md:left-0 md:z-40 md:h-screen md:w-64`}
      >
        <div className="relative flex items-center border-b px-0 py-5">
          <div className="ml-4 grid aspect-square size-8 place-items-center rounded-md bg-gray-100">
            <div className="size-6">
              <ChefHatIcon />
            </div>
          </div>
          <div className="ml-2 flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-lg">Order</span>
            <span className="whitespace-nowrap text-gray-400 text-xs">
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
            <SidebarNavItem
              href="/staff/register"
              icon={ShoppingCartIcon}
              currentPath={currentPath}
            >
              レジ
            </SidebarNavItem>
            <SidebarNavItem
              href="/staff/kitchen"
              icon={ChefHatIcon}
              currentPath={currentPath}
            >
              厨房管理
            </SidebarNavItem>
          </SidebarNavSection>
          <SidebarNavSection label="管理">
            <SidebarNavItem
              href="/staff/products"
              icon={PackageIcon}
              currentPath={currentPath}
            >
              商品管理
            </SidebarNavItem>
            <SidebarNavItem
              href="/staff/orders"
              icon={ClipboardListIcon}
              currentPath={currentPath}
            >
              注文履歴
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
    </>
  )
}

export default StaffSidebar
