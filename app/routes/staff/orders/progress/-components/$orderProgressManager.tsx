import { type FC, type PropsWithChildren, useEffect, useState } from "hono/jsx"
import { tv } from "tailwind-variants"
import Trash2Icon from "../../../../../components/icons/lucide/trash2Icon"
import type Order from "../../../../../domain/order/entities/order"

const sectionTv = tv({
  base: "flex flex-col rounded border p-4",
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
      pending: "bg-danger-subtle text-danger-fg",
      processing: "bg-warning-subtle text-warning-fg",
      completed: "bg-success-subtle text-success-fg",
      cancelled: "bg-info-subtle text-info-subtle-fg",
    },
  },
  defaultVariants: { status: "pending" },
})

const headerRowTv = tv({ base: "my-2 flex items-center justify-between px-2" })

const statusTextTv = tv({
  base: "font-semibold",
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
  base: "max-h-[48vh] flex-1 space-y-3 overflow-y-auto bg-muted p-2",
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

const itemRowTv = tv({
  base: "flex items-center justify-between rounded border border-border/50 bg-muted p-2 text-sm",
})

const labelTv = tv({
  base: "font-semibold text-overlay-fg text-sm",
})

const btnTv = tv({
  base: "flex h-8 w-28 flex-1 items-center justify-center gap-2 rounded-md border bg-bg px-2 py-1 font-medium text-sm transition",
  variants: {
    status: {
      pending:
        "border-danger-subtle bg-danger-subtle text-danger-subtle-fg hover:bg-danger-subtle/80 hover:text-danger-subtle-fg/80",
      processing:
        "border-warning-subtle bg-warning-subtle text-warning-subtle-fg hover:bg-warning-subtle/80 hover:text-warning-subtle-fg/80",
      completed:
        "border-success-subtle bg-success-subtle text-success-subtle-fg hover:bg-success-subtle/80 hover:text-success-subtle-fg/80",
      cancelled:
        "w-36 border-info-subtle bg-info-subtle text-info-subtle-fg hover:bg-info-subtle/80 hover:text-info-subtle-fg/80",
    },
    disabled: {
      true: "cursor-not-allowed opacity-50",
      false: "cursor-pointer",
    },
  },
  defaultVariants: { status: "pending", disabled: false },
})

type Props = {
  orders: Order[]
}

const statusLabel: Record<Order["status"], string> = {
  pending: "処理待ち",
  processing: "処理中",
  completed: "完了",
  cancelled: "取り消し済",
}

const ElapsedTime: FC<{ iso: string }> = ({ iso }) => {
  const [text, setText] = useState("--:--")
  useEffect(() => {
    let mounted = true
    function update() {
      const now = Date.now()
      const diff = Math.max(0, now - Date.parse(iso))
      const totalSec = Math.floor(diff / 1000)
      const hours = Math.floor(totalSec / 3600)
      const mins = Math.floor((totalSec % 3600) / 60)
      const secs = totalSec % 60
      const pad = (n: number) => String(n).padStart(2, "0")
      let s: string = ""
      if (hours > 0) s = `${hours}:${pad(mins)}:${pad(secs)}`
      else s = `${pad(mins)}:${pad(secs)}`
      if (mounted) setText(s)
    }
    update()
    const id = setInterval(update, 1000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [iso])
  return <span className="ml-2 text-muted-fg text-sm">{text}</span>
}

const Card: FC<{ order: Order }> = ({ order }) => {
  const created = new Date(order.createdAt)
  const createdIso = created.toISOString()
  const createdLabel = created.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

  const nextStatus = (s: Order["status"]) =>
    s === "pending"
      ? "processing"
      : s === "processing"
        ? "completed"
        : "completed"
  const prevStatus = (s: Order["status"]) =>
    s === "completed"
      ? "processing"
      : s === "processing"
        ? "pending"
        : "pending"

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
        <div className="text-base">
          <span className="font-semibold text-overlay-fg">#{order.id}</span>
        </div>
        <div className="flex items-center">
          <ElapsedTime iso={createdIso} />
        </div>
      </div>
      <div className="mb-2 space-y-1">
        <div className={metaLineTv()}>注文日時 {createdLabel}</div>
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
                処理中に移動
              </FormAction>
              <FormAction
                orderId={order.id}
                toStatus={"pending"}
                btnStatus={"pending"}
              >
                処理待ちに移動
              </FormAction>
            </div>
          ) : order.status !== "pending" ? (
            <FormAction
              orderId={order.id}
              toStatus={prevStatus(order.status)}
              btnStatus={prevStatus(order.status)}
              disabled={isPrevDisabled}
            >
              {prevStatus(order.status) === "processing"
                ? "処理中に移動"
                : "処理待ちに移動"}
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
              {nextStatus(order.status) === "processing"
                ? "処理中に移動"
                : "完了に移動"}
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
              <Trash2Icon />
            </div>
            <span>注文を取り消す</span>
          </FormAction>
        </div>
      )}
    </div>
  )
}

const OrderProgressManager: FC<Props> = ({ orders }) => {
  const pending = orders.filter((o) => o.status === "pending")
  const processing = orders.filter((o) => o.status === "processing")
  const completed = orders.filter((o) => o.status === "completed")
  const cancelled = orders.filter((o) => o.status === "cancelled")
  type ColumnStatus = "pending" | "processing" | "completed" | "cancelled"
  const Column: FC<{
    status: ColumnStatus
    items: Order[]
  }> = ({ status, items }) => (
    <section className={sectionTv({ status })}>
      <div className={bandTv({ status })} />
      <div className={headerRowTv()}>
        <div className={statusTextTv({ status })}>{statusLabel[status]}</div>
        <div className={headerBadgeTv({ status })}>{items.length}</div>
      </div>

      <div className={innerScrollTv()}>
        {items.map((o) => (
          <Card key={String(o.id)} order={o} />
        ))}
      </div>
    </section>
  )

  return (
    <div>
      <div className="-mx-2 overflow-auto rounded border border-border/50 bg-muted p-2">
        <div className="flex w-max gap-4">
          <Column status="pending" items={pending} />
          <Column status="processing" items={processing} />
          <Column status="completed" items={completed} />
          <Column status="cancelled" items={cancelled} />
        </div>
      </div>
    </div>
  )
}

export default OrderProgressManager
