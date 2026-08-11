# レジストリ形式リファレンス

misstore のレジストリ構造と、種別ごとのアイテム追加手順。投稿の全体的な流れと
セキュリティ上のルールは [CONTRIBUTING.md](../CONTRIBUTING.md) を先に読んでください。

## レジストリ構造

テーマ・プラグイン・ウィジェット・クエリ・スキルは `public/registry/` 以下に
ディレクトリ単位で管理されます。

```
public/registry/
  themes/<theme-id>/     meta.json + theme.json5
  plugins/<plugin-id>/   meta.json + plugin.is      (AiScript)
  widgets/<widget-id>/   meta.json + widget.is       (AiScript)
  queries/<query-id>/    meta.json + query.is        (AiScript フィルタ式)
  skills/<skill-id>/     skill.md                    (YAML frontmatter + 本文)
  *.json                 自動生成インデックス(themes.json / plugins.json / ...)
```

各インデックスは `pnpm run registry:build` で `meta.json` または `skill.md` の
frontmatter から自動生成されます。`api.json` などの生成物はコミットせず、ビルドで
生成します(レビュー対象とソースを一致させるため。[security.md](design/security.md) S1)。

> **ID はディレクトリ名と一致必須。** `meta.id`(スキルは frontmatter の `id`)は
> ディレクトリ名と完全に一致させてください(不一致は既存アイテム乗っ取りの温床として
> CI が reject します)。
> `createdAt`/`updatedAt` は `meta.json` に書かず、git 履歴から自動採取されます。

