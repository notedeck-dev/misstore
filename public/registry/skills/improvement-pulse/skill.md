---
id: improvement-pulse
name: 自己改善パルス
version: 0.1.0
author: hitalin
description: スキル・プラグイン・ウィジェットの使われ方とエラーを定期観測し、改善候補を台帳に蓄積する HEARTBEAT スキル
mode: heartbeat
scope: global
category: analysis
triggers: []
tags: [self-improvement, observability, heartbeat]
cheapCheckCapabilities: [logs.recent]
---

# 自己改善パルス

NoteDeck の自己拡張 (スキル / プラグイン / ウィジェット) が「作りっぱなし」にならないよう、HEARTBEAT のたびに使われ方とエラーを観測し、改善候補を台帳に積む。実際の改善はスキル庭師 (skill-gardener) や AiScript 外科医 (aiscript-surgeon) が会話の中で行う。ここでは**観測と記録だけ**を行う。

## 導入手順 (インストール直後に一度だけ)

- ストア経由のインストールでは mode が manual に落ちることがある。スキル編集画面でこのスキルの mode を `heartbeat` に戻す
- AI 設定で HEARTBEAT を有効にする
- 台帳を自動で育てたい場合は、AI 設定 → 権限で `ai.heartbeat` に `memos.write` を許可する (既定は読み取り専用)

## 観測手順

1. `logs.recent` で前回 tick 以降のエラー・警告を確認する
2. `ai.sessions.list` で新しいセッションがあれば概況を見る (どのスキルが発火したか、tool 呼び出しが失敗していないか)
3. `plugins.list` / `widgets.list` で有効な拡張の一覧を確認し、ログのエラーと突き合わせる
4. `memos.search` で「改善台帳」(tags: [improvement-ledger]) を読み、既知の項目と重複していないか確認する

## 記録

新しい気づきがあれば台帳に 1 件ずつ追記する:

```
- 種別: skill | plugin | widget
- 対象: <id>
- 兆候: <観測した事実。ログの抜粋やセッションでの挙動>
- 提案: <1 行。例: trigger 語の追加 / null ガードの追加>
- 状態: 未着手
```

- `memos.write` が使える → `memos.create` / `memos.update` で台帳に書く
- permission_denied → 台帳に書けないので、観測結果をレポート本文としてそのまま出力する

## 静けさの規律

HEARTBEAT は静かであるべき:

- 新しいエラーも新しいセッションもない → `HEARTBEAT_OK` とだけ返す
- 既知の項目の再観測のみ → `HEARTBEAT_OK`
- 報告するのは**新規の気づきがあった tick だけ**。そのときも 5 行以内に圧縮する

## 制約と注意

- 観測は事実のみ。ログに無いことを推測で台帳に書かない
- 台帳の項目を勝手に「解決済み」にしない。解決判定は改善を適用した側 (庭師 / 外科医) の仕事
- 同じ兆候を毎 tick 重複記録しない。台帳を先に読むこと
- tool 呼び出しは 5 ラウンドまで。観測 → 台帳確認 → 記録で使い切る設計にする
