# 拡張セット(宣言ファイルによるまとめてインストール)— 設計メモ

状態: 提案(2026-10-12)。misstore 側の配布形式と NoteDeck 側の取り込みを分けて書く。

## 動機

配布物が 260 件を超え、連携して初めて意味を持つ組が増えた(例: note-to-memo /
thread-to-memo / daily-note / note-context / memo-inbox / memo-gardener / memo-recap の
PKM 7 件、reading-list プラグインとウィジェットの対)。今は 1 件ずつ入れるしかなく、
「何から入れればいいか」が新規ユーザーの最初の壁になっている。

VS Code の体験を手本にする。

| VS Code | NoteDeck / misstore での対応 |
|---|---|
| `.vscode/extensions.json` の `recommendations` | **セット**: ストアが配布する「おすすめの組」。開くと未導入分が提案される |
| Profiles / Settings Sync | **自分の構成の書き出し・取り込み**: 導入済み配布物を同じ形式で書き出し、別端末や友人へ渡す |
| 拡張パック | セットの一種(`items` だけで `recommendations` が無いもの) |

## 形式(案)

ストアも NoteDeck も同じ 1 つの JSON を読む。misstore は `public/registry/sets/<id>/set.json`
として配布し、ユーザーは手元のファイルや URL からも取り込める。

```json
{
  "format": "notedeck-extension-set/1",
  "id": "pkm-kit",
  "name": "PKM キット",
  "description": "ノートをメモに貯めて、文脈で引き、週に一度振り返る",
  "items": [
    { "kind": "plugin", "id": "note-to-memo" },
    { "kind": "plugin", "id": "thread-to-memo" },
    { "kind": "plugin", "id": "daily-note" },
    { "kind": "widget", "id": "note-context", "autoRun": true },
    { "kind": "widget", "id": "memo-inbox", "autoRun": true },
    { "kind": "skill",  "id": "memo-gardener" },
    { "kind": "skill",  "id": "memo-recap" }
  ],
  "recommendations": [
    { "kind": "theme", "id": "paper-mono", "reason": "読み物向けの配色" }
  ]
}
```

- `items` は「このセットを入れる = 全部入れる」もの。`recommendations` は提案だけで自動では入れない
- 各要素はストアの `kind` と `id`(= storeId)で指し、取り込み側は misstore の index から
  `apiUrl` と `sha512` を解決してから既存の `*.install` capability で入れる(sha 検証は従来どおり)
- 要素ごとの任意フィールドは種別固有の「入れた直後の状態」だけに限る:
  `widget.autoRun`、`theme.apply`(入れてすぐ適用)、`skill.mode` は書かない(配布物側の mode を尊重)
- 設定値(プラグインの config、Secret Vault の接続)はセットに含めない。ストアがユーザーデータを
  持たない原則(security-principles P6)と、設定の中に鍵が入りうることから

## ストア側(misstore)

1. 種別 `sets` を追加: `public/registry/sets/<id>/set.json` + `meta.json`(name / description /
   author / tags)。`registry:build` が `sets.json` を生成し、各要素の存在と sha を検証する
   (存在しない id を指すセットはビルド失敗)
2. 一覧・詳細ページ: 含まれる配布物をカードで並べ、「NoteDeck で開く」ボタンを置く
   (deep link の形式は NoteDeck 側の実装に合わせる。まずは set.json の URL をコピーする形でよい)
3. 最初のセット候補: PKM キット / 通知整理キット(notification-digest, reply-queue, vip-notify,
   notification-triage)/ アクセシビリティキット(high-contrast-*, cud-*, keybinds-cheatsheet)/
   運営者キット(federation-radar, server-trend-chart, announcements, health-monitor)/
   しずかな TL キット(calm-timeline, spam-guard, long-hide, foreign-reply-hide)
4. セットの中身の整合性は契約テスト(docs/design/contract-check.md)に載せる: 要素が取り下げられたら
   セットのビルドが落ちる

## NoteDeck 側(要望)

1. **取り込み**: ファイル / URL / クリップボードから set.json を読み、導入済みとの差分を一覧で見せ、
   未導入分を既存の `plugins.install` 等でまとめて入れる(確認ダイアログは 1 回にまとめる)
2. **書き出し**: 導入済みのうち storeId を持つものを同じ形式で書き出す(`files.export`)。
   ローカル作成物は含めない(ソースを他人に渡す行為になるため)
3. **同期(任意)**: セットの URL を覚えておき、ストア側で要素が増減したら通知する。自動更新はしない
4. **サーバー推奨(将来)**: サーバー管理者が自鯖向けのセット URL を公開し、そのサーバーのアカウントを
   追加したときに提案する(VS Code のワークスペース推奨に相当)。Misskey 側のメタに置き場が無いので
   当面は NoteDeck 設定への手入力

## 決めていないこと

- 名前(セット / キット / プロファイル)。本文では「セット」
- 「おすすめ」をストアのトップに出すかどうか。評価・DL 数は出さない方針(design.md)なので、
  並べる根拠は「編集部が組んだ」であって人気順ではない
- deep link のスキーム(`notedeck://set?url=...`)と、Web 版 NoteDeck での扱い
