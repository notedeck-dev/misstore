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

### 説明の訳(任意)

ストアは `/en/` 以下で英語版を出します。アイテムの `name` / `description` を訳す
場合は、種別を問わずアイテムのディレクトリに `locales/<言語>.json` を置きます
(スキルの frontmatter は入れ子を書けないため、全種別で別ファイルに揃えています)。
訳が無いアイテムは英語ページでも原文をそのまま出します。

```
public/registry/plugins/my-plugin/
  meta.json
  plugin.is
  locales/en.json
```

```json
{
  "sourceHash": "e2a00de1d399",
  "description": "What the plugin does, in English."
}
```

- 対応言語は `en` のみ。原文(`meta.json` / frontmatter)は日本語のまま必須
- `description` は必須。`name` は任意(省くと原文の name を出す)。他のキーは不可
- `sourceHash` は原文の `name` / `description` のハッシュ。値は
  `pnpm run registry:build` がエラーメッセージで教えてくれるので、それを書く。
  原文を変えると訳が置き去りとしてビルドが落ちるので、訳も直してから書き換える
- NoteDeck のアプリ UI は日本語のみなので、設定画面などの UI 名は原語を併記する
  (例: `NoteDeck's AI connection settings (AI 接続設定)`)
- 生成インデックスには `locales: { en: { name?, description } }` として載る

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

**互換性と権限(`contract`):** 生成インデックスの各エントリには `contract` が付きます。
これは `pnpm run registry:build` が `plugin.is` から**自動導出**するもので、`meta.json` には
書きません(書いても無視されます)。宣言 `permissions` は導出された `contract.permissions` を
**含む**必要があり、乖離は CI(`scripts/verify-contract.mjs`)が検出します。build 自身は
導出時の問題を warning として出すだけで落としません。

```json
"contract": {
  "runsOn": ["notedeck", "misskey-web"],
  "profile": "safe",
  "permissions": ["memos.read"],
  "ndCalls": ["memos.search"], "mkApi": ["users/show"], "hooks": ["note_action"],
  "external": false, "unresolved": []
}
```

ストアはこれをバッジと絞り込みに使います。

- `runsOn` — `misskey-web` を含めば「本家でも動く」、含まなければ「NoteDeck 専用」
  (`exists NOTEDECK` で分岐し本家では `Nd:*` を呼ばない書き方が両対応の条件)
- `profile` — 動く最小の権限プロファイル。`readonly` =「読み取りのみ」、`safe` =
  「標準で動く」(既定プロファイルで追加許可なし)、`full` =「要 full 権限」。`null` は判定なし
- `external` — `true` なら「外部通信」バッジ(Secret Vault 経由を含む外部サービスへの送信)
- `permissions` — 呼び出しから導出した必要 permission key(NoteDeck の語彙)。詳細ページで
  宣言 `permissions` と突き合わせ、宣言に無いものは点線で示す
- `ndCalls` / `mkApi` / `hooks` — 実際に呼ぶ `Nd:call` / `Mk:api` / フックの一覧。詳細ページの
  「導出した呼び出し」に出す
- `unresolved` — 宛先が設定値など静的に決まらない呼び出し。件数が詳細に出る

**NoteDeck と本家 Misskey Web の差分(両対応で書くときの注意):**

