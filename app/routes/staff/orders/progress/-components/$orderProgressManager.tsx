import {
  type FC,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "hono/jsx"
import { tv } from "tailwind-variants"
import ChefHatIcon from "../../../../../components/icons/lucide/chefHatIcon"
import ChevronLeftIcon from "../../../../../components/icons/lucide/chevronLeftIcon"
import ChevronRightIcon from "../../../../../components/icons/lucide/chevronRightIcon"
import CircleCheckIcon from "../../../../../components/icons/lucide/circleCheckIcon"
import CircleXIcon from "../../../../../components/icons/lucide/circleXIcon"
import RotateCwIcon from "../../../../../components/icons/lucide/rotateCwIcon"
import ShoppingCartIcon from "../../../../../components/icons/lucide/shoppingCartIcon"
import TimerIcon from "../../../../../components/icons/lucide/timerIcon"
import Button from "../../../../../components/ui/button"
import type Order from "../../../../../domain/order/entities/order"
import { createHonoClient } from "../../../../../helpers/api/hono-client"
import { formatDateTimeJP } from "../../../../../utils/date"
import OrderStatusBadge from "../../-components/orderStatusBadge"

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
      responsive: "w-72 md:w-80",
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

const headerRowTv = tv({ base: "my-2 flex items-center justify-between px-2" })

const headerTitleTv = tv({
  base: "flex items-center gap-2 font-semibold",
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
  base: "font-semibold text-overlay-fg text-sm",
})

const btnTv = tv({
  base: "flex h-8 min-w-24 items-center justify-center gap-1 whitespace-nowrap rounded-md border bg-bg px-2 py-1 font-medium text-xs transition",
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
  },
  defaultVariants: { status: "pending", disabled: false, fixed: true },
})

const statusLabel: Record<Order["status"], string> = {
  pending: "処理待ち",
  processing: "処理中",
  completed: "完了",
  cancelled: "取消済",
}

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

const Card: FC<{ order: Order }> = ({ order }) => {
  const created = new Date(order.createdAt)
  const createdIso = created.toISOString()
  const createdLabel = formatDateTimeJP(created)

  const updated = new Date(order.updatedAt)
  const updatedLabel = formatDateTimeJP(updated)

  const nextStatus = (s: Order["status"]): Order["status"] =>
    s === "processing" ? "completed" : "processing"
  const prevStatus = (s: Order["status"]): Order["status"] =>
    s === "completed" ? "processing" : "pending"

  const isPrevDisabled = order.status === "pending"
  const isNextDisabled = order.status === "completed"

  const FormAction: FC<
    PropsWithChildren<{
      orderId: number
      toStatus: Order["status"]
      btnStatus?: Order["status"]
      disabled?: boolean
    }>
  > = ({ orderId, toStatus, btnStatus, disabled, children }) => (
    <form method="post" className="mt-0">
      <input type="hidden" name="orderId" value={String(orderId)} />
      <input type="hidden" name="status" value={toStatus} />
      <button
        type="submit"
        className={btnTv({
          status: btnStatus ?? toStatus,
          disabled: !!disabled,
          fixed: btnStatus !== "cancelled" && toStatus !== "cancelled",
        })}
        disabled={!!disabled}
      >
        {children}
      </button>
    </form>
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

      <div className="flex items-center">
        <div className="flex-1">
          {order.status === "completed" || order.status === "cancelled" ? (
            <div className="flex gap-2">
              <FormAction
                orderId={order.id}
                toStatus={"processing"}
                btnStatus={"processing"}
              >
                <span className="flex w-full items-center justify-between">
                  <div className="h-4 w-4">
                    <ChevronLeftIcon />
                  </div>
                  <span className="flex-1 text-center">処理中に移動</span>
                </span>
              </FormAction>
              <FormAction
                orderId={order.id}
                toStatus={"pending"}
                btnStatus={"pending"}
              >
                <span className="flex w-full items-center justify-between">
                  <div className="h-4 w-4">
                    <ChevronLeftIcon />
                  </div>
                  <span className="flex-1 text-center">処理待ちに移動</span>
                </span>
              </FormAction>
            </div>
          ) : order.status !== "pending" ? (
            <FormAction
              orderId={order.id}
              toStatus={prevStatus(order.status)}
              btnStatus={prevStatus(order.status)}
              disabled={isPrevDisabled}
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
                  <span className="flex-1 text-center">処理待ちに移動</span>
                </span>
              )}
            </FormAction>
          ) : null}
        </div>

        <div>
          {order.status !== "completed" && order.status !== "cancelled" ? (
            <FormAction
              orderId={order.id}
              toStatus={nextStatus(order.status)}
              btnStatus={nextStatus(order.status)}
              disabled={isNextDisabled}
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
            </FormAction>
          ) : null}
        </div>
      </div>
      {(order.status === "pending" || order.status === "processing") && (
        <div className="mt-3 flex justify-center">
          <FormAction
            orderId={order.id}
            toStatus={"cancelled"}
            btnStatus={"cancelled"}
          >
            <div className="h-4 w-4">
              <CircleXIcon />
            </div>
            <span>注文を取り消す</span>
          </FormAction>
        </div>
      )}
    </div>
  )
}

