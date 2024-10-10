import { Box, Button, Input, Stack, Text } from "@chakra-ui/react";
import { ActionFunction, ActionFunctionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { FC, memo } from "react";
import { deleteAllDetails } from "~/crud/crud_details";
import { deleteAllOrders, updateOrderStatus } from "~/crud/crud_orders";

type Props = {
  orderId: number;
  productNames: string[];
  status: string;
  quantities: number[];
  tableNumber: number;
};

export const OrderCard: FC<Props> = memo((props) => {
  const { orderId, productNames, status, quantities, tableNumber } = props;

  return (
    <Box
      w="300px"
      h="300px"
      bg="white"
      borderRadius="10px"
      shadow="md"
      p={4}
      overflowY="auto"
    >
      <h1>{orderId}</h1>
      <Stack textAlign={"center"}>
        {productNames.map((name, index) => (
          <Text key={index}>
            {name}--数量：{quantities[index]}
          </Text>
        ))}
        <Text>-------------------------</Text>
        <Text>テーブル番号：{tableNumber}</Text>
        <Text>ステータス：{status}</Text>
        {status === "accept" ? (
          <Form method="post">
            <Input type="hidden" name="order_id" value={orderId} />
            <Input type="hidden" name="status" value="cooking" />
            <Input type="hidden" name="_method" value="update" />
            <Button type="submit" colorScheme="blue">
              start cook
            </Button>
          </Form>
        ) : status === "cooking" ? (
          <Form method="post">
            <Input type="hidden" name="order_id" value={orderId} />
            <Input type="hidden" name="status" value="serve" />
            <Input type="hidden" name="_method" value="update" />
            <Button type="submit" colorScheme="yellow">
              finish cook
            </Button>
          </Form>
        ) : (
          <Form method="post">
            <Input type="hidden" name="order_id" value={orderId} />
            <Input type="hidden" name="status" value="finish" />
            <Input type="hidden" name="_method" value="update" />
            <Button type="submit" colorScheme="red">
              complete
            </Button>
          </Form>
        )}
      </Stack>
    </Box>
  );
});
