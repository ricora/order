import { useEffect, useState } from "react"
import { useFetcher } from "@remix-run/react"
import { TypeOrder } from "~/type/typeorder"
import { TypeDetail } from "~/type/typedetail"
import { TypeProduct } from "~/type/typeproduct"

type FetcherData = {
  orders: TypeOrder[]
  details: TypeDetail[]
  products: TypeProduct[]
}

export const useKitchenData = (
  initialOrders: TypeOrder[],
  initialDetails: TypeDetail[],
  initialProducts: TypeProduct[],
) => {
  const [orders, setOrders] = useState<TypeOrder[]>(initialOrders)
  const [details, setDetails] = useState<TypeDetail[]>(initialDetails)
  const [products, setProducts] = useState<TypeProduct[]>(initialProducts)

  const fetcher = useFetcher<FetcherData>()

  useEffect(() => {
    if (fetcher.data) {
      setOrders(fetcher.data.orders)
      setDetails(fetcher.data.details)
      setProducts(fetcher.data.products)
    }
  }, [fetcher.data])

  useEffect(() => {
    const interval = setInterval(() => {
      fetcher.load("/kitchen")
    }, 5000)

    return () => clearInterval(interval)
  }, [fetcher])

  return { orders, details, products, fetcher }
}