- NoteDeck の `Mk:api` は失敗時に **throw** する(本家は `error` 値を返す)。AiScript に
  try/catch は無いので、失敗しうる呼び出しは事前確認で避ける(例: `meta` の
  `translatorAvailable` を見てから `notes/translate`)。`Core:type(res) == "error"` 判定は
  本家互換のために残してよい([notedeck#1249](https://github.com/notedeck-dev/notedeck/issues/1249))
- `Nd:http` の通信断(DNS 失敗・接続拒否・タイムアウト)は throw ではなく `status: 0` +
  `error` の値で返る([notedeck#1294](https://github.com/notedeck-dev/notedeck/issues/1294))。
  HTTP の 4xx / 5xx と同じ `status` 分岐に乗せ、`res.status == 0` で「通信できません」を描く。
  `Nd:call("http.fetch")` / `Nd:call("vault.fetch")` も同形
- `Nd:call` が `error` 値を返すのは確認ダイアログのキャンセル(`user_cancelled`)だけ。
  権限拒否は throw するので、既定プロファイルで許可されていない capability
  (`account.write` / `styles.write` / `network.external` 等)を使うなら
  `meta.permissions` の `resolved` で先に判定して案内する
- `Nd:on` / `Nd:register_command` の handler にはアカウント文脈が無く `Mk:api` は使えない。
  `Nd:call` に `accountId` を明示する。`note:new` / `notification:new` の payload は
  id 列だけなので、本文は `notes.show` / `notifications.list` で取り直す
- `streaming:status` は WebSocket の接続状態ではなくアカウントの onlineStatus
  ([notedeck#1240](https://github.com/notedeck-dev/notedeck/issues/1240))。接続監視は
  `metrics.read` をポーリングする
- `Nd:register_command` で登録したコマンドには現状キーバインドが届かない
  ([notedeck#1243](https://github.com/notedeck-dev/notedeck/issues/1243))
- プラグインに渡るグローバル定数は `LOCALE` のみ。`exists NOTEDECK` で NoteDeck 判定し、
  本家では `Nd:*` を呼ばずトーストで知らせる

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

**互換性と権限(`contract`):** プラグインと同じく、build が `widget.is` から自動導出して
生成インデックスに付けます(`meta.json` には書かない)。ウィジェットは常に NoteDeck 専用なので
`runsOn` は `["notedeck"]` 固定でバッジは出さず、`profile`(読み取りのみ / 標準で動く /
要 full 権限)と `external`(外部通信)がカードに、`ndCalls` / `mkApi` / `hooks` /
`unresolved` が詳細の「導出した呼び出し」に出ます。フィールドの意味は
[プラグイン節](#プラグイン)を参照。導出結果と `capabilities` の乖離は CI が検出します。

**NoteDeck 固有の注意:**

- `Ui:C:text` も MkMfm で描かれるため、ユーザー・サーバー由来の文字列を直接出すと MFM
  インジェクションになる。`button` の text / `folder` の title / `Mk:dialog` に出すか、
  `$[` `[` `]` `<` `>` `` ` `` `@` `://` を全角化してから `mfm` に入れる
- `Ui:C:mfm` の `font` prop は無視される。等幅は MFM の `$[font.monospace ...]` で
  ([notedeck#1249](https://github.com/notedeck-dev/notedeck/issues/1249))
- `.update()` が効くのは `mfm` / `container`(children)/ `folder`(children, title)/
  `select`(default)。動的部分は `container` で包んで children を再生成し、`textInput` を
  含むサブツリーは再生成しない(フォーカスが外れる)
- ウィジェットには `THIS_ID` / `USER_ID` / `LOCALE` / `SERVER_URL` が渡る。アカウント文脈は
  `account.current` で取り(全アカウントカラムでは null)、`Nd:call` に `accountId` を渡す

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
  のみ / bot / センシティブ)は**配布しない**。組込側の方が精度が高く、クエリでは劣化
  コピーになる。組込トグルと逆向き(bot だけに絞る等)や細分(動画だけ等)は配布してよい。
- 分子クエリ(AND / OR / 否定の合成)にするのは、And 合成では組めない形
  (OR・連言の否定・フィールド横断比較)のときだけ。基準と、原子クエリをどのアイテムが
  例示しているかの対応表は [query-coverage.md](query-coverage.md)。

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
**任意:** `category`(既定 `utility`), `triggers`(既定 `[]`), `cheapCheckCapabilities`,
`isPersona`, `iconUrl`, `tags`, `authorUrl`, `license`, `repository`, `builtIn`

**カテゴリ:** `language` / `composing` / `analysis` / `persona` / `utility`

**mode:** スキルが AI に与えられる起動条件

- `always` — 常に有効(system prompt に常時合成)
- `manual` — ユーザーが UI から選んだ時だけ有効
- `trigger` — ユーザーの入力文に `triggers` のいずれかが**部分一致**(大文字小文字無視)
  したときだけ合成される。文脈イベント(投稿中・ノート閲覧中など)に反応する仕組みでは
  ないので、ユーザーが実際に打ちそうな語を並べる。`triggers` が空だと登録時に拒否される
- `heartbeat` — NoteDeck の HEARTBEAT(定期実行)で起動。1 tick につき AI 呼び出しは 1 回で、
  heartbeat スキル全件の本文がまとめて渡される。報告は `heartbeat.report` で返し、
  報告が無ければ tool を呼ばず `HEARTBEAT_OK` だけを返す設計にする

上記以外の値はインストール時に `manual` として扱われる。`scope` はインストール時に無視される
(現状は常に全アカウント)。

**cheapCheckCapabilities:** heartbeat スキル向け。ここに挙げた capability を `{}` 引数で
実行して結果が前回 tick から変化したときだけ AI を呼ぶ(変化が無ければ課金もない)。使えるのは
**notemaid 単独で実行できる(exec: core)かつ cheap な capability だけ**で、それ以外
(`logs.recent` / `aiscript.logs` / `metrics.read` などデバイス側のもの)を含むとインストール自体が
拒否される。HEARTBEAT には文脈アカウントが無いため、アカウント依存の capability は変化検知に
使えない。実際に効くのはローカル系(`memos.list` / `plugins.list` / `widgets.list` /
`skills.list` / `queries.list` / `ai.sessions.list` / `meta.*`)。

**isPersona:** `true` にすると AI ペルソナとして扱われる(`always` と組み合わせる)。

**iconUrl:** ストア側の `icon.svg` から自動で入るので、通常は書かない。

**互換性と権限(`contract`):** build が `skill.md` から自動導出して生成インデックスに付けます
(frontmatter には書かない)。スキルは常に NoteDeck 専用なので `runsOn` バッジは出さず、
`profile` が判定できたときだけ「読み取りのみ / 標準で動く / 要 full 権限」、`external` が
`true` なら「外部通信」をカードに出します。本文や `cheapCheckCapabilities` から導出した
capability 一覧は詳細の「導出した呼び出し」に出ます。フィールドの意味は
[プラグイン節](#プラグイン)を参照。宣言(`cheapCheckCapabilities`)と導出の乖離は CI が検出します。

### Frontmatter パーサの制約

build script は最小実装の YAML frontmatter パーサを使います。サポートは
スカラー(string / number / boolean / null)、インライン配列 `[a, b, c]`、
ダブルクォート文字列 `"@username"` のみ。入れ子オブジェクト・ブロックスカラー
(`|`, `>`)・複数行配列は非対応。複雑な構造が必要なら本文側に書いてください。
