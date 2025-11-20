import type { Env } from "hono"
import { Hono } from "hono"
import { getProductImageAssetData } from "../../usecases/getProductImageAssetData"

const DEFAULT_IMAGES = [
  "/images/defaults/lilac_syringa_ornamental_shrub.jpg",
  "/images/defaults/haematopus_ostralegus_bird_flight.jpg",
  "/images/defaults/cherry_tree_blossom_2007.jpg",
  "/images/defaults/dolphin_marine_mammals_water.jpg",
  "/images/defaults/hoover_nevada_arizona_colorado.jpg",
  "/images/defaults/netherlands_landscape_sky_clouds.jpg",
  "/images/defaults/new_york_skyline_usa.jpg",
  "/images/defaults/pennsylvania_landscape_scenic_97427.jpg",
  "/images/defaults/squirrel_tree_mammal_paw.jpg",
  "/images/defaults/white_bengal_tiger_tiger_0.jpg",
] as const

/**
 * Deterministic hash-based selection that varies by product ID.
 *
 * Uses XOR hash to distribute different product IDs across images uniformly.
 */
const getDefaultImagePath = (id: number): string => {
  const imageCount = DEFAULT_IMAGES.length
  const hash = (id * 73856093) ^ 19349663
  const selectedIndex = Math.abs(hash) % imageCount
  return DEFAULT_IMAGES[selectedIndex] ?? DEFAULT_IMAGES[0]
}

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
    const defaultPath = getDefaultImagePath(id)

    return c.redirect(defaultPath)
  } else {
    imageBuffer = Buffer.from(productImage.data, "base64")
    mimeType = productImage.mimeType
  }

  return c.body(imageBuffer, 200, {
    "Content-Type": mimeType,
  })
})

export default app
