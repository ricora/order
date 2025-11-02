import { expect, test } from "@playwright/test"
import { waitForHydration } from "./utils"

test.describe("注文登録", () => {
  test("商品をカートに追加できる", async ({ page }) => {
    await waitForHydration(page, "/staff/orders/new")

    // 商品リストが表示されることを確認
    await expect(page.locator("#product-list")).toBeVisible()

    // 商品ボタンが存在するか確認してクリック
    const productButtons = page.locator("#product-list button")
    await expect(productButtons.first()).toBeEnabled({ timeout: 10000 })
    await productButtons.first().click()

    // カートに商品が追加されることを確認
    await expect(page.locator("#order-items [data-product-id]")).toHaveCount(
      1,
      {
        timeout: 15000,
      },
    )
  })

  test("タグフィルターが正しく動作する", async ({ page }) => {
    await waitForHydration(page, "/staff/orders/new")

    // タグ一覧セクションのボタンを取得
    const tagSection = page
      .getByRole("heading", { name: "タグ一覧" })
      .locator("..")
    const tagButtons = tagSection.locator("button")

    const tagCount = await tagButtons.count()

    if (tagCount > 0) {
      // 最初のタグをクリック
      const firstTag = tagButtons.first()
      await expect(firstTag).toBeVisible()
      await firstTag.click()

      // タグがアクティブになることを確認（スタイルの変化）
      await expect(firstTag).toHaveClass(/bg-primary/)
    }
  })

  test("数量を変更できる", async ({ page }) => {
    await waitForHydration(page, "/staff/orders/new")

    // 商品ボタンが存在するか確認
    const productButtons = page.locator("#product-list button")
    await expect(productButtons.first()).toBeEnabled({ timeout: 10000 })
    await productButtons.first().click()

    // カートに商品が追加されるまで待機
    await expect(page.locator("#order-items [data-product-id]")).toHaveCount(
      1,
      {
        timeout: 15000,
      },
    )

    // 数量入力フィールドを探す（カート内のもの）
    const quantityInput = page
      .locator("#order-items")
      .locator('input[type="number"]')
      .first()

    // 数量を変更
    await quantityInput.fill("3")

    // 数量が変更されたことを確認
    await expect(quantityInput).toHaveValue("3")
  })

  test("カートから商品を削除できる", async ({ page }) => {
    await waitForHydration(page, "/staff/orders/new")

    // 商品ボタンが存在するか確認
    const productButtons = page.locator("#product-list button")
    await expect(productButtons.first()).toBeEnabled({ timeout: 10000 })
    await productButtons.first().click()

    // カートに商品が追加されるまで待機
    await expect(page.locator("#order-items [data-product-id]")).toHaveCount(
      1,
      {
        timeout: 15000,
      },
    )

    // 削除ボタンをクリック
    await page.getByRole("button", { name: "削除" }).click()

    // カートが空になったことを確認
    await expect(page.getByText("カートに商品がありません")).toBeVisible()
  })

  test("クリアボタンでカートを空にできる", async ({ page }) => {
    await waitForHydration(page, "/staff/orders/new")

    // 商品ボタンが存在するか確認
    const productButtons = page.locator("#product-list button")
    await expect(productButtons.first()).toBeEnabled({ timeout: 10000 })
    await productButtons.first().click()

    // カートに商品が追加されるまで待機
    await expect(page.locator("#order-items [data-product-id]")).toHaveCount(
      1,
      {
        timeout: 15000,
      },
    )

    // クリアボタンをクリック
    await page.getByRole("button", { name: "カートを空にする" }).click()

    // カートが空になったことを確認
    await expect(page.getByText("カートに商品がありません")).toBeVisible()
  })
})
