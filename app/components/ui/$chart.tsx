import type { FC } from "hono/jsx"
import type { AlignedData } from "uplot"
import "uplot/dist/uPlot.min.css"
import { useCallback, useEffect, useRef, useState } from "hono/jsx"
import uPlot from "uplot"

export type ChartOptions = Omit<uPlot.Options, "width" | "height"> & {
  width: number | "100%"
  height: number | "100%"
}

type UseChartArgs = {
  options: ChartOptions
  data: AlignedData
}

type UseChartResult = {
  ref: (node: HTMLDivElement | null) => void
  chart: uPlot | null
}

const getElementSize = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  return {
    width: rect.width,
    height: rect.height,
  }
}

const getResolvedDimension = (value: number | "100%", fallback: number) => {
  return value === "100%" ? fallback : value
}

const useChart = ({ options, data }: UseChartArgs): UseChartResult => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const chartRef = useRef<uPlot | null>(null)
  const dataRef = useRef<AlignedData>(data)
  const legendRef = useRef<HTMLDivElement | null>(null)
  const titleRef = useRef<HTMLDivElement | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const destroyChart = useCallback(() => {
    resizeObserverRef.current?.disconnect()
    resizeObserverRef.current = null
    chartRef.current?.destroy()
    chartRef.current = null
    legendRef.current = null
    titleRef.current = null
  }, [])

  const ensureChart = useCallback(
    (containerEl: HTMLDivElement, opts: ChartOptions, aligned: AlignedData) => {
      destroyChart()

      const containerSize = getElementSize(containerEl)
      const width = getResolvedDimension(opts.width, containerSize.width)
      const height = getResolvedDimension(opts.height, containerSize.height)

      const chartOptions: uPlot.Options = {
        ...opts,
        width,
        height,
      }

      const nextChart = new uPlot(chartOptions, aligned, containerEl)
      chartRef.current = nextChart

      legendRef.current =
        containerEl.querySelector<HTMLDivElement>(".u-legend") ?? null
      titleRef.current =
        containerEl.querySelector<HTMLDivElement>(".u-title") ?? null

      const legendRect = legendRef.current?.getBoundingClientRect()
      const legendWidth = legendRect?.width ?? 0
      const legendHeight = legendRect?.height ?? 0

      const titleRect = titleRef.current?.getBoundingClientRect()
      const titleWidth = titleRect?.width ?? 0
      const titleHeight = titleRect?.height ?? 0

      const resizedWidth = Math.max(width, legendWidth, titleWidth)
      const resizedHeight = Math.max(0, height - legendHeight - titleHeight)
      nextChart.setSize({ width: resizedWidth, height: resizedHeight })

      const shouldObserve =
        typeof ResizeObserver !== "undefined" &&
        (opts.width === "100%" || opts.height === "100%")

      if (!shouldObserve) {
        return
      }

      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry || !chartRef.current) return

        const containerWidth = entry.contentRect.width
        const containerHeight = entry.contentRect.height

        const legendHeight =
          legendRef.current?.getBoundingClientRect().height ?? 0
        const titleHeight =
          titleRef.current?.getBoundingClientRect().height ?? 0

        const totalHeight = Math.max(
          0,
          containerHeight - legendHeight - titleHeight,
        )

        const nextWidth = opts.width === "100%" ? containerWidth : opts.width
        const nextHeight = opts.height === "100%" ? totalHeight : opts.height

        chartRef.current.setSize({ width: nextWidth, height: nextHeight })
      })

      resizeObserver.observe(containerEl)
      resizeObserverRef.current = resizeObserver
    },
    [destroyChart],
  )

  useEffect(() => {
    if (!container || !dataRef.current) return
    ensureChart(container, options, dataRef.current)
    return () => {
      destroyChart()
    }
  }, [container, options, ensureChart, destroyChart])

  useEffect(() => {
    dataRef.current = data
    if (chartRef.current) {
      chartRef.current.setData(data)
    }
  }, [data])

  const ref = useCallback((node: HTMLDivElement | null) => {
    setContainer(node)
  }, [])

  return {
    chart: chartRef.current,
    ref,
  }
}

type ChartProps = {
  options: ChartOptions
  data: AlignedData
  class?: string
}

const Chart: FC<ChartProps> = ({ options, data, class: className }) => {
  const { ref } = useChart({ options, data })

  return <div class={className} ref={ref} />
}

export default Chart
