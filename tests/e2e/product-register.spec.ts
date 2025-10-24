import { expect, test } from "@playwright/test"
import { waitForHydration } from "./utils"

test.describe("商品登録", () => {
  test("商品登録フォームが正しく送信される", async ({ page }) => {
    await waitForHydration(page, "/staff/products")

    // 商品登録のdetailsを開く（summaryをクリック）
    await page.locator("summary:has-text('商品登録')").click()

    // フォームが表示されることを確認
    await expect(page.getByLabel("商品名")).toBeVisible()

    // フォームに入力
    await page.getByLabel("商品名").fill("テスト商品")
    await page.getByLabel("画像URL").fill("https://example.com/test.jpg")
    await page.getByLabel("価格（円）").fill("500")
    await page.getByLabel("在庫数").fill("10")

    // 登録ボタンをクリック
    await page.getByRole("button", { name: "登録" }).click()

    // ページがリロードされたことを確認（同じURLに戻る）
    await page.waitForURL("/staff/products", { timeout: 10000 })
  })
})
