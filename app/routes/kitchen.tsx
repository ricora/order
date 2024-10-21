import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  useDisclosure,
  Wrap,
  WrapItem,
} from "@chakra-ui/react"
import { ActionFunction, ActionFunctionArgs } from "@remix-run/node"
import { Form, json, useLoaderData } from "@remix-run/react"
import { OrderCard } from "~/components/organisms/kitchen/OrderCard"
import { deleteAllDetails, readDetail } from "~/crud/crud_details"
import {
  deleteAllOrders,
  readOrder,
  updateOrderStatus,
} from "~/crud/crud_orders"
import { readProduct } from "~/crud/crud_products"
import { useKitchenData } from "~/hooks/useKitchenData"
import { TypeDetail } from "~/type/typedetail"
import { TypeOrder } from "~/type/typeorder"
import { TypeProduct } from "~/type/typeproduct"

export default function Kitchen() {
  const initialData = useLoaderData<{
    orders: TypeOrder[]
    details: TypeDetail[]
    products: TypeProduct[]
  }>()

  const { isOpen, onOpen, onClose } = useDisclosure()

  const { orders, details, products } = useKitchenData(
    initialData.orders,
    initialData.details,
    initialData.products,
  )

  const filteredOrders = orders.filter((order) => order.status !== "finish")

  return (
    <>
      <Button
        colorScheme="red"
        onClick={onOpen}
        position="relative"
        top="-2"
        right="-850"
        mb="4"
      >
        すべて削除
      </Button>
      <Wrap>
        {filteredOrders.map((order) => {
          const filteredDetails = details.filter(
            (detail) => detail.order_id === order.order_id,
          )
          const productIds = filteredDetails.map((detail) => detail.product_id)
          const filteredProducts = products.filter((product) =>
            productIds.includes(product.product_id),
          )
          const productNames = filteredProducts.map(
            (product) => product.product_name,
          )
          const quantities = filteredDetails.map((detail) => detail.quantity)

          return (
            <WrapItem key={order.order_id} mx="auto">
              <OrderCard
                orderId={order.order_id}
                productNames={productNames}
                quantities={quantities}
                tableNumber={order.table_number}
                status={order.status}
              />
            </WrapItem>
          )
        })}
      </Wrap>

      <Modal isOpen={isOpen} onClose={onClose} motionPreset="slideInBottom">
        <ModalOverlay />
        <ModalContent pb={2}>
          <ModalBody mx={4}>
            <p>本当にすべて削除しますか？</p>
            <br />
            <Form method="post">
              <Input type="hidden" name="_method" value="delete_all" />
              <Button w="100%" type="submit">
                はい
              </Button>
            </Form>
            <Button w="100%" onClick={onClose}>
              いいえ
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export const loader = async () => {
  const response_orders = await readOrder()
  const response_details = await readDetail()
  const response_products = await readProduct()
  return json({
    orders: response_orders,
    details: response_details,
    products: response_products,
  })
}

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData()
  const method = formData.get("_method")

  if (method === "update") {
    const order_id = Number(formData.get("order_id"))
    const status = formData.get("status")

    if (status === "cooking") {
      updateOrderStatus(order_id, "cooking")
    } else if (status === "serve") {
      updateOrderStatus(order_id, "serve")
    } else if (status === "finish") {
      updateOrderStatus(order_id, "finish")
    }

    return { success: true }
  } else if (method === "delete_all") {
    deleteAllDetails()
    deleteAllOrders()

    return { success: true }
  } else {
    return { success: false }
  }
}
