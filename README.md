<div align="center">
  <img alt="" src="./public/icon.svg" width="128" height="128" />
  <h1>Order</h1>
  <a href="https://github.com/ricora/order/actions/workflows/ci.yml">
    <p>
      <img
        alt="CI"
        src="https://github.com/ricora/order/actions/workflows/ci.yml/badge.svg"
      />
    </p>
  </a>
  <p>学園祭の模擬店のための注文・在庫管理システム。</p>
</div>

## 機能

### 商品管理

![商品登録](docs/images/stock1.png)

商品の登録画面です。画面上部には在庫状況のサマリーが表示され、総商品数や在庫切れの商品数をひと目で把握できます。登録フォームでは商品名、画像、価格、在庫数、タグを設定できます。

![商品一覧](docs/images/stock2.png)

登録済みの商品一覧です。各商品の画像、名前、タグ、価格、在庫数、在庫状態を確認でき、編集、削除の操作が可能です。テーブル表示とカード表示の切り替えに対応しています。

### 注文登録

![注文登録](docs/images/register.png)

レジ担当者が使用する注文登録画面です。左側の商品一覧から商品をクリックしてカートに追加し、数量を調整できます。顧客名や備考欄も入力可能で、注文内容を確定すると厨房に注文データが送信されます。

### 注文進捗管理

![進捗管理](docs/images/progress.png)

厨房や配膳担当者が使用するカンバン形式の進捗管理画面です。「処理待ち」「処理中」「完了」「取消済」の4つのステータスで注文を管理し、ボタン操作で状態を遷移させることができます。各カードには注文番号、注文内容、経過時間が表示されます。

### 注文履歴

![注文履歴](docs/images/orders.png)

過去の注文履歴をテーブル形式で一覧表示する画面です。注文ID、登録日時、更新日時、顧客名、注文内容、合計金額、コメント、ステータスを確認でき、個別の編集、削除も可能です。

## 開発ガイドライン

詳細は[CONTRIBUTING.md](docs/contributing.md)を参照してください。

## アーキテクチャ

詳細は[ARCHITECTURE.md](docs/architecture.md)を参照してください。
