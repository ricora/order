import { expect, test } from "@playwright/test"
import { waitForHydration } from "./utils"

test.describe("商品登録", () => {
  test("商品登録フォームが正しく送信される", async ({ page }) => {
    await waitForHydration(page, "/staff/products")

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

test.describe("商品編集", () => {
  test("商品編集フォームに初期値が設定されていて正しく更新できる", async ({
    page,
  }) => {
    await waitForHydration(page, "/staff/products/1/edit")

    // フォームが表示され、既存値がセットされていることを確認
    await expect(page.getByLabel("商品名")).toBeVisible()

    // 値が空でないことを確認する
    const currentName = await page.getByLabel("商品名").inputValue()
    expect(currentName.length).toBeGreaterThan(0)

    // 価格と在庫は数値が入っていることを確認する
    await expect(page.getByLabel("価格（円）")).toHaveValue(/\d+/)
    await expect(page.getByLabel("在庫数")).toHaveValue(/\d+/)

    // 値を編集して送信
    await page.getByLabel("商品名").fill("E2E編集商品")
    await page.getByLabel("価格（円）").fill("1234")
    await page.getByLabel("在庫数").fill("7")
    await page.getByRole("button", { name: "商品を更新" }).click()

    // 正常リダイレクトを確認
    await page.waitForURL("/staff/products", { timeout: 10000 })
  })
})
