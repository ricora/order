import {
  Box,
  Button,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { json, useLoaderData } from "@remix-run/react"
import { useEffect, useState } from "react"
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { readDetail } from "~/crud/crud_details"
import { readProduct } from "~/crud/crud_products"

type TypeGraphComponent = {
  total: number
  name: string
}

export default function Home() {
  const { details: details, products: products } =
    useLoaderData<typeof loader>()
  const [loadTime, setLoadTime] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const totalProfit = details.reduce(
    (sum, detail) =>
      sum +
      detail.quantity *
        products
          .filter((product) => detail.product_id === product.product_id)
          .reduce((sum, product) => sum + product.price, 0),
    0,
  )

  const data_bar: TypeGraphComponent[] = products.map((product) => ({
    total: details
      .filter((detail) => detail.product_id === product.product_id)
      .reduce((sum, filteredDetail) => sum + filteredDetail.quantity, 0),
    name: product.product_name,
  }))

  const data_circle: TypeGraphComponent[] = products.map((product) => ({
    total:
      details
        .filter((detail) => detail.product_id === product.product_id)
        .reduce((sum, filteredDetail) => sum + filteredDetail.quantity, 0) *
      product.price,
    name: product.product_name,
  }))

  const generateColors = (num: number) => {
    const box = []
    for (let i = 0; i < num; i++) {
      const hue = (i * 360) / num
      box.push(`hsl(${hue}, 70%, 50%)`)
    }
    return box
  }

  const colors = generateColors(data_bar.length)

  useEffect(() => {
    const time: Date = new Date()
    setLoadTime(time)
    setIsClient(true)
  }, [])

  return (
    <VStack>
      <Box
        w={{ md: "100%", lg: "975px" }}
        h="280px"
        bg="white"
        borderRadius="10px"
        shadow="md"
        p={4}
      >
        <VStack>
          <HStack alignItems="baseline">
            <Text fontSize="3xl">総額</Text>
            <Text
              color="red"
              fontFamily="'Playfair Display', serif"
              fontSize="8xl"
              fontStyle="italic"
            >
              {totalProfit}
            </Text>
            <Text fontSize="3xl">円</Text>
          </HStack>
          <Text fontSize="3xl">
            の売り上げ（
            {loadTime ? loadTime.toLocaleString() : "ロード中"}時点）
          </Text>
        </VStack>
      </Box>
      <Stack
        mt={10}
        spacing={10}
        direction={{ base: "column", md: "row" }}
        align="center"
      >
        <Box
          width="450px"
          height="450px"
          bg="white"
          borderRadius="10px"
          shadow="md"
        >
          <Box mt={4} ml={4}>
            <Heading as="h2" size="lg" mb={4}>
              販売数ランキング
            </Heading>
            {isClient && (
              <BarChart width={400} height={300} data={data_bar}>
                <XAxis
                  dataKey="name"
                  tickFormatter={(name) => name.split("").join("\n")}
                  tick={{ width: 30, style: { fontSize: "10px" } }}
                />
                <YAxis
                  label={{
                    value: "個数",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    style: { fontSize: "20px" },
                  }}
                />
                <Bar dataKey="total" fill="#8884d8" />
              </BarChart>
            )}
          </Box>
        </Box>
        <Box
          width="450px"
          height="450px"
          bg="white"
          borderRadius="10px"
          shadow="md"
        >
          <Box mt={4} ml={4}>
            <Heading as="h2" size="lg" mb={4}>
              売上構成比
            </Heading>
            {isClient && (
              <PieChart width={400} height={300}>
                <Pie
                  data={data_circle}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  fill="#82ca9d"
                  strokeWidth={0}
                  label
                >
                  {data_circle.map((entry, index) => (
                    <Cell key={index} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            )}
            {isClient && (
              <Button
                onClick={onOpen}
                colorScheme="blue"
                bottom="-4"
                left="350"
              >
                詳細
              </Button>
            )}
          </Box>
        </Box>
      </Stack>
      <Modal isOpen={isOpen} onClose={onClose} motionPreset="slideInBottom">
        <ModalOverlay />
        <ModalContent pb={2}>
          <ModalBody mx={4}>
            <VStack align="start" spacing={2}>
              <Heading as="h2" size="lg" mb={4}>
                詳細
              </Heading>
              {data_circle.map((entry, index) => (
                <HStack key={index}>
                  <Box
                    w="12px"
                    h="12px"
                    bg={colors[index % colors.length]}
                    borderRadius="50%"
                  />
                  <Text>{`${entry.name}: ${entry.total}円: ${Math.floor((entry.total / totalProfit) * 100)}%`}</Text>
                </HStack>
              ))}
              <Button
                onClick={onClose}
                colorScheme="blue"
                bottom="-1"
                left="300"
              >
                閉じる
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  )
}

export const loader = async () => {
  const response_details = await readDetail()
  const response_products = await readProduct()
  return json({
    details: response_details,
    products: response_products,
  })
}
