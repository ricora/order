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
    await page.getByRole("button", { name: "商品を登録" }).click()

    // ページがリロードされたことを確認（同じURLに戻る）
    await page.waitForURL("/staff/products", { timeout: 10000 })
  })

  test("タグの追加と削除が正しく動作する", async ({ page }) => {
    await waitForHydration(page, "/staff/products")

    const newTag = `e2e-tag-${Date.now()}`

    // タグ入力に値を入れて追加ボタンを押す
    await page.locator("#tag-input").fill(newTag)
    await page.getByRole("button", { name: "新しいタグを追加" }).click()

    // 追加されたタグが表示される
    await expect(page.getByText(newTag)).toBeVisible()

    // タグを削除する
    await page.getByRole("button", { name: `${newTag}を削除` }).click()

    // 削除されていることを確認
    await expect(page.getByText(newTag)).not.toBeVisible()
  })

  test("タグのバリデーションが正しく動作する", async ({ page }) => {
    await waitForHydration(page, "/staff/products")

    // 重複タグの検証
    const dupTag = `dup-tag-${Date.now()}`
    await page.locator("#tag-input").fill(dupTag)
    await page.getByRole("button", { name: "新しいタグを追加" }).click()

    // 同じタグをもう一度追加して重複エラーを確認
    await page.locator("#tag-input").fill(dupTag)
    await page.getByRole("button", { name: "新しいタグを追加" }).click()
    await expect(page.getByRole("alert")).toHaveText(
      "このタグは既に追加されています。",
    )

    // タグ個数上限の検証（20個）
    // 既に1つ追加しているので19個追加して上限を超える動作を確認する
    for (let i = 0; i < 19; i++) {
      const t = `t-${i}-${Date.now()}`
      await page.locator("#tag-input").fill(t)
      await page.getByRole("button", { name: "新しいタグを追加" }).click()
    }

    // 21個目（上限を超える）を追加しようとするとエラーが出る
    const overTag = `over-tag-${Date.now()}`
    await page.locator("#tag-input").fill(overTag)
    // ボタンが無効化されている可能性があるため Enter キーで追加処理をトリガーする
    await page.locator("#tag-input").press("Enter")
    await expect(page.getByRole("alert")).toHaveText(
      `設定できるタグの個数の上限は20個です。`,
    )
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

  test("編集ページで初期タグが表示される", async ({ page }) => {
    await waitForHydration(page, "/staff/products/1/edit")

    // タグの初期選択が反映されるまで待機
    await page.waitForFunction(
      () => document.querySelectorAll('input[name="tags"]').length > 0,
    )

    const tagInputs = page.locator('input[name="tags"]')
    await expect(tagInputs).toHaveCount(2)

    await expect(page.locator('input[name="tags"][value="タグA"]')).toHaveCount(
      1,
    )
    await expect(page.locator('input[name="tags"][value="タグB"]')).toHaveCount(
      1,
    )

    await expect(
      page.getByRole("button", { name: "タグAを削除" }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "タグBを削除" }),
    ).toBeVisible()
  })
})
