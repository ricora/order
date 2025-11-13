import type { Env } from "hono"
import { Hono } from "hono"
import { getProductImageAssetData } from "../../usecases/getProductImageAssetData"

/**
 * Web API for image assets.
 */
const app = new Hono<Env>()
app.get("/products/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10)
  if (!Number.isInteger(id)) {
    return c.text("Invalid product ID", 400)
  }
  const { product } = await getProductImageAssetData({
    dbClient: c.get("dbClient"),
    product: { id },
  })
  let imageBuffer: Buffer<ArrayBuffer>
  let mimeType: string

  if (product == null) {
    return c.text("Image not found", 404)
  }
  if (product.image == null) {
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
    imageBuffer = Buffer.from(product.image.data, "base64")
    mimeType = product.image.mimeType
  }

  return c.body(imageBuffer, 200, {
    "Content-Type": mimeType,
  })
})

export default app
