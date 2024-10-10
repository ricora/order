import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Stack,
    useDisclosure,
    VStack,
    Wrap,
    WrapItem,
  } from "@chakra-ui/react";
  import { UNABLE_TO_FIND_POSTINSTALL_TRIGGER_JSON_PARSE_ERROR } from "@prisma/client/scripts/postinstall.js";
  import { ActionFunction, ActionFunctionArgs } from "@remix-run/node";
  import {
    Form,
    json,
    useActionData,
    useFetcher,
    useLoaderData,
  } from "@remix-run/react";
  import { useState, useEffect } from "react";
  import { ProductCard } from "~/components/organisms/register/ProductCard";
  import {
    createProduct,
    deleteAllProducts,
    deleteProduct,
    readProduct,
    updateProduct,
  } from "~/crud/crud_products";
  import { useMessage } from "~/hooks/useMessage";
  
  type ActionData = {
    success: boolean;
    error?: string;
    method?: string;
  };
  
  type TypeProduct = {
    product_id: number;
    product_name: string;
    price: number;
    stock_quantity: number;
  };
  
  export default function Register() {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [isLoading, setLoading] = useState(false);
    const actionData = useActionData<ActionData>();
    const { showMessage } = useMessage();
    const { products: products } = useLoaderData<typeof loader>();
    const [isOpen, setOpen] = useState(false);
    const {
      isOpen: isDeleteOpen,
      onOpen: onDeleteOpen,
      onClose: onDeleteClose,
    } = useDisclosure();
    const {
      isOpen: isDeleteAllOpen,
      onOpen: onDeleteAllOpen,
      onClose: onDeleteAllClose,
    } = useDisclosure();
    const {
      isOpen: isChangeOpen,
      onOpen: onChangeOpen,
      onClose: onChangeClose,
    } = useDisclosure();
    const [deleteProduct, setDeleteProduct] = useState<TypeProduct | null>(null);
    const [changeProduct, setChangeProduct] = useState<TypeProduct | null>(null);
  
    // const fetcher = useFetcher();
  
    // useEffect(() => {
    //   const ws = new WebSocket("ws://localhost:8000");
  
    //   ws.onmessage = (event) => {
    //     const message = JSON.parse(event.data);
    //     if (message.type === "UPDATE" && message.table === "Products") {
    //       // サーバーから再度データを取得
    //       fetcher.load("/register");
    //     }
    //   };
  
    //   return () => ws.close();
    // }, [fetcher]);
  
    useEffect(() => {
      if (actionData?.success && actionData?.method === "POST") {
        setName("");
        setPrice("");
        setStock("");
        setLoading(false);
        showMessage({ title: "登録完了", status: "success" });
      }
      if (actionData?.error && actionData?.method === "POST") {
        showMessage({ title: "登録失敗", status: "error" });
      }
      if (actionData?.success && actionData?.method === "delete") {
        showMessage({ title: "削除完了", status: "success" });
        setDeleteProduct(null);
        onDeleteClose();
      }
      if (actionData?.error && actionData?.method === "delete") {
        showMessage({ title: "削除失敗", status: "error" });
      }
      if (actionData?.success && actionData?.method === "update") {
        showMessage({ title: "変更完了", status: "success" });
        setChangeProduct(null);
        onChangeClose();
      }
      if (actionData?.error && actionData?.method === "update") {
        showMessage({ title: "変更失敗", status: "error" });
      }
    }, [actionData]);
  
    const nameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
    };
  
    const priceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPrice(e.target.value);
    };
  
    const stockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setStock(e.target.value);
    };
  
    const productOpen = () => {
      setOpen(true);
    };
  
    const productClose = () => {
      setOpen(false);
    };
  
    const clickDelete = (product: TypeProduct) => {
      setDeleteProduct(product);
      onDeleteOpen();
    };
  
    const clickDeleteAll = () => {
      onDeleteAllOpen();
    };
  
    const clickChange = (product: TypeProduct) => {
      setChangeProduct(product);
      onChangeOpen();
    };
  
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (changeProduct) {
        setChangeProduct({
          ...changeProduct,
          product_name: e.target.value,
        });
      }
    };
  
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (changeProduct) {
        setChangeProduct({
          ...changeProduct,
          price: Number(e.target.value),
        });
      }
    };
  
    const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (changeProduct) {
        setChangeProduct({
          ...changeProduct,
          stock_quantity: Number(e.target.value),
        });
      }
    };
  
    return (
      <div>
        <Button
          colorScheme="red"
          onClick={clickDeleteAll}
          position="relative"
          top="-2"
          right="-850"
          mb="4"
        >
          すべて削除
        </Button>
        <VStack>
          <Box
            bg="white"
            w="400px"
            h="400px"
            borderRadius="10px"
            shadow="md"
            fontSize="xl"
            p={4}
          >
            <Heading>商品登録フォーム</Heading>
            <Form method="post">
              <FormControl>
                <FormLabel>商品名</FormLabel>
                <Input
                  type="text"
                  name="product_name"
                  value={name}
                  onChange={nameChange}
                  bg="gray.200"
                  required
                />
              </FormControl>
              <FormControl>
                <FormLabel>価格（税込み）</FormLabel>
                <Input
                  type="number"
                  name="price"
                  value={price}
                  onChange={priceChange}
                  bg="gray.200"
                  required
                />
              </FormControl>
              <FormControl>
                <FormLabel>在庫</FormLabel>
                <Input
                  type="number"
                  name="stock_quantity"
                  value={stock}
                  onChange={stockChange}
                  bg="gray.200"
                  required
                />
              </FormControl>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={isLoading}
                // position="absolute"
                bottom="-65"
                left="300"
              >
                登録
              </Button>
            </Form>
          </Box>
          {isOpen ? (
            <Button colorScheme="blue" onClick={productClose}>
              閉じる
            </Button>
          ) : (
            <Button colorScheme="blue" onClick={productOpen}>
              商品一覧
            </Button>
          )}
          {isOpen ? (
            <div>
              <Wrap p={{ base: 4, md: 10 }}>
                {products.map((product) => (
                  <WrapItem key={product.product_id} mx="auto">
                    <ProductCard
                      product={product}
                      clickDelete={clickDelete}
                      clickChange={clickChange}
                    />
                  </WrapItem>
                ))}
              </Wrap>
            </div>
          ) : null}
        </VStack>
        <Modal
          isOpen={isDeleteOpen}
          onClose={onDeleteClose}
          autoFocus={false}
          motionPreset="slideInBottom"
        >
          <ModalOverlay />
          <ModalContent pb={2}>
            <ModalBody mx={4}>
              <p>{deleteProduct?.product_name}を本当に削除しますか？</p>
              <br />
              <Form method="post">
                <Input type="hidden" name="_method" value="delete" />
                <Input
                  type="hidden"
                  value={deleteProduct?.product_id}
                  name="product_id"
                />
                <Button w="100%" type="submit">
                  はい
                </Button>
              </Form>
              <Button w="100%" onClick={onDeleteClose}>
                いいえ
              </Button>
            </ModalBody>
          </ModalContent>
        </Modal>
  
        <Modal
          isOpen={isDeleteAllOpen}
          onClose={onDeleteAllClose}
          autoFocus={false}
          motionPreset="slideInBottom"
        >
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
              <Button w="100%" onClick={onDeleteAllClose}>
                いいえ
              </Button>
            </ModalBody>
          </ModalContent>
        </Modal>
  
        <Modal
          isOpen={isChangeOpen}
          onClose={onChangeClose}
          autoFocus={false}
          motionPreset="slideInBottom"
        >
          <ModalOverlay />
          <ModalContent pb={2}>
            <ModalHeader>ユーザー詳細</ModalHeader>
            <ModalCloseButton />
            <ModalBody mx={4}>
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel>商品名</FormLabel>
                  <Input
                    type="text"
                    value={changeProduct?.product_name}
                    onChange={handleNameChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>価格（税込み）</FormLabel>
                  <Input
                    type="number"
                    value={changeProduct?.price}
                    onChange={handlePriceChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>在庫</FormLabel>
                  <Input
                    type="number"
                    value={changeProduct?.stock_quantity}
                    onChange={handleStockChange}
                  />
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter gap={4}>
              <Form method="post">
                <Input type="hidden" name="_method" value="update" />
                <Input
                  type="hidden"
                  value={changeProduct?.product_id}
                  name="product_id"
                />
                <Input
                  type="hidden"
                  value={changeProduct?.product_name}
                  name="product_name"
                />
                <Input type="hidden" value={changeProduct?.price} name="price" />
                <Input
                  type="hidden"
                  value={changeProduct?.stock_quantity}
                  name="product_stock"
                />
                <Button type="submit" colorScheme="green">
                  更新
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
    const method = formData.get("_method");
  
    if (
      request.method === "POST" &&
      method !== "delete" &&
      method !== "update" &&
      method !== "delete_all"
    ) {
      const product_name = formData.get("product_name");
      const price = Number(formData.get("price"));
      const stock_quantity = Number(formData.get("stock_quantity"));
  
      if (
        typeof product_name === "string" &&
        !isNaN(price) &&
        !isNaN(stock_quantity)
      ) {
        await createProduct({
          product_name,
          price,
          stock_quantity,
        });
  
        return json({ success: true, method: request.method });
      } else {
        return json({
          success: false,
          error: "Invalid input",
          method: request.method,
        });
      }
    } else if (method === "delete") {
      const product_id = Number(formData.get("product_id"));
      console.log("Method:", method);
      console.log("Product ID:", product_id);
      if (!isNaN(product_id)) {
        try {
          await deleteProduct(product_id);
          return json({ success: true, method: method });
        } catch (error) {
          return json({
            success: false,
            error: "Failed to delete product",
            method: method,
          });
        }
      } else {
        return json({
          success: false,
          error: "Invalid product ID",
          method: method,
        });
      }
    } else if (method === "update") {
      const product_id = Number(formData.get("product_id"));
      const product_name = formData.get("product_name");
      const price = Number(formData.get("price"));
      const stock_quantity = Number(formData.get("product_stock"));
  
      if (typeof product_name === "string") {
        await updateProduct(product_id, product_name, price, stock_quantity);
        return json({ success: true, method: method });
      } else {
        return json({ success: false, error: "no product_name", method: method });
      }
    } else if (method == "delete_all") {
      await deleteAllProducts();
      return json({ success: true, method: method });
    } else {
      return json({ success: false, error: "Unsupported request method" });
    }
  };
  