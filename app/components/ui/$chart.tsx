import {
  Chart as ChartJS,
  type ChartConfiguration,
  type ChartDataset,
  type ChartOptions,
  type ChartType,
  type DefaultDataPoint,
} from "chart.js/auto"
import { useEffect, useRef, useState } from "hono/jsx"

const CHART_COLOR_TOKENS = [
  "--color-chart-1",
  "--color-chart-2",
  "--color-chart-3",
  "--color-chart-4",
  "--color-chart-5",
] as const

type DesignTokenSet = {
  palette: string[]
  textColor: string
  gridColor: string
  backgroundColor: string
  tooltipBackground: string
  tooltipForeground: string
  borderColor: string
}

const FALLBACK_TOKENS: DesignTokenSet = {
  palette: [
    "rgb(248, 113, 113)",
    "rgb(249, 146, 60)",
    "rgb(34, 197, 94)",
    "rgb(56, 189, 248)",
    "rgb(129, 140, 248)",
  ],
  textColor: "rgb(51, 65, 85)",
  gridColor: "rgba(148, 163, 184, 0.5)",
  backgroundColor: "rgb(255, 255, 255)",
  tooltipBackground: "rgba(15, 23, 42, 0.9)",
  tooltipForeground: "rgb(248, 250, 252)",
  borderColor: "rgba(148, 163, 184, 0.5)",
}

export type ChartConfig =
  ChartConfiguration<ChartType, DefaultDataPoint<ChartType>, unknown>

export type ChartProps = {
  config: ChartConfig
  class?: string
  ariaLabel?: string
}

const useThemeVersion = () => {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    const target = document.documentElement
    const handleThemeChange = () => {
      setVersion((prev) => prev + 1)
    }
    const observer = new MutationObserver(handleThemeChange)
    observer.observe(target, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    })

    const media = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null

    if (media) {
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", handleThemeChange)
      } else if (typeof media.addListener === "function") {
        media.addListener(handleThemeChange)
      }
    }

    return () => {
      observer.disconnect()
      if (!media) return
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", handleThemeChange)
      } else if (typeof media.removeListener === "function") {
        media.removeListener(handleThemeChange)
      }
    }
  }, [])

  return version
}

const resolveDesignTokens = (element?: HTMLElement | null): DesignTokenSet => {
  if (typeof window === "undefined") {
    return FALLBACK_TOKENS
  }

  const doc = element?.ownerDocument ?? window.document
  const container = element ?? doc.body
  const probe = doc.createElement("span")
  probe.style.position = "absolute"
  probe.style.width = "0"
  probe.style.height = "0"
  probe.style.pointerEvents = "none"
  probe.style.opacity = "0"
  container.appendChild(probe)

  const getComputedColor = (token: string) => {
    probe.style.color = `var(${token})`
    return doc.defaultView?.getComputedStyle(probe).color ?? ""
  }

  const getComputedBackground = (token: string) => {
    probe.style.backgroundColor = `var(${token})`
    return doc.defaultView?.getComputedStyle(probe).backgroundColor ?? ""
  }

  const palette = CHART_COLOR_TOKENS.map<string>((token, index) => {
    const color = getComputedColor(token)
    const fallbackIndex = index % FALLBACK_TOKENS.palette.length
    const fallbackColor =
      FALLBACK_TOKENS.palette[fallbackIndex] ??
      FALLBACK_TOKENS.palette[0] ??
      "rgb(0, 0, 0)"
    return color || fallbackColor
  })
  const textColor =
    getComputedColor("--color-muted-fg") || FALLBACK_TOKENS.textColor
  const borderColor =
    getComputedColor("--color-border") || FALLBACK_TOKENS.borderColor
  const backgroundColor =
    getComputedBackground("--color-bg") || FALLBACK_TOKENS.backgroundColor
  const tooltipBackground =
    getComputedBackground("--color-overlay") ||
    FALLBACK_TOKENS.tooltipBackground
  const tooltipForeground =
    getComputedBackground("--color-overlay-fg") ||
    FALLBACK_TOKENS.tooltipForeground

  probe.remove()

  return {
    palette,
    textColor,
    gridColor: borderColor,
    backgroundColor,
    tooltipBackground,
    tooltipForeground,
    borderColor,
  }
}

type AnyObject = Record<string, unknown>

const isObject = (value: unknown): value is AnyObject =>
  typeof value === "object" && value !== null

type ChartPluginOptions = NonNullable<ChartOptions<ChartType>["plugins"]>
type LegendConfig = NonNullable<ChartPluginOptions["legend"]>
type TooltipConfig = NonNullable<ChartPluginOptions["tooltip"]>
type TitleConfig = NonNullable<ChartPluginOptions["title"]>
type ScalesConfig = NonNullable<ChartOptions<ChartType>["scales"]>

const clampAlpha = (alpha: number) => Math.min(Math.max(alpha, 0), 1)

const applyAlpha = (color: string, alpha: number) => {
  const match = color.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d+(?:\.\d+)?))?\s*\)/i,
  )
  if (!match) {
    return color
  }
  const [, r, g, b] = match
  const nextAlpha = clampAlpha(alpha)
  return `rgba(${r}, ${g}, ${b}, ${nextAlpha})`
}

const resolveFontWeight = (
  value: unknown,
  fallback: number | "bold" | "normal" | "lighter" | "bolder" = 600,
) => {
  if (typeof value === "number") {
    return value
  }
  if (
    value === "bold" ||
    value === "normal" ||
    value === "lighter" ||
    value === "bolder"
  ) {
    return value
  }
  return fallback
}

const withDefaultClass = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ")

const mergeLegendOptions = (
  legendOptions: LegendConfig | false | undefined,
  tokens: DesignTokenSet,
): LegendConfig => {
  if (legendOptions === false) {
    return {
      display: false,
    } as LegendConfig
  }
  const overrides = (legendOptions ?? {}) as LegendConfig
  const labelOverrides = (overrides?.labels ?? {}) as LegendConfig["labels"]

  return {
    ...overrides,
    display: overrides?.display ?? true,
    position: overrides?.position ?? "top",
    labels: overrides?.labels
      ? {
          ...overrides.labels,
          color: labelOverrides?.color ?? tokens.textColor,
          usePointStyle: labelOverrides?.usePointStyle ?? true,
          boxWidth: labelOverrides?.boxWidth ?? 10,
          boxHeight: labelOverrides?.boxHeight ?? 10,
          padding: labelOverrides?.padding ?? 12,
        }
      : {
          color: tokens.textColor,
          usePointStyle: true,
          boxWidth: 10,
          boxHeight: 10,
          padding: 12,
        },
  }
}

const mergeTooltipOptions = (
  tooltipOptions: TooltipConfig | false | undefined,
  tokens: DesignTokenSet,
): TooltipConfig => {
  if (tooltipOptions === false) {
    return {
      enabled: false,
    } as TooltipConfig
  }
  const overrides = (tooltipOptions ?? {}) as TooltipConfig
  const titleFontOverrides = isObject(overrides?.titleFont)
    ? (overrides.titleFont as AnyObject)
    : undefined
  const bodyFontOverrides = isObject(overrides?.bodyFont)
    ? (overrides.bodyFont as AnyObject)
    : undefined
  const resolvedTitleWeight = resolveFontWeight(titleFontOverrides?.weight)
  const resolvedBodySize =
    typeof bodyFontOverrides?.size === "number" ? bodyFontOverrides.size : 13

  return {
    ...overrides,
    enabled: overrides?.enabled ?? true,
    backgroundColor:
      overrides?.backgroundColor ?? tokens.tooltipBackground,
    titleColor: overrides?.titleColor ?? tokens.tooltipForeground,
    bodyColor: overrides?.bodyColor ?? tokens.tooltipForeground,
    borderColor: overrides?.borderColor ?? tokens.borderColor,
    borderWidth: overrides?.borderWidth ?? 1,
    displayColors: overrides?.displayColors ?? true,
    padding: overrides?.padding ?? 12,
    caretPadding: overrides?.caretPadding ?? 8,
    titleFont: titleFontOverrides
      ? {
          ...titleFontOverrides,
          size:
            typeof titleFontOverrides.size === "number"
              ? titleFontOverrides.size
              : 14,
          weight: resolvedTitleWeight,
        }
      : { size: 14, weight: 600 },
    bodyFont: bodyFontOverrides
      ? {
          ...bodyFontOverrides,
          size: resolvedBodySize,
        }
      : { size: 13 },
  }
}

const mergeTitleOptions = (
  titleOptions: TitleConfig | undefined,
  tokens: DesignTokenSet,
): TitleConfig => {
  const overrides = (titleOptions ?? {}) as TitleConfig
  const fontOverrides = isObject(overrides?.font)
    ? (overrides.font as AnyObject)
    : undefined
  return {
    ...overrides,
    display: overrides?.display ?? Boolean(overrides?.text),
    color: overrides?.color ?? tokens.textColor,
    padding: overrides?.padding ?? { bottom: 12 },
    font: fontOverrides
      ? {
          ...fontOverrides,
          size:
            typeof fontOverrides.size === "number"
              ? fontOverrides.size
              : 16,
          weight: resolveFontWeight(fontOverrides.weight),
        }
      : { size: 16, weight: 600 },
  }
}