ディレクトリ名(storeId)は NoteDeck 側でローカル同一性の正準リンクになるため
(notedeck#913)、CI(`scripts/check-registry-integrity.mjs`)が次を機械検査します。

- 形式は `^[a-z0-9-]{1,48}$`(小文字英数とハイフンのみ、48 文字以内)。
  Windows 予約デバイス名(`con` / `prn` / `aux` / `nul` / `com1`-`com9` /
  `lpt1`-`lpt9`)は不可
- ID は種別をまたいでレジストリ全体で一意(同じ ID を plugins と skills で
  使い回すことはできない)
- テーマの `theme.json5` 内部 `id` はテーマ間で一意(欠損は許容、重複は reject)

### エントリの URL フィールド

- `sourceUrl` — 生ソース(`plugin.is` / `theme.json5` / `widget.is` / `skill.md` /
  `query.is`)。クライアントが実体を取得する際はこちらを使う。
- `apiUrl` — `{ type, data: <source> }` を返す Misskey 互換エンドポイント
  (`api.json`)。`plugin` / `theme` は Misskey 本家の `install-extensions?url=...` で
  利用される。`widget` / `skill` / `query` は現時点で本家に消費者がいないが、
  NoteDeck からの取得用および将来の対応のために同じ流儀で予約されている。

---

## テーマ

1. `public/registry/themes/<id>/` を作成。
2. `meta.json`:

```json
{
  "id": "my-theme",
  "name": "My Theme",
  "version": "1.0.0",
  "author": "@you",
  "description": "テーマの説明",
  "base": "dark",
  "tags": ["dark", "cool"],
  "previewColors": { "bg": "#1a1a2e", "fg": "#eaeaea", "panel": "#16213e", "accent": "#e94560" }
}
```

3. `theme.json5`(または `theme.json`)にテーマ定義を配置。
4. `pnpm run registry:build`。

---

## プラグイン

1. `public/registry/plugins/<id>/` を作成。
2. `meta.json`:

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

3. `plugin.is` に AiScript ソースを配置。
4. `pnpm run registry:build`。

**カテゴリ:** `post-form` / `note-action` / `user-action` / `note-filter` /
`post-filter` / `utility`

---

## ウィジェット

1. `public/registry/widgets/<id>/` を作成。
2. `meta.json`:

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

3. `widget.is` に AiScript ソースを配置。
4. `pnpm run registry:build`。

**カテゴリ:** `display` / `input` / `stats`

**ケイパビリティ(`capabilities`):** ウィジェットが動作するために必要な環境を宣言する
配列。クライアント(NoteDeck 等)はこれを見て動かせないウィジェットを非表示 /
グレーアウトします。

- `misskey-api` — `Mk:api` で Misskey REST API を呼ぶ
- `misskey-account` — ログイン済みアカウントを前提とする
- `notedeck-api` — NoteDeck 独自の `Nd:*` API を使う(他クライアントでは動かない)
- `secret-vault` — NoteDeck の Secret Vault に外部サービスの API キー接続が必要(`Nd:call`)

空配列 `[]` は standalone(AiScript 標準機能のみ)。`icon` は
[Tabler Icons](https://tabler.io/icons) のクラス名(`ti-` プレフィックス)、
`autoRun` はテンプレート選択時に自動実行するか。

---

## クエリ

クエリは NoteDeck のカラムフィルタに渡す AiScript 式です
([notedeck#783](https://github.com/notedeck-dev/notedeck/issues/783))。「`true` = 表示」の
式を評価してノートを絞り込みます。配布するのはソースのみで、コンパイル済み QIR は
配布しません(適用側で必ず再コンパイルされます)。

1. `public/registry/queries/<id>/` を作成。
2. `meta.json`:

```json
{
  "id": "my-query",
  "name": "My Query",
  "version": "1.0.0",
  "author": "@you",
  "description": "クエリの説明",
  "category": "mute",
  "tags": ["tag1", "tag2"]
}
```

3. `query.is` に AiScript 式を配置(最後の式の評価結果が表示判定)。
4. `pnpm run registry:build`。

**カテゴリ:** `hide`(ノイズを減らす)/ `focus`(特定ノートに絞る)/
`watch`(話題を購読)/ `other`

**v1 サブセットの制約:** 参照できるフィールドは `note.text` / `note.cw` /
`note.visibility` / `note.localOnly` / `note.renoteId` / `note.replyId` /
`note.user.username` / `note.user.host` / `note.user.name` / `note.files.len` /
`note.reactions["絵文字"]`(文字列リテラルの index のみ・欠落キーは `null`)。使える
演算は比較(`<` `<=` `>` `>=` `==` `!=`)・論理(`&&` `||` `!`)・`str.incl` /
`str.starts_with` / `str.ends_with` / `str.lower` / `str.upper`・`arr.incl` /
`arr.len`、および `let` と再帰しない純粋関数のみ。

**書くときの注意:**

- `null` レシーバへの演算・数値以外の比較は **per-note エラー = そのノートを除外 +
  診断計上**。`note.text != null && note.text.lower().incl(...)` のように `&&` の短絡で
  ガードする(`let` は eager 評価なのでガードにならない)。
- 二項演算子の後で改行できない。式は 1 行に収めるか純粋関数に切り出す。
- 適用は複数クエリの And 合成なので、単機能クエリの方が組み合わせが効く。
- NoteDeck のフィルタメニューに組込トグルがある条件(リノート / リプライ / メディア
  のみ / bot)は**配布しない**。組込側の方が精度が高く、クエリでは劣化コピーになる。

---

## スキル

スキルは NoteDeck の AI カラムに渡すシステムプロンプトです。Claude Code / Cursor の
skill 規約に倣い、**単一 `.md` ファイル + YAML frontmatter** の 1 ファイル構成で
配布します。

1. `public/registry/skills/<id>/` を作成。
2. `skill.md`:

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
```

3. `pnpm run registry:build`。

**必須:** `id`, `name`, `version`, `author`, `description`, `mode`
**任意:** `category`(既定 `utility`), `scope`(既定 `global`), `triggers`(既定 `[]`),
`tags`, `authorUrl`, `license`, `repository`, `builtIn`

**カテゴリ:** `language` / `composing` / `analysis` / `persona` / `utility`

**mode:** スキルが AI に与えられる起動条件

- `always` — 常に有効(system prompt に常時合成)
- `manual` — ユーザーが UI から選んだ時だけ有効
- `trigger` — 特定コンテキスト(`triggers` 配列)で発火(例 `composing-post`)
- `heartbeat` — NoteDeck の HEARTBEAT(定期実行)で起動。状態の継続観察向け

**scope:** `global`(全アカウント)/ `per-account`(NoteDeck 側で予約済み、Phase 2)

### Frontmatter パーサの制約

build script は最小実装の YAML frontmatter パーサを使います。サポートは
スカラー(string / number / boolean / null)、インライン配列 `[a, b, c]`、
ダブルクォート文字列 `"@username"` のみ。入れ子オブジェクト・ブロックスカラー
(`|`, `>`)・複数行配列は非対応。複雑な構造が必要なら本文側に書いてください。
