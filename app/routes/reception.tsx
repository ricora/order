import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Stack,
    Text,
    useDisclosure,
    VStack,
    Wrap,
    WrapItem,
  } from "@chakra-ui/react";
  import { ActionFunction, ActionFunctionArgs, json } from "@remix-run/node";
  import {
    Form,
    useActionData,
    useFetcher,
    useLoaderData,
  } from "@remix-run/react";
  import { useEffect, useState } from "react";
  import { ReceptionCard } from "~/components/organisms/reception/ReceptionCard";
  import { createOrderDetail } from "~/crud/crud_details";
  import { createOrder } from "~/crud/crud_orders";
  import { readProduct } from "~/crud/crud_products";
  import { useMessage } from "~/hooks/useMessage";
  
  type TypeOrder = {
    table_number: number;
    order_datetime: string;
    status: "accept" | "cooking" | "complete";
  };
  
  type TypeOrderDetail = {
    product_name: string;
    order_id?: number;
    product_id: number;
    quantity: number;
    price: number;
  };
  
  type ActionData = {
    success: boolean;
    error?: string;
  };
  
  export default function Reception() {
    const { products: products } = useLoaderData<typeof loader>();
    const [order, setOrder] = useState<TypeOrderDetail[]>([]);
    const [total, setTotal] = useState(0);
    const [decision, setDecision] = useState(false);
    const actionData = useActionData<ActionData>();
    const { showMessage } = useMessage();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [tableNumber, setTableNumber] = useState("");
  
    // const fetcher = useFetcher();
  
    // useEffect(() => {
    //   const ws = new WebSocket("ws://localhost:8000");
  
    //   ws.onmessage = (event) => {
    //     const message = JSON.parse(event.data);
    //     if (message.type === "UPDATE" && message.table === "Products") {
    //       // サーバーから再度データを取得
    //       fetcher.load("/reception");
    //     }
    //   };
  
    //   return () => ws.close();
    // }, [fetcher]);
  
    useEffect(() => {
      if (actionData?.success === true) {
        setTotal(0);
        setDecision(false);
        setOrder([]);
        showMessage({ title: "注文しました", status: "success" });
        onClose();
        setTableNumber("");
      } else if (actionData?.success === false) {
        showMessage({ title: "テーブル番号を記入してください", status: "error" });
      }
    }, [actionData]);
  
    const addOrder = (product: {
      product_id: number;
      product_name: string;
      price: number;
    }) => {
      setOrder((prevOrder) => {
        const existingProduct = prevOrder.find(
          (item) => item.product_id === product.product_id
        );
  
        if (existingProduct) {
          return prevOrder.map((item) =>
            item.product_id === product.product_id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          return [...prevOrder, { ...product, quantity: 1 }];
        }
      });
    };
  
    const cancelOrder = (product: {
      product_id: number;
      product_name: string;
      price: number;
    }) => {
      setOrder((prevOrder) => {
        const existingProduct = prevOrder.find(
          (item) => item.product_id === product.product_id
        );
  
        if (existingProduct && existingProduct.quantity > 1) {
          return prevOrder.map((item) =>
            item.product_id === product.product_id
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
        } else {
          return prevOrder.filter(
            (item) => item.product_id !== product.product_id
          );
        }
      });
    };
  
    const clickTotal = () => {
      const totalPrice = order.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
      setTotal(totalPrice);
      setDecision(true);
      onOpen();
    };
  
    const tableNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setTableNumber(e.target.value);
    };
  
    return (
      <div>
        <Box left="10">
          <Stack pl="10">
            <h1>注文リスト</h1>
            <ul>
              {order.map((item) => (
                <li key={item.product_id}>
                  {item.product_name} - 数量: {item.quantity} - 小計:{" "}
                  {item.price * item.quantity}円
                </li>
              ))}
            </ul>
            <HStack>
              <Button
                onClick={clickTotal}
                isDisabled={order.length === 0}
                colorScheme="blue"
              >
                合計
              </Button>
              <Button onClick={() => setOrder([])}>キャンセル</Button>
            </HStack>
          </Stack>
        </Box>
        <div>
          <Wrap p={{ base: 4, md: 10 }}>
            {products.map((product) => (
              <WrapItem key={product.product_id} mx="auto">
                <ReceptionCard
                  product={product}
                  addOrder={addOrder}
                  cancelOrder={cancelOrder}
                />
              </WrapItem>
            ))}
          </Wrap>
        </div>
  
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          autoFocus={false}
          motionPreset="slideInBottom"
        >
          <ModalOverlay />
          <ModalContent pb={2}>
            <ModalCloseButton />
            <ModalBody mx={4}>
              <Stack spacing={4}>
                <FormControl>
                  <Heading fontSize="1.75rem" mb={4}>
                    注文内容
                  </Heading>
                  <Stack spacing={3}>
                    {order.map((item) => (
                      <Stack key={item.product_id} spacing={0}>
                        <Text>
                          商品名：{item.product_name}　　商品ID：{item.product_id}
                        </Text>
                        <Text>数量：{item.quantity}</Text>
                      </Stack>
                    ))}
                  </Stack>
                  <Text>--------------------------------------------</Text>
                  <Text>合計：{total}円</Text>
                  <Text>
                    テーブル番号：
                    <Input
                      type="number"
                      onChange={tableNumberChange}
                      value={tableNumber}
                      bg="gray.300"
                    />
                  </Text>
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter gap={4}>
              <Form method="post">
                {order.map((item) => (
                  <div key={item.product_id}>
                    <Input type="hidden" value={item.product_name} />
                    <Input
                      type="hidden"
                      value={item.product_id}
                      name="product_id"
                    />
                    <Input type="hidden" value={item.quantity} name="quantity" />
                  </div>
                ))}
                <Input type="hidden" value={tableNumber} name="table_number" />
                <Button type="submit" colorScheme="blue">
                  確定
                </Button>
              </Form>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    );
  }
  
  export const loader = async () => {
    const response = await readProduct();
    return json({ products: response });
  };
  
  export const action: ActionFunction = async ({
    request,
  }: ActionFunctionArgs) => {
    const formData = await request.formData();
  
    const product_ids = formData.getAll("product_id").map(Number);
    const quantities = formData.getAll("quantity").map(Number);
    const table_number = Number(formData.get("table_number"));
  
    if (table_number === 0) {
      return { success: false };
    } else {
      const order = await createOrder({
        table_number: table_number,
        status: "accept",
      });
  
      for (let i = 0; i < product_ids.length; i++) {
        await createOrderDetail({
          order_id: order.order_id,
          product_id: product_ids[i],
          quantity: quantities[i],
        });
      }
  
      return { success: true };
    }
  };
  