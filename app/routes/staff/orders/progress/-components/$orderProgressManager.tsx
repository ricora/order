import {
  type FC,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "hono/jsx"
import { tv } from "tailwind-variants"
import type { Order } from "../../../../../domain/order/entities"
import { formatDateTimeJP } from "../../../../../utils/date"
import ChefHatIcon from "../../../../-components/icons/lucide/chefHatIcon"
import ChevronLeftIcon from "../../../../-components/icons/lucide/chevronLeftIcon"
import ChevronRightIcon from "../../../../-components/icons/lucide/chevronRightIcon"
import CircleCheckIcon from "../../../../-components/icons/lucide/circleCheckIcon"
import CircleXIcon from "../../../../-components/icons/lucide/circleXIcon"
import RotateCwIcon from "../../../../-components/icons/lucide/rotateCwIcon"
import ShoppingCartIcon from "../../../../-components/icons/lucide/shoppingCartIcon"
import TimerIcon from "../../../../-components/icons/lucide/timerIcon"
import Button from "../../../../-components/ui/button"
import { createHonoClient } from "../../../../-helpers/api/hono-client"
import { showToast } from "../../../../-helpers/ui/client-toast"
import OrderStatusBadge from "../../-components/orderStatusBadge"

type RawOrder = Omit<Order, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

const sectionTv = tv({
  base: "flex min-h-0 flex-col rounded border p-4",
  variants: {
    status: {
      pending: "border-danger-subtle bg-danger-subtle",
      processing: "border-warning-subtle bg-warning-subtle",
      completed: "border-success-subtle bg-success-subtle",
      cancelled: "border-info-subtle bg-info-subtle",
    },
    width: {
      responsive: "w-68 sm:w-72 md:w-80",
    },
  },
  defaultVariants: { status: "pending", width: "responsive" },
})

const bandTv = tv({
  base: "-mx-4 -mt-4 h-2 rounded-t",
  variants: {
    status: {
      pending: "bg-danger-subtle",
      processing: "bg-warning-subtle",
      completed: "bg-success-subtle",
      cancelled: "bg-info-subtle",
    },
  },
  defaultVariants: { status: "pending" },
})

const headerRowTv = tv({ base: "my-2 flex items-center justify-between" })

const headerTitleTv = tv({
  base: "flex items-center gap-1 font-semibold text-sm",
  variants: {
    status: {
      pending: "text-danger-subtle-fg",
      processing: "text-warning-subtle-fg",
      completed: "text-success-subtle-fg",
      cancelled: "text-info-subtle-fg",
    },
  },
  defaultVariants: { status: "pending" },
})

const innerScrollTv = tv({
  base: "min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted p-2",
})

const cardTv = tv({
  base: "rounded border bg-bg p-2",
})

const cardHeaderTv = tv({
  base: "mb-1 flex items-center justify-between",
})

const metaLineTv = tv({
  base: "text-muted-fg text-xs",
})

const headerBadgeTv = tv({
  base: "rounded-full bg-overlay px-2 py-0.5 font-bold text-sm",
  variants: {
    status: {
      pending: "text-danger-subtle-fg",
      processing: "text-warning-subtle-fg",
      completed: "text-success-subtle-fg",
      cancelled: "text-info-subtle-fg",
    },
  },
  defaultVariants: { status: "pending" },
})

const headerNoticeTv = tv({
  base: "text-xs",
  variants: {
    status: {
      completed: "text-success-subtle-fg",
      cancelled: "text-info-subtle-fg",
    },
  },
})

const itemRowTv = tv({
  base: "flex items-center justify-between rounded border border-border/50 bg-muted p-2 text-sm",
})

const labelTv = tv({
  base: "font-semibold text-sm",
})

const btnTv = tv({
  base: "flex h-8 min-w-24 items-center justify-center gap-1 whitespace-nowrap rounded-md border bg-bg px-2 py-1 font-medium text-[0.65rem] transition",
  variants: {
    fixed: {
      true: "w-28",
      false: "",
    },
    status: {
      pending:
        "border-danger-subtle bg-danger-subtle text-danger-subtle-fg hover:bg-danger-subtle/80 hover:text-danger-subtle-fg/80",
      processing:
        "border-warning-subtle bg-warning-subtle text-warning-subtle-fg hover:bg-warning-subtle/80 hover:text-warning-subtle-fg/80",
      completed:
        "border-success-subtle bg-success-subtle text-success-subtle-fg hover:bg-success-subtle/80 hover:text-success-subtle-fg/80",
      cancelled:
        "min-w-28 border-info-subtle bg-info-subtle text-info-subtle-fg hover:bg-info-subtle/80 hover:text-info-subtle-fg/80",
    },
    disabled: {
      true: "cursor-not-allowed opacity-50",
      false: "cursor-pointer",
    },
    width: {
      responsive: "w-full sm:w-auto",
    },
  },
  defaultVariants: {
    status: "pending",
    disabled: false,
    fixed: true,
    width: "responsive",
  },
})

const statusLabel: Record<Order["status"], string> = {
  pending: "処理待ち",
  processing: "処理中",
  completed: "完了",
  cancelled: "取消済",
}

const REFRESH_INTERVAL_MS = 10_000
const FETCH_COOLDOWN_MS = 1_000

const ElapsedTime: FC<{ iso: string }> = ({ iso }) => {
  const [text, setText] = useState("--:--")
  useEffect(() => {
    let mounted = true
    const update = () => {
      const now = Date.now()
      const diff = Math.max(0, now - Date.parse(iso))
      const totalSec = Math.floor(diff / 1000)
      const hours = Math.floor(totalSec / 3600)
      const mins = Math.floor((totalSec % 3600) / 60)
      const secs = totalSec % 60
      const pad = (n: number) => String(n).padStart(2, "0")
      const s =
        hours > 0
          ? `${hours}:${pad(mins)}:${pad(secs)}`
          : `${pad(mins)}:${pad(secs)}`
      if (mounted) setText(s)
    }
    update()
    const id = setInterval(update, 1000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [iso])
  return (
    <span className="flex items-center gap-1">
      <div className="h-4 w-4 text-muted-fg">
        <TimerIcon />
      </div>
      <span className="text-muted-fg text-sm">{text}</span>
    </span>
  )
}

const Card: FC<{
  order: Order
  onStatusChange?: (
    opts?: {
      suppressToastsForIds?: number[]
    },
    responseData?: {
      pendingOrders: Order[]
      processingOrders: Order[]
      completedOrders: Order[]
      cancelledOrders: Order[]
    },
  ) => Promise<void> | void
}> = ({ order, onStatusChange }) => {
  const created = new Date(order.createdAt)
  const createdIso = created.toISOString()
  const createdLabel = formatDateTimeJP(created)

  const updated = new Date(order.updatedAt)
  const updatedLabel = formatDateTimeJP(updated)

  const nextStatus = (s: Order["status"]): Order["status"] =>
    s === "processing" ? "completed" : "processing"
  const prevStatus = (s: Order["status"]): Order["status"] =>
    s === "completed" ? "processing" : "pending"

  const [loadingToStatus, setLoadingToStatus] = useState<
    Order["status"] | null
  >(null)

  const handleStatusChange = async (toStatus: Order["status"]) => {
    try {
      const honoClient = createHonoClient()
      const response = await honoClient["order-progress-manager"][
        "set-status"
      ].$post({
        json: { orderId: order.id, status: toStatus },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      const responseData = await response.json()
      const mappedResponseData = {
        pendingOrders: responseData.pendingOrders.map((o: RawOrder) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt),
        })),
        processingOrders: responseData.processingOrders.map((o: RawOrder) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt),
        })),
        completedOrders: responseData.completedOrders.map((o: RawOrder) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt),
        })),
        cancelledOrders: responseData.cancelledOrders.map((o: RawOrder) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt),
        })),
      }
      if (onStatusChange)
        await onStatusChange(
          { suppressToastsForIds: [order.id] },
          mappedResponseData,
        )
      showToast(
        "success",
        `注文#${order.id}を「${statusLabel[toStatus]}」に更新しました。`,
      )
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      showToast("error", `注文#${order.id}を更新できませんでした: ${msg}`)
    }
  }

  const ActionButton: FC<
    PropsWithChildren<{
      toStatus: Order["status"]
      btnStatus?: Order["status"]
      disabled?: boolean
    }>
  > = ({ toStatus, btnStatus, disabled, children }) => (
    <button
      type="button"
      onClick={async () => {
        if (loadingToStatus === toStatus || disabled) return
        setLoadingToStatus(toStatus)
        try {
          await handleStatusChange(toStatus)
        } finally {
          setLoadingToStatus(null)
        }
      }}
      className={btnTv({
        status: btnStatus ?? toStatus,
        disabled: !!disabled || loadingToStatus === toStatus,
        fixed: btnStatus !== "cancelled" && toStatus !== "cancelled",
      })}
      disabled={!!disabled || loadingToStatus === toStatus}
    >
      {children}
    </button>
  )

  return (
    <div className={cardTv()} data-order-id={String(order.id)}>
      <div className={cardHeaderTv()}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg text-overlay-fg">
            #{order.id}
          </span>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="flex items-center">
          <ElapsedTime iso={createdIso} />
        </div>
      </div>
      <div className="mb-2 space-y-1">
        <div className={metaLineTv()}>登録日時 {createdLabel}</div>
        <div className={metaLineTv()}>更新日時 {updatedLabel}</div>
        <div className={metaLineTv()}>顧客名 {order.customerName ?? "-"}</div>
      </div>

      {order.comment && (
        <div className="mb-3">
          <div className="mb-2">
            <div className={labelTv()}>コメント</div>
          </div>
          <div className="rounded border border-border bg-overlay p-1.5">
            <p className="break-word mt-0.5 whitespace-pre-wrap text-overlay-fg text-xs">
              {order.comment}
            </p>
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="mb-2">
          <div className={labelTv()}>注文内容</div>
        </div>
        <div className="space-y-1">
          {order.orderItems.map((it, idx) => (
            <div key={`${order.id}-${idx}`} className={itemRowTv()}>
              <div className="min-w-0">
                <div className="truncate font-medium">{it.productName}</div>
              </div>
              <div className="ml-4 text-sm">×{it.quantity}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
        {loadingToStatus ? (
          <div className="flex w-full items-center justify-center">
            <span className="text-muted-fg text-sm">更新中…</span>
          </div>
        ) : (
          <>
            <div className="flex w-full flex-col gap-2 sm:flex-1">
              {order.status === "completed" || order.status === "cancelled" ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <ActionButton toStatus="processing" btnStatus="processing">
                    <span className="flex w-full items-center justify-between">
                      <div className="h-4 w-4">
                        <ChevronLeftIcon />
                      </div>
                      <span className="flex-1 text-center">処理中に移動</span>
                    </span>
                  </ActionButton>
                  <ActionButton toStatus="pending" btnStatus="pending">
                    <span className="flex w-full items-center justify-between">
                      <div className="h-4 w-4">
                        <ChevronLeftIcon />
                      </div>
                      <span className="flex-1 text-center">処理待ちに移動</span>
                    </span>
                  </ActionButton>
                </div>
              ) : order.status !== "pending" ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <ActionButton
                    toStatus={prevStatus(order.status)}
                    btnStatus={prevStatus(order.status)}
                  >
                    {prevStatus(order.status) === "processing" ? (
                      <span className="flex w-full items-center justify-between">
                        <div className="h-4 w-4">
                          <ChevronLeftIcon />
                        </div>
                        <span className="flex-1 text-center">処理中に移動</span>
                      </span>
                    ) : (
                      <span className="flex w-full items-center justify-between">
                        <div className="h-4 w-4">
                          <ChevronLeftIcon />
                        </div>
                        <span className="flex-1 text-center">
                          処理待ちに移動
                        </span>
                      </span>
                    )}
                  </ActionButton>
                </div>
              ) : null}
            </div>

            <div className="flex w-full justify-start sm:w-auto sm:justify-end">
              {order.status !== "completed" && order.status !== "cancelled" ? (
                <ActionButton
                  toStatus={nextStatus(order.status)}
                  btnStatus={nextStatus(order.status)}
                >
                  {nextStatus(order.status) === "processing" ? (
                    <span className="flex w-full items-center justify-between">
                      <span className="flex-1 text-center">処理中に移動</span>
                      <div className="h-4 w-4">
                        <ChevronRightIcon />
                      </div>
                    </span>
                  ) : (
                    <span className="flex w-full items-center justify-between">
                      <span className="flex-1 text-center">完了に移動</span>
                      <div className="h-4 w-4">
                        <ChevronRightIcon />
                      </div>
                    </span>
                  )}
                </ActionButton>
              ) : null}
            </div>
          </>
        )}
      </div>
      {!loadingToStatus &&
        (order.status === "pending" || order.status === "processing") && (
          <div className="mt-3 flex justify-center">
            <ActionButton toStatus="cancelled" btnStatus="cancelled">
              <div className="h-4 w-4">
                <CircleXIcon />
              </div>
              <span>注文を取り消す</span>
            </ActionButton>
          </div>
        )}
    </div>
  )
}

type ColumnStatus = "pending" | "processing" | "completed" | "cancelled"

const Countdown: FC<{
  refreshIntervalMs: number
  fetchRef: {
    current:
      | ((
          opts?: { suppressToastsForIds?: number[] },
          responseData?: {
            pendingOrders: Order[]
            processingOrders: Order[]
            completedOrders: Order[]
            cancelledOrders: Order[]
          },
        ) => Promise<void>)
      | null
      | undefined
  }
  resetSignal: number
}> = ({ refreshIntervalMs, fetchRef, resetSignal }) => {
  const [seconds, setSeconds] = useState(Math.ceil(refreshIntervalMs / 1000))

  useEffect(() => {
    setSeconds(Math.ceil(refreshIntervalMs / 1000))
  }, [resetSignal, refreshIntervalMs])

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          fetchRef?.current?.()
          return Math.ceil(refreshIntervalMs / 1000)
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [refreshIntervalMs, fetchRef])

  return <span className="font-mono">{seconds}</span>
}

const Column: FC<{
  status: ColumnStatus
  items: Order[]
  onOrderUpdate?: (
    opts?: {
      suppressToastsForIds?: number[]
    },
    responseData?: {
      pendingOrders: Order[]
      processingOrders: Order[]
      completedOrders: Order[]
      cancelledOrders: Order[]
    },
  ) => Promise<void> | void
}> = ({ status, items, onOrderUpdate }) => {
  const statusIcons: Record<ColumnStatus, FC> = {
    pending: ShoppingCartIcon,
    processing: ChefHatIcon,
    completed: CircleCheckIcon,
    cancelled: CircleXIcon,
  }
  const Icon = statusIcons[status]

  return (
    <section className={sectionTv({ status })}>
      <div className={bandTv({ status })} />
      <div className={headerRowTv()}>
        <div className={headerTitleTv({ status })}>
          <div className="size-5">
            <Icon />
          </div>
          <span>{statusLabel[status]}</span>
        </div>
        <div className="flex items-center gap-1">
          {(status === "completed" || status === "cancelled") && (
            <div className={headerNoticeTv({ status })}>
              直近の注文のみを表示します。
            </div>
          )}
          <div className={headerBadgeTv({ status })}>{items.length}</div>
        </div>
      </div>
      <div className={innerScrollTv()}>
        {items.map((o) => (
          <Card key={String(o.id)} order={o} onStatusChange={onOrderUpdate} />
        ))}
      </div>
    </section>
  )
}

const OrderProgressManager: FC = () => {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [processingOrders, setProcessingOrders] = useState<Order[]>([])
  const [completedOrders, setCompletedOrders] = useState<Order[]>([])
  const [cancelledOrders, setCancelledOrders] = useState<Order[]>([])
  const [fetchSignal, setFetchSignal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [isFetching, setIsFetching] = useState(false)
  const [isFetchDisabled, setIsFetchDisabled] = useState(false)
  const isFetchingRef = useRef(false)
  const isFetchDisabledRef = useRef(false)
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const prevOrdersRef = useRef<Map<number, Order> | null>(null)
  const hasInitialLoadRef = useRef(false)

  const fetchData = useCallback(
    async (
      opts?: {
        suppressToastsForIds?: number[]
      },
      responseData?: {
        pendingOrders: Order[]
        processingOrders: Order[]
        completedOrders: Order[]
        cancelledOrders: Order[]
      },
    ) => {
      const isLocalUpdate = !!(
        opts?.suppressToastsForIds && opts.suppressToastsForIds.length > 0
      )
      if (
        isFetchingRef.current ||
        (isFetchDisabledRef.current && !isLocalUpdate)
      )
        return
      setIsFetching(true)
      isFetchingRef.current = true
      if (!isLocalUpdate) {
        setIsFetchDisabled(true)
        isFetchDisabledRef.current = true
        if (cooldownTimeoutRef.current) {
          clearTimeout(cooldownTimeoutRef.current)
          cooldownTimeoutRef.current = null
        }
      }
      try {
        setError(null)
        let fetchedData: {
          pendingOrders: Order[]
          processingOrders: Order[]
          completedOrders: Order[]
          cancelledOrders: Order[]
        }

        if (responseData) {
          fetchedData = responseData
        } else {
          const honoClient = createHonoClient()
          const response = await honoClient["order-progress-manager"].$get()
          if (!response.ok) {
            throw new Error(
              `Failed to fetch orders: ${response.status} ${response.statusText}`,
            )
          }
          const jsonData = await response.json()
          fetchedData = {
            pendingOrders: jsonData.pendingOrders.map((order: RawOrder) => ({
              ...order,
              createdAt: new Date(order.createdAt),
              updatedAt: new Date(order.updatedAt),
            })),
            processingOrders: jsonData.processingOrders.map(
              (order: RawOrder) => ({
                ...order,
                createdAt: new Date(order.createdAt),
                updatedAt: new Date(order.updatedAt),
              }),
            ),
            completedOrders: jsonData.completedOrders.map(
              (order: RawOrder) => ({
                ...order,
                createdAt: new Date(order.createdAt),
                updatedAt: new Date(order.updatedAt),
              }),
            ),
            cancelledOrders: jsonData.cancelledOrders.map(
              (order: RawOrder) => ({
                ...order,
                createdAt: new Date(order.createdAt),
                updatedAt: new Date(order.updatedAt),
              }),
            ),
          }
        }

        setPendingOrders(fetchedData.pendingOrders)
        setProcessingOrders(fetchedData.processingOrders)
        setCompletedOrders(fetchedData.completedOrders)
        setCancelledOrders(fetchedData.cancelledOrders)
        const allFetched = [
          ...fetchedData.pendingOrders,
          ...fetchedData.processingOrders,
          ...fetchedData.completedOrders,
          ...fetchedData.cancelledOrders,
        ]
        const fetchedMap = new Map<number, Order>()
        allFetched.forEach((o) => {
          fetchedMap.set(o.id, o)
        })

        if (hasInitialLoadRef.current) {
          const suppressedIds = new Set(opts?.suppressToastsForIds ?? [])
          const prevMap = prevOrdersRef.current ?? new Map<number, Order>()

          for (const [id, order] of fetchedMap.entries()) {
            if (!prevMap.has(id) && !suppressedIds.has(id)) {
              showToast("success", `注文#${order.id}が追加されました。`)
              continue
            }

            const prev = prevMap.get(id)
            if (!prev) continue

            const updatedChanged =
              prev.updatedAt.getTime() !== order.updatedAt.getTime()
            const statusChanged = prev.status !== order.status
            if ((updatedChanged || statusChanged) && !suppressedIds.has(id)) {
              if (statusChanged) {
                showToast(
                  "success",
                  `注文#${order.id}が「${statusLabel[prev.status]}」から「${statusLabel[order.status]}」に更新されました。`,
                )
              } else {
                showToast("success", `注文#${order.id}が更新されました。`)
              }
            }
          }
        }

        prevOrdersRef.current = fetchedMap
        hasInitialLoadRef.current = true
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setFetchSignal((s) => s + 1)
        setIsFetching(false)
        isFetchingRef.current = false
        if (!isLocalUpdate) {
          if (cooldownTimeoutRef.current)
            clearTimeout(cooldownTimeoutRef.current)
          cooldownTimeoutRef.current = setTimeout(() => {
            setIsFetchDisabled(false)
            isFetchDisabledRef.current = false
            cooldownTimeoutRef.current = null
          }, FETCH_COOLDOWN_MS)
        } else {
          setIsFetchDisabled(false)
          isFetchDisabledRef.current = false
        }
      }
    },
    [],
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    return () => {
      if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current)
    }
  }, [])

  const fetchDataRef = useRef(fetchData)
  useEffect(() => {
    fetchDataRef.current = fetchData
  }, [fetchData])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-3 sm:justify-between">
        <h2 className="whitespace-nowrap font-semibold text-lg">注文進捗</h2>
        <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
          <div className="whitespace-nowrap text-muted-fg text-xs">
            自動更新まであと
            <Countdown
              refreshIntervalMs={REFRESH_INTERVAL_MS}
              fetchRef={fetchDataRef}
              resetSignal={fetchSignal}
            />
            秒
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => fetchData()}
            disabled={isFetching || isFetchDisabled}
            ariaLabel="注文一覧を更新する"
          >
            <div class="size-4">
              <RotateCwIcon />
            </div>
            <span className="whitespace-nowrap">注文一覧を更新する</span>
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded border border-border/50 bg-muted">
        <div className="h-full w-full overflow-x-auto p-2">
          {error ? (
            <div className="flex h-full items-center justify-center text-center text-muted-fg">
              注文一覧の取得に失敗しました。しばらくしてから再試行してください。
            </div>
          ) : (
            <div className="flex h-full min-h-0 w-max gap-4">
              <Column
                status="pending"
                items={pendingOrders}
                onOrderUpdate={fetchData}
              />
              <Column
                status="processing"
                items={processingOrders}
                onOrderUpdate={fetchData}
              />
              <Column
                status="completed"
                items={completedOrders}
                onOrderUpdate={fetchData}
              />
              <Column
                status="cancelled"
                items={cancelledOrders}
                onOrderUpdate={fetchData}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderProgressManager
