import { Box, Button, Input, Stack, Text } from "@chakra-ui/react";
import { FC, memo } from "react";
import { TypeProduct } from "~/type/typeproduct";

type Props = {
  product: TypeProduct;
  addOrder: (product: TypeProduct) => void;
  cancelOrder: (product: TypeProduct) => void;
};

export const ReceptionCard: FC<Props> = memo((props) => {
  const { product, addOrder, cancelOrder } = props;

  return (
    <Box w="300px" h="250px" bg="white" borderRadius="10px" shadow="md" p={4}>
      <h1>ID：{product.product_id}</h1>
      <Stack textAlign={"center"}>
        <Text>{product.product_name}</Text>
        <Text>価格：{product.price}</Text>
        <Text>在庫：{product.stock_quantity}</Text>
        <Button onClick={() => addOrder(product)} colorScheme="blue">
          +
        </Button>
        <Button onClick={() => cancelOrder(product)} colorScheme="red">
          -
        </Button>
      </Stack>
    </Box>
  );
});
