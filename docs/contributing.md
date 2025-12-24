# Contributing

## セットアップ

### 必要なツール

- [mise](https://mise.jdx.dev/) (ツールバージョン管理)

### インストール

```bash
# ツールチェインのインストール
mise install

# Node.jsの依存関係のインストール
bun install
```

## 開発

### テスト用データベースのセットアップ

```bash
# PGliteのセットアップ
bun run setup-test-db
# または
bun run setup-test-db:pglite

# PostgreSQLのセットアップ
DATABASE_URL="postgres://postgres:mypassword@localhost:5432/postgres" bun run setup-test-db:postgres
```

### 開発サーバーの起動

```bash
bun run dev
```

### ビルド

```bash
bun run build
```

### プレビュー

```bash
bun run preview
```

### テスト

```bash
# 単体テスト+統合テスト
bun run test

# 単体テスト
bun run test:unit

# 統合テスト
bun run test:integration

# E2Eテスト
bun run test:e2e
```

### コード品質

```bash
# Formatter, Linter, Import Sortingの実行
bun run check

# Formatting, Linting, Import Sortingの自動修正
bun run check:write

# 型検査
bun run type-check

# インポート依存関係の検査
bun run depcruise
```
