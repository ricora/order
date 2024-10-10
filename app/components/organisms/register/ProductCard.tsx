import { Box, Button, Input, Stack, Text } from "@chakra-ui/react";
import { FC, memo } from "react";
import { TypeProduct } from "~/type/typeproduct";

type Props = {
  product: TypeProduct;
  clickDelete: (product: TypeProduct) => void;
  clickChange: (product: TypeProduct) => void;
};

export const ProductCard: FC<Props> = memo((props) => {
  const { product, clickDelete, clickChange } = props;

  return (
    <Box w="300px" h="250px" bg="white" borderRadius="10px" shadow="md" p={4}>
      <h1>ID：{product.product_id}</h1>
      <Stack textAlign={"center"}>
        <Text>{product.product_name}</Text>
        <Text>価格：{product.price}</Text>
        <Text>在庫：{product.stock_quantity}</Text>
        <Button onClick={() => clickDelete(product)} colorScheme="red">
          削除
        </Button>
        <Button onClick={() => clickChange(product)} colorScheme="green">
          変更
        </Button>
      </Stack>
    </Box>
  );
});