const mergeOptionsWithTokens = (
  options: ChartOptions<ChartType> | undefined,
  tokens: DesignTokenSet,
): ChartOptions<ChartType> => {
  const pluginOverrides = (options?.plugins ?? {}) as ChartPluginOptions
  const titleOptions = pluginOverrides.title
  const merged: ChartOptions<ChartType> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
      ...options?.interaction,
    },
    layout: {
      padding: options?.layout?.padding ?? 12,
      ...options?.layout,
    },
    scales: (() => {
      const provided = options?.scales as ScalesConfig | undefined
      const rawScales: ScalesConfig =
        provided && Object.keys(provided).length > 0
          ? provided
          : ({
              x: { grid: { display: false } },
              y: { beginAtZero: true },
            } satisfies ScalesConfig)
      const entries = Object.entries(rawScales).map(([scaleId, scale]) => {
        const scaleRecord = (scale ?? {}) as AnyObject
        const border = (scaleRecord.border ?? {}) as AnyObject
        const grid = (scaleRecord.grid ?? {}) as AnyObject
        const ticks = (scaleRecord.ticks ?? {}) as AnyObject
        return [
          scaleId,
          {
            ...scaleRecord,
            border: {
              display: border.display ?? false,
              color: border.color ?? tokens.gridColor,
              ...border,
            },
            grid: {
              color: grid.color ?? tokens.gridColor,
              ...grid,
            },
            ticks: {
              color: ticks.color ?? tokens.textColor,
              padding: ticks.padding ?? 6,
              ...ticks,
            },
          },
        ]
      })
      return Object.fromEntries(entries) as ScalesConfig
    })(),
    plugins: {
      ...pluginOverrides,
      legend: mergeLegendOptions(pluginOverrides.legend, tokens),
      tooltip: mergeTooltipOptions(pluginOverrides.tooltip, tokens),
      title: mergeTitleOptions(titleOptions, tokens),
    },
  }

  return merged
}

const normalizeDataset = (
  dataset: ChartDataset,
  tokens: DesignTokenSet,
  paletteIndex: number,
  fallbackType: ChartType,
): ChartDataset => {
  const datasetType = dataset.type ?? fallbackType
  const paletteColor =
    tokens.palette[paletteIndex % tokens.palette.length] ??
    tokens.textColor
  const fillValue = (dataset as { fill?: unknown }).fill
  const hasExplicitFill =
    fillValue !== undefined && fillValue !== false
  const shouldFill =
    datasetType === "bar" ? true : Boolean(hasExplicitFill)

  const normalized = { ...dataset } as ChartDataset<ChartType>
  if (!normalized.borderColor) {
    normalized.borderColor = paletteColor
  }
  if (!normalized.backgroundColor) {
    normalized.backgroundColor = applyAlpha(
      paletteColor,
      shouldFill ? 0.25 : 0.12,
    )
  }
  if (!normalized.borderWidth) {
    normalized.borderWidth = datasetType === "bar" ? 1 : 2
  }

  return normalized
}

const buildChartConfiguration = (
  config: ChartConfig,
  tokens: DesignTokenSet,
): ChartConfig => {
  const normalizedDatasets = config.data.datasets.map((dataset, index) =>
    normalizeDataset(dataset, tokens, index, config.type),
  )

  return {
    ...config,
    data: {
      ...config.data,
      labels: config.data.labels ? [...config.data.labels] : [],
      datasets: normalizedDatasets,
    },
    options: mergeOptionsWithTokens(config.options, tokens),
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
  chart.data.datasets = config.data.datasets as ChartDataset[]
  chart.update()
}

const extractTitleText = (config: ChartConfig) => {
  const title = config.options?.plugins?.title?.text
  if (!title) return ""
  return Array.isArray(title) ? title.join(" / ") : title
}

const Chart = ({
  config,
  class: className,
  ariaLabel,
}: ChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<ChartJS | null>(null)
  const themeVersion = useThemeVersion()

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) {
      return
    }

    const tokens = resolveDesignTokens(containerRef.current)
    const normalizedConfig = buildChartConfiguration(
      config as ChartConfig,
      tokens,
    )

    if (!chartRef.current) {
      chartRef.current = new ChartJS(
        canvasRef.current,
        normalizedConfig,
      )
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

  const fallbackLabel = ariaLabel ?? extractTitleText(config as ChartConfig)
  const containerClass = withDefaultClass(
    "relative h-full w-full min-h-0",
    className,
  )

  console.log("Rendering Chart component")

  return (
    <div class={containerClass} ref={containerRef}>
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
