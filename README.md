# misstore

Misskey / NoteDeck 向けのプラグイン・テーマ・ウィジェット・スキルストア。

AiScript プラグインや Misskey 互換テーマ、NoteDeck ウィジェットテンプレート、AI 用スキル (システムプロンプト) をブラウザから検索・プレビュー・ワンクリックでインストールできます。

## 機能

- **プラグインストア** - AiScript プラグインの検索・カテゴリフィルタ・ソースコピー
- **テーマストア** - ダーク / ライトテーマの検索・カラープレビュー・ソースコピー
- **ウィジェットストア** - NoteDeck の AiScript App ウィジェットテンプレートの検索・カテゴリフィルタ・ソースコピー
- **スキルストア** - NoteDeck の AI に持たせるシステムプロンプト (`.md` + frontmatter) の検索・カテゴリフィルタ・ソースコピー
- **レジストリ API** - 静的 JSON による配信。外部クライアントからも利用可能

## Tech Stack

- Vue 3 + TypeScript + Vite
- pnpm

## セットアップ

```bash
pnpm install
pnpm run dev
```

## スクリプト

| コマンド | 説明 |
|---------|------|
| `pnpm run dev` | 開発サーバー起動 |
| `pnpm run build` | 型チェック + プロダクションビルド |
| `pnpm run preview` | ビルド結果のプレビュー |
| `pnpm run registry:build` | レジストリインデックスの再生成 |
| `pnpm run typecheck` | 型チェックのみ |

## レジストリ構造

プラグイン・テーマ・ウィジェット・スキルは `public/registry/` 以下にディレクトリ単位で管理されます。

```
public/registry/
  plugins/
    <plugin-id>/
      meta.json      # メタデータ
      plugin.is      # AiScript ソースコード
  themes/
    <theme-id>/
      meta.json      # メタデータ
      theme.json5    # テーマ定義
  widgets/
    <widget-id>/
      meta.json      # メタデータ
      widget.is      # AiScript ソースコード
  skills/
    <skill-id>/
      skill.md       # YAML frontmatter + システムプロンプト本文
  plugins.json       # 自動生成されるプラグインインデックス
  themes.json        # 自動生成されるテーマインデックス
  widgets.json       # 自動生成されるウィジェットインデックス
  skills.json        # 自動生成されるスキルインデックス
```

`plugins.json` / `themes.json` / `widgets.json` / `skills.json` は `pnpm run registry:build` で各ディレクトリの `meta.json` または `skill.md` の frontmatter から自動生成されます。

### エントリの URL フィールド

- `sourceUrl` — 生ソース（`plugin.is` / `theme.json5` / `widget.is` / `skill.md`）。クライアントが実体を取得する際はこちらを使う
- `apiUrl` — `{ type: "plugin" | "theme" | "widget" | "skill", data: <source> }` を返す Misskey 互換エンドポイント（`api.json`）。`plugin` / `theme` は Misskey 本家の `install-extensions?url=...` で利用される。`widget` / `skill` は現時点で Misskey 本家には消費者がいないが、NoteDeck からの取得用および将来本家や他クライアントが対応した時のために同じ流儀で予約されている

## プラグインの追加方法

