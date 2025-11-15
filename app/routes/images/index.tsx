import type { Env } from "hono"
import { Hono } from "hono"
import { getProductImageAssetData } from "../../usecases/getProductImageAssetData"

/**
 * Web API for image assets.
 */
const app = new Hono<Env>()
app.get("/products/:id", async (c) => {
  const paramId = c.req.param("id")
  if (!/^\d+$/.test(paramId)) {
    return c.text("Invalid product ID", 400)
  }
  const id = Number.parseInt(paramId, 10)
  const { productImage } = await getProductImageAssetData({
    dbClient: c.get("dbClient"),
    productImage: { productId: id },
  })
  let imageBuffer: Buffer<ArrayBuffer>
  let mimeType: string

  if (productImage == null) {
    // TODO: 正式なデフォルト画像に差し替える
    const dummyUrl = `https://picsum.photos/id/${id % 1000}/200/200`
    const res = await fetch(dummyUrl)
    if (!res.ok) {
      return c.text("Failed to fetch default image", 502)
    }
    const arrayBuffer = await res.arrayBuffer()
    imageBuffer = Buffer.from(arrayBuffer)
    mimeType = res.headers.get("content-type") || "image/jpeg"
  } else {
    imageBuffer = Buffer.from(productImage.data, "base64")
    mimeType = productImage.mimeType
  }

  return c.body(imageBuffer, 200, {
    "Content-Type": mimeType,
  })
})

export default app
