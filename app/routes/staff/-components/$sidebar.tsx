import { PropsWithChildren } from "hono/jsx"
import {
  DrawerContent,
  DrawerOverlay,
  DrawerRoot,
  DrawerTrigger,
} from "../../../components/ui/$drawer"

type SidebarLayoutProps = PropsWithChildren

export const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  return (
    <DrawerRoot side="left">
      <DrawerOverlay />
      <DrawerContent>
        <div class="z-50 h-full bg-red-600">SIDEBAR</div>
      </DrawerContent>
      <div>
        <DrawerTrigger>OPEN</DrawerTrigger>
        {/* {children} */}
        {/* DIV */}
      </div>
    </DrawerRoot>
  )
}
