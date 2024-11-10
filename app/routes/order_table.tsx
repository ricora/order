import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
} from "@chakra-ui/react"
import { json, useLoaderData } from "@remix-run/react"
import { readDetail } from "~/crud/crud_details"
import { readOrder } from "~/crud/crud_orders"
import { readProduct } from "~/crud/crud_products"
import { useKitchenData } from "~/hooks/useKitchenData"
import { TypeDetail } from "~/type/typedetail"
import { TypeOrder } from "~/type/typeorder"
import { TypeProduct } from "~/type/typeproduct"

export default function OrderTable() {
  const data = useLoaderData<{
    orders: TypeOrder[]
    details: TypeDetail[]
    products: TypeProduct[]
  }>()

  const { orders, details, products } = useKitchenData(
    data.orders,
    data.details,
    data.products,
  )

  return (
    <Box p={4} bg={"white"}>
      <TableContainer>
        <Table variant="striped" colorScheme="gray">
          <TableCaption>注文履歴一覧</TableCaption>
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>テーブル番号</Th>
              <Th>注文内容</Th>
              <Th>ステータス</Th>
            </Tr>
          </Thead>
          <Tbody>
            {orders.map((order) => {
              const filteredDetails = details.filter(
                (detail) => detail.order_id === order.order_id,
              )
              const productIds = filteredDetails.map(
                (detail) => detail.product_id,
              )
              const filteredProducts = products.filter((product) =>
                productIds.includes(product.product_id),
              )
              const productNames = filteredProducts.map(
                (product) => product.product_name,
              )
              const quantities = filteredDetails.map(
                (detail) => detail.quantity,
              )

              return (
                <Tr key={order.order_id}>
                  <Td>{order.order_id}</Td>
                  <Td>{order.table_number}</Td>
                  <Td>
                    {productNames.map((name, index) => (
                      <div key={index}>
                        {name}--数量：{quantities[index]}
                      </div>
                    ))}
                  </Td>
                  <Td>{order.status}</Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
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