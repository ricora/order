import {
  type ChartConfiguration,
  type ChartDataset,
  Chart as ChartJS,
  type ChartOptions,
  type ChartType,
  type DefaultDataPoint,
} from "chart.js/auto"
import { useEffect, useRef, useState } from "hono/jsx"
import { twMerge } from "tailwind-merge"

const CHART_COLOR_TOKENS = [
  "--color-chart-1",
  "--color-chart-2",
  "--color-chart-3",
  "--color-chart-4",
  "--color-chart-5",
] as const

const CIRCULAR_CHART_TYPES = new Set<ChartType>([
  "pie",
  "doughnut",
  "polarArea",
])

/**
 * Chart.jsの設定型
 */
export type ChartConfig = ChartConfiguration<
  ChartType,
  DefaultDataPoint<ChartType>,
  unknown
>

/**
 * Chartコンポーネントのプロパティ
 */
export type ChartProps = {
  /** Chart.jsの設定 */
  config: ChartConfig
  /** 追加のCSSクラス */
  class?: string
  /** アクセシビリティ用のラベル（未指定の場合はconfigのtitleを使用） */
  ariaLabel?: string
}

type ChartDesignTokens = {
  palette: string[]
  textColor: string
  gridColor: string
  tooltipBackground: string
  tooltipForeground: string
  borderColor: string
}

type ChartPluginOptions = NonNullable<ChartOptions<ChartType>["plugins"]>
type LegendSetting = ChartPluginOptions["legend"]
type TooltipSetting = ChartPluginOptions["tooltip"]
type ScalesSetting = ChartOptions<ChartType>["scales"]

const cssVar = (style: CSSStyleDeclaration, token: string, fallback = "") => {
  const value = style.getPropertyValue(token).trim()
  return value || fallback
}

const readDesignTokens = (): ChartDesignTokens | null => {
  if (typeof window === "undefined") {
    return null
  }
  const style = window.getComputedStyle(document.documentElement)
  return {
    palette: CHART_COLOR_TOKENS.map((token, index) =>
      cssVar(style, token, `rgba(0, 0, 0, ${0.8 - index * 0.1})`),
    ),
    textColor: cssVar(style, "--color-muted-fg", "#1f2937"),
    gridColor: cssVar(style, "--color-border", "rgba(148, 163, 184, 0.5)"),
    tooltipBackground: cssVar(
      style,
      "--color-overlay",
      "rgba(15, 23, 42, 0.9)",
    ),
    tooltipForeground: cssVar(style, "--color-overlay-fg", "#f8fafc"),
    borderColor: cssVar(style, "--color-border", "rgba(148, 163, 184, 0.5)"),
  }
}

const useThemeVersion = () => {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    const target = document.documentElement
    const handleChange = () => setVersion((prev) => prev + 1)
    const observer = new MutationObserver(handleChange)
    observer.observe(target, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    })

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange)
    }

    return () => {
      observer.disconnect()
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", handleChange)
      }
    }
  }, [])

  return version
}

const buildSegmentColors = (count: number, palette: string[]) => {
  if (count <= 0) {
    return palette
  }
  return Array.from({ length: count }, (_, index) => {
    const paletteIndex = index % palette.length
    return palette[paletteIndex] ?? palette[0] ?? "rgba(0, 0, 0, 0.6)"
  })
}

const prepareDatasets = (
  config: ChartConfig,
  tokens: ChartDesignTokens,
  labelCount: number,
) => {
  return config.data.datasets.map((dataset, index) => {
    const datasetType: ChartType = dataset.type ?? config.type
    const paletteColor =
      tokens.palette[index % tokens.palette.length] ??
      tokens.palette[0] ??
      "rgba(0, 0, 0, 0.6)"
    const styled: ChartDataset<ChartType> = { ...dataset }

    if (CIRCULAR_CHART_TYPES.has(datasetType)) {
      const segmentCount = Array.isArray(dataset.data)
        ? dataset.data.length
        : labelCount
      const colors = buildSegmentColors(segmentCount, tokens.palette)
      const borderColors = colors.map(() => tokens.borderColor)
      if (!styled.backgroundColor) {
        styled.backgroundColor = colors
      }
      if (!styled.borderColor) {
        styled.borderColor =
          segmentCount > 0 ? borderColors : tokens.borderColor
      }
      return styled
    }

    if (!styled.borderColor) {
      styled.borderColor = paletteColor
    }
    if (!styled.backgroundColor) {
      styled.backgroundColor = paletteColor
    }

    return styled
  })
}