1. `public/registry/plugins/<id>/` ディレクトリを作成
2. `meta.json` を追加:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "author": "@you",
  "description": "プラグインの説明",
  "category": "utility",
  "tags": ["tag1", "tag2"]
}
```

3. `plugin.is` に AiScript ソースコードを配置
4. `pnpm run registry:build` でインデックスを再生成

**プラグインカテゴリ:** `post-form` / `note-action` / `user-action` / `note-filter` / `post-filter` / `utility`

## テーマの追加方法

1. `public/registry/themes/<id>/` ディレクトリを作成
2. `meta.json` を追加:

```json
{
  "id": "my-theme",
  "name": "My Theme",
  "version": "1.0.0",
  "author": "@you",
  "description": "テーマの説明",
  "base": "dark",
  "tags": ["dark", "cool"],
  "previewColors": {
    "bg": "#1a1a2e",
    "fg": "#eaeaea",
    "panel": "#16213e",
    "accent": "#e94560"
  }
}
```

3. `theme.json5`（または `theme.json`）にテーマ定義を配置
4. `pnpm run registry:build` でインデックスを再生成

## ウィジェットの追加方法

1. `public/registry/widgets/<id>/` ディレクトリを作成
2. `meta.json` を追加:

```json
{
  "id": "my-widget",
  "name": "My Widget",
  "version": "1.0.0",
  "author": "@you",
  "description": "ウィジェットの説明",
  "icon": "ti-box",
  "autoRun": true,
  "category": "display",
  "capabilities": ["misskey-api"],
  "tags": ["tag1", "tag2"]
}
```

3. `widget.is` に AiScript ソースコードを配置
4. `pnpm run registry:build` でインデックスを再生成

**ウィジェットカテゴリ:** `display` / `input` / `stats`

**ウィジェットケイパビリティ（`capabilities`）:** ウィジェットが動作するために必要な環境を宣言する配列。クライアント（NoteDeck 等）はこれを見て、現在の環境で動かせないウィジェットを非表示 / グレーアウトして扱う。

- `misskey-api` — `Mk:api` で Misskey REST API を呼ぶ
- `misskey-account` — ログイン済みアカウントを前提とする（自分の情報の取得や投稿など）
- `notedeck-api` — NoteDeck 独自の `Nd:*` API を使う（他クライアントでは動作しない）

空配列 `[]` は standalone（AiScript 標準機能のみ）を意味する。

- `icon` は [Tabler Icons](https://tabler.io/icons) のクラス名（`ti-` プレフィックス付き）
- `autoRun` はユーザーが NoteDeck 側でテンプレートを選択したときに自動実行するか

## スキルの追加方法

スキルは NoteDeck の AI カラムに渡すシステムプロンプトです。Claude Code / Cursor の skill 規約に倣い、**単一 `.md` ファイル + YAML frontmatter** の 1 ファイル構成で配布します。

1. `public/registry/skills/<id>/` ディレクトリを作成
2. `skill.md` を以下の形式で作成:

```markdown
---
id: my-skill
name: 私のスキル
version: 0.1.0
description: スキルの説明
author: "@you"
mode: manual
scope: global
category: utility
tags: [tag1, tag2]
---
あなたは ... をするアシスタントです。

ルール:
- ...
- ...
```

3. `pnpm run registry:build` でインデックスを再生成

### Frontmatter フィールド

**必須:** `id`, `name`, `version`, `author`, `description`, `mode`

**任意:** `category` (デフォルト `utility`), `scope` (デフォルト `global`), `triggers` (デフォルト `[]`), `tags`, `authorUrl`, `license`, `repository`, `builtIn`, `createdAt`, `updatedAt`

**スキルカテゴリ:** `language` / `composing` / `analysis` / `persona` / `utility`

**mode:** スキルが AI に与えられる起動条件
- `always` — 常に有効 (system prompt に常時合成)
- `manual` — ユーザーが UI から選んだ時だけ有効
- `trigger` — 特定のコンテキスト (`triggers` 配列) で発火 (例: `composing-post`, `viewing-thread`)
- `heartbeat` — NoteDeck の HEARTBEAT (定期実行) で起動。状態を継続観察したり、蓄積された情報を一定間隔で消化するスキル向け

**scope:** スキルの適用範囲
- `global` — すべての NoteDeck アカウントで有効
- `per-account` — 個別アカウントで有効化 (NoteDeck 側で予約済み、Phase 2)

### Frontmatter パーサの制約

build script は最小実装の YAML フロントマターパーサを使用しています。以下のみサポート:

- スカラー (string / number / boolean / null)
- インライン配列 `[a, b, c]`
- ダブルクォート文字列 `"@username"`

入れ子オブジェクト、ブロックスカラー (`|`, `>`)、複数行配列はサポートしていません。複雑な構造が必要な場合は本文側 (markdown 部分) に書いてください。

## ライセンス

MIT
