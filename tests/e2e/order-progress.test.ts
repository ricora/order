import { expect, test } from "@playwright/test"
import { waitForHydration } from "./utils"

test.describe("注文進捗管理", () => {
  test("ステータスを更新するとトーストが表示される", async ({ page }) => {
    await waitForHydration(page, "/staff/orders/progress")
    const pendingSection = page
      .locator("section")
      .filter({ hasText: "処理待ち" })
      .first()
    const card = pendingSection.locator("div[data-order-id]").first()
    await expect(card).toBeVisible({ timeout: 10000 })
    const orderId = await card.getAttribute("data-order-id")
    expect(orderId).toBeTruthy()

    // 「処理中」に移動させるボタンをクリック
    const toProcessingButton = card
      .getByRole("button", { name: /処理中/ })
      .first()
    await toProcessingButton.scrollIntoViewIfNeeded()
    await expect(toProcessingButton).toBeEnabled({ timeout: 10000 })
    await toProcessingButton.click()

    // クリック後にクライアントトーストが表示され、注文IDが含まれている
    await page.waitForFunction(
      (id) =>
        Array.from(document.querySelectorAll('[role="alert"]')).some((el) =>
          el.textContent?.includes(`#${id}`),
        ),
      orderId,
      { timeout: 7000 },
    )

    // この注文IDを含むトーストが1件だけ表示されている
    const toastsWithId = page
      .locator('div[role="alert"]')
      .filter({ hasText: `#${orderId}` })
    expect(await toastsWithId.count()).toBe(1)

    // 注文が「処理中」に移動している
    const processingSection = page
      .locator("section")
      .filter({ hasText: "処理中" })
      .first()
    await expect(
      processingSection.locator(`div[data-order-id="${orderId}"]`),
    ).toBeVisible({ timeout: 7000 })

    // ローカル更新後は手動更新ボタンがクールダウン状態でなく有効である
    const manualRefreshBtn = page.getByRole("button", {
      name: "注文一覧を更新する",
    })
    await expect(manualRefreshBtn).toBeEnabled({ timeout: 10000 })
  })

  test("手動更新ボタンがクールダウン中は無効になる", async ({ page }) => {
    await waitForHydration(page, "/staff/orders/progress")

    const refreshBtn = page.getByRole("button", { name: "注文一覧を更新する" })
    await expect(refreshBtn).toBeVisible()

    // 手動更新ボタンをクリックすると無効化される
    await refreshBtn.click()
    await expect(refreshBtn).toBeDisabled({ timeout: 2000 })

    // すぐに再度クリックを試みても無効のままである
    await expect(refreshBtn).toBeDisabled()

    // クールダウン（約5秒）後に再び有効になる
    await page.waitForTimeout(5500)
    await expect(refreshBtn).toBeEnabled()
  })
})