const prepareLegend = (
  legend: LegendSetting | undefined,
  tokens: ChartDesignTokens,
): LegendSetting => {
  const labels = legend?.labels ?? {}
  return {
    display: legend?.display ?? true,
    position: legend?.position ?? "top",
    ...legend,
    labels: {
      color: labels.color ?? tokens.textColor,
      usePointStyle: labels.usePointStyle ?? true,
      ...labels,
    },
  }
}

const prepareTooltip = (
  tooltip: TooltipSetting | undefined,
  tokens: ChartDesignTokens,
): TooltipSetting => {
  return {
    backgroundColor: tooltip?.backgroundColor ?? tokens.tooltipBackground,
    titleColor: tooltip?.titleColor ?? tokens.tooltipForeground,
    bodyColor: tooltip?.bodyColor ?? tokens.tooltipForeground,
    borderColor: tooltip?.borderColor ?? tokens.borderColor,
    borderWidth: tooltip?.borderWidth ?? 1,
    displayColors: tooltip?.displayColors ?? true,
    ...tooltip,
  }
}

const prepareScales = (
  config: ChartConfig,
  tokens: ChartDesignTokens,
): ScalesSetting => {
  const provided = config.options?.scales
  if (provided) {
    const next: NonNullable<ScalesSetting> = {}
    for (const axis of Object.keys(provided) as Array<
      keyof NonNullable<ScalesSetting>
    >) {
      const scale = provided[axis]
      if (!scale) {
        next[axis] = scale
        continue
      }
      const grid = scale.grid ?? {}
      const ticks = scale.ticks ?? {}
      next[axis] = {
        ...scale,
        grid: {
          color: grid.color ?? tokens.gridColor,
          ...grid,
        },
        ticks: {
          color: ticks.color ?? tokens.textColor,
          ...ticks,
        },
      }
    }
    return next
  }

  if (CIRCULAR_CHART_TYPES.has(config.type)) {
    return undefined
  }

  const fallback: NonNullable<ScalesSetting> = {
    x: {
      grid: { color: tokens.gridColor },
    },
    y: {
      beginAtZero: true,
      grid: { color: tokens.gridColor },
      ticks: { color: tokens.textColor },
    },
  }
  return fallback
}

const buildChartConfig = (
  config: ChartConfig,
  tokens: ChartDesignTokens,
): ChartConfig => {
  const labels = config.data.labels ? [...config.data.labels] : []
  const datasets = prepareDatasets(config, tokens, labels.length)
  const baseOptions = config.options ?? {}
  const pluginOverrides = baseOptions.plugins

  const options: ChartOptions<ChartType> = {
    responsive: baseOptions.responsive ?? true,
    maintainAspectRatio: baseOptions.maintainAspectRatio ?? false,
    ...baseOptions,
    plugins: {
      ...pluginOverrides,
      legend: prepareLegend(pluginOverrides?.legend, tokens),
      tooltip: prepareTooltip(pluginOverrides?.tooltip, tokens),
    },
    scales: prepareScales(config, tokens),
  }

  return {
    ...config,
    data: {
      ...config.data,
      labels,
      datasets,
    },
    options,
  }
}

const updateChartInstance = (chart: ChartJS, config: ChartConfig) => {
  const chartConfig = chart.config as ChartConfig
  chartConfig.type = config.type
  chart.options = config.options ?? {}
  chartConfig.options = config.options
  chartConfig.data = config.data
  chartConfig.plugins = config.plugins
  chart.data.labels = config.data.labels ?? []
  chart.data.datasets = config.data.datasets
  chart.update()
}

const extractTitleText = (config: ChartConfig) => {
  const title = config.options?.plugins?.title?.text
  if (!title) return ""
  return Array.isArray(title) ? title.join(" / ") : title
}

type ChartInstance = ChartJS<ChartType, DefaultDataPoint<ChartType>, unknown>

/**
 * Chart.jsを使用したチャートコンポーネント
 *
 * デザイントークンを自動的に適用し、テーマの変更に対応します。
 */
const Chart = ({ config, class: className, ariaLabel }: ChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<ChartInstance | null>(null)
  const themeVersion = useThemeVersion()

  useEffect(() => {
    if (!canvasRef.current) return
    const tokens = readDesignTokens()
    if (!tokens) return

    const normalizedConfig = buildChartConfig(config, tokens)
    if (!chartRef.current) {
      chartRef.current = new ChartJS(canvasRef.current, normalizedConfig)
      return
    }
    updateChartInstance(chartRef.current, normalizedConfig)
  }, [config, themeVersion])

  useEffect(() => {
    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [])

  const fallbackLabel = ariaLabel ?? extractTitleText(config)
  const containerClass = twMerge("relative h-full w-full min-h-0", className)

  return (
    <div class={containerClass}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={fallbackLabel || undefined}
        class="size-full"
      />
    </div>
  )
}

export default Chart
