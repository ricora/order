import type { FC } from "hono/jsx"
import MonitorIcon from "../../../../components/icons/lucide/monitorIcon"
import MoonIcon from "../../../../components/icons/lucide/moonIcon"
import SunIcon from "../../../../components/icons/lucide/sunIcon"
import ChipButton from "../../../../components/ui/chipButton"
import type { ColorScheme } from "../../../../helpers/ui/color-scheme"
import { useColorScheme } from "../../../../hooks/useColorScheme"

const colorSchemeOptions: Array<{
  value: ColorScheme
  label: string
  icon: FC
}> = [
  { value: "light", label: "ライト", icon: SunIcon },
  { value: "dark", label: "ダーク", icon: MoonIcon },
  { value: "auto", label: "自動", icon: MonitorIcon },
]

export default function ColorSchemeSelector() {
  const { colorScheme, setColorScheme } = useColorScheme()

  return (
    <div className="rounded-lg border bg-bg p-6">
      <div className="mb-4">
        <h2 className="font-semibold text-fg text-lg">カラースキーム</h2>
        <p className="mt-1 text-muted-fg text-sm">
          アプリケーションの外観テーマを選択します。
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {colorSchemeOptions.map((option) => {
          const Icon = option.icon
          return (
            <ChipButton
              key={option.value}
              isActive={colorScheme === option.value}
              onClick={() => setColorScheme(option.value)}
              ariaLabel={`${option.label}モードに切り替え`}
            >
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4">
                  <Icon />
                </div>
                <span>{option.label}</span>
              </div>
            </ChipButton>
          )
        })}
      </div>
    </div>
  )
}
