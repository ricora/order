import type Product from "../domain/product/entities/product"
import { createProduct } from "../domain/product/repositories/productCommandRepository"
import { createProductTag } from "../domain/product/repositories/productTagCommandRepository"
import { findAllProductTags } from "../domain/product/repositories/productTagQueryRepository"

export type RegisterProductParams = Omit<Product, "tagIds" | "id"> & {
  tags: string[]
}

export const registerProduct = async (
  params: RegisterProductParams,
): Promise<Product | null> => {
  // TODO: トランザクション管理を実装し、一連の処理をアトミックにする
  try {
    const tags = await findAllProductTags({})
    const tagNameToId = new Map(tags.map((tag) => [tag.name, tag.id]))
    const tagIds: number[] = []
    for (const tagName of params.tags) {
      const trimmed = tagName.trim()
      if (!trimmed) continue
      const id = tagNameToId.get(trimmed)
      if (id !== undefined) {
        tagIds.push(id)
      } else {
        const newTag = await createProductTag({ name: trimmed })
        tagIds.push(newTag.id)
        tagNameToId.set(trimmed, newTag.id)
      }
    }

    return await createProduct({
      name: params.name.trim(),
      // TODO: デフォルト画像を正式なものに差し替える
      image: params.image.trim() || "https://picsum.photos/200/200",
      tagIds,
      price: params.price,
      stock: params.stock,
    })
  } catch {
    throw new Error("商品の作成に失敗しました")
  }
}
