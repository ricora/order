# アーキテクチャの概要

## ディレクトリ構造

### app

React アプリケーションのソースコード

### app/components

React Component

### app/components/atoms/button

ボタンなどの最小単位のコンポーネント

### app/components/molecules

ドロワーなどのatomsよりも大きなコンポーネント

### app/components/organisms

カードなどのatomsやmoleculesよりも大きなコンポーネント

### app/components/organisms/kitchen

厨房画面で使用するコンポーネント

### app/components/organisms/reception

受付画面で使用するコンポーネント

### app/components/organisms/register

登録画面で使用するコンポーネント

### app/crud

データベースを操作に関連する関数など

### app/hooks

React Hooksのカスタムフック

### app/routes

ルーティングやサイドバー、ヘッダー

### app/styles

アプリケーションのスタイル管理

### app/type

TypeScriptの型定義

### prisma

prismaに関連する設定ファイルやスキーマ定義

### public

静的ファイル（画像やアイコンなど）