type ColumnStatus = "pending" | "processing" | "completed" | "cancelled"

const Countdown: FC<{
  refreshInterval: number
  fetchRef: { current: (() => Promise<void>) | null | undefined }
  resetSignal: number
}> = ({ refreshInterval, fetchRef, resetSignal }) => {
  const [seconds, setSeconds] = useState(refreshInterval)

  useEffect(() => {
    setSeconds(refreshInterval)
  }, [resetSignal, refreshInterval])

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          fetchRef?.current?.()
          return refreshInterval
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [refreshInterval, fetchRef])

  return <span className="font-mono">{seconds}</span>
}

const Column: FC<{
  status: ColumnStatus
  items: Order[]
}> = ({ status, items }) => {
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
        <div className="flex items-center gap-2">
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
          <Card key={String(o.id)} order={o} />
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
  const REFRESH_INTERVAL = 30
  const [fetchSignal, setFetchSignal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const honoClient = createHonoClient()
      const response = await honoClient["order-progress-manager"].$get()
      if (!response.ok) {
        throw new Error(
          `Failed to fetch orders: ${response.status} ${response.statusText}`,
        )
      }
      const {
        pendingOrders: fetchedPending,
        processingOrders: fetchedProcessing,
        completedOrders: fetchedCompleted,
        cancelledOrders: fetchedCancelled,
      } = await response.json()

      setPendingOrders(
        fetchedPending.map((order) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        })),
      )
      setProcessingOrders(
        fetchedProcessing.map((order) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        })),
      )
      setCompletedOrders(
        fetchedCompleted.map((order) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        })),
      )
      setCancelledOrders(
        fetchedCancelled.map((order) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setFetchSignal((s) => s + 1)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchDataRef = useRef(fetchData)
  useEffect(() => {
    fetchDataRef.current = fetchData
  }, [fetchData])

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-lg">注文進捗</h2>
        <div className="flex items-center gap-2">
          <div className="text-muted-fg text-xs">
            自動更新まであと
            <Countdown
              refreshInterval={REFRESH_INTERVAL}
              fetchRef={fetchDataRef}
              resetSignal={fetchSignal}
            />
            秒
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={fetchData}
            ariaLabel="注文一覧を更新する"
          >
            <div class="size-4">
              <RotateCwIcon />
            </div>
            <span>注文一覧を更新する</span>
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded border border-border/50 bg-muted p-2">
        {error ? (
          <div className="items-center justify-center text-center text-muted-fg">
            注文一覧の取得に失敗しました。しばらくしてから再試行してください。
          </div>
        ) : (
          <div className="flex h-full min-h-0 w-max gap-4">
            <Column status="pending" items={pendingOrders} />
            <Column status="processing" items={processingOrders} />
            <Column status="completed" items={completedOrders} />
            <Column status="cancelled" items={cancelledOrders} />
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderProgressManager
