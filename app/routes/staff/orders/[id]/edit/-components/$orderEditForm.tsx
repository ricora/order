import type { FC } from "hono/jsx"
import { useState } from "hono/jsx"
import type Order from "../../../../../../domain/order/entities/order"
import ChevronLeftIcon from "../../../../../-components/icons/lucide/chevronLeftIcon"
import SendIcon from "../../../../../-components/icons/lucide/sendIcon"
import GraphemeInput from "../../../../../-components/ui/$graphemeInput"
import GraphemeTextarea from "../../../../../-components/ui/$graphemeTextarea"
import Button from "../../../../../-components/ui/button"
import Label from "../../../../../-components/ui/label"
import LinkButton from "../../../../../-components/ui/linkButton"
import Select from "../../../../../-components/ui/select"

type Props = {
  initialValues: Order
}

const OrderEditForm: FC<Props> = ({ initialValues }) => {
  const [customerName, setCustomerName] = useState<string>(
    initialValues.customerName ?? "",
  )
  const [comment, setComment] = useState<string>(initialValues.comment ?? "")
  return (
    <div className="grid grid-cols-1 gap-6">
      <section>
        <div>
          <form method="post" id="order-edit-form" className="space-y-4">
            <input type="hidden" name="id" value={String(initialValues.id)} />
            <div>
              <Label htmlFor="customerName">顧客名</Label>
              <GraphemeInput
                id="customerName"
                name="customerName"
                value={customerName}
                maxLength={50}
                onChange={(v: string) => setCustomerName(v)}
                placeholder="顧客名"
              />
            </div>
            <div>
              <Label htmlFor="comment">備考欄</Label>
              <GraphemeTextarea
                id="comment"
                name="comment"
                value={comment}
                onChange={setComment}
                maxLength={250}
                placeholder="注文に関する備考のコメントを入力"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="status" required>
                ステータス
              </Label>
              <Select
                id="status"
                name="status"
                options={[
                  {
                    value: "pending",
                    label: "処理待ち",
                    selected: initialValues.status === "pending",
                  },
                  {
                    value: "processing",
                    label: "処理中",
                    selected: initialValues.status === "processing",
                  },
                  {
                    value: "completed",
                    label: "完了",
                    selected: initialValues.status === "completed",
                  },
                  {
                    value: "cancelled",
                    label: "取消済",
                    selected: initialValues.status === "cancelled",
                  },
                ]}
              />
            </div>
            <div class="mt-6 flex flex-col-reverse items-center justify-between gap-2 sm:flex-row">
              <div class="w-full sm:w-auto">
                <LinkButton href="/staff/orders" leftIcon={ChevronLeftIcon}>
                  注文一覧に戻る
                </LinkButton>
              </div>
              <div class="w-full sm:w-auto">
                <div>
                  <Button type="submit" leftIcon={SendIcon}>
                    更新する
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

export default OrderEditForm
