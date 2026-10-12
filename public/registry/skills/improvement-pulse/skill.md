---
id: improvement-pulse
name: 自己改善パルス
version: 0.2.0
author: hitalin
description: スキル・プラグイン・ウィジェットの使われ方とエラーを定期観測し、改善候補を台帳に蓄積する HEARTBEAT スキル
mode: heartbeat
scope: global
category: analysis
triggers: []
tags: [self-improvement, observability, heartbeat]
cheapCheckCapabilities: [plugins.list, widgets.list, skills.list, ai.sessions.list]
---

# 自己改善パルス

NoteDeck の自己拡張 (スキル / プラグイン / ウィジェット) が「作りっぱなし」にならないよう、HEARTBEAT のたびに使われ方とエラーを観測し、改善候補を台帳に積む。実際の改善はスキル庭師 (skill-gardener) や AiScript 外科医 (aiscript-surgeon) が会話の中で行う。ここでは**観測と記録だけ**を行う。

## 導入手順 (インストール直後に一度だけ)

- AI 設定で HEARTBEAT を有効にする
- 台帳を自動で育てたい場合は、AI 設定 → 権限で `ai.heartbeat` に `memos.write` を許可する (既定は読み取り専用)。許可しなくても、書き込みは「意図」として受信トレイに残る

## 起動の仕組み

frontmatter の `cheapCheckCapabilities` に挙げた一覧 (プラグイン / ウィジェット / スキル / AI セッション) のどれかが前回 tick から変化したときだけ AI が呼ばれる。変化が無い tick は AI を呼ばずに終わるので、常駐させても静か。

## 観測手順

1. `plugins.list` / `widgets.list` / `skills.list` で拡張の一覧を取り、前回から増減・有効化の変化したものを把握する
2. `ai.sessions.list` で新しいセッションがあれば概況を見る (どのスキルが発火したか、tool 呼び出しが失敗していないか)
3. `aiscript.logs` (level: error) と `logs.recent` でエラー・警告を確認し、1 の一覧と突き合わせる。どちらもデバイス側で実行される capability なので、取れない tick はこの手順を飛ばす
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
- permission_denied → 台帳に書けないので、観測結果を `heartbeat.report` の本文として報告する

## 静けさの規律

HEARTBEAT は静かであるべき:

- 新しいエラーも新しいセッションもない → tool を呼ばず `HEARTBEAT_OK` とだけ返す
- 既知の項目の再観測のみ → `HEARTBEAT_OK`
- 報告するのは**新規の気づきがあった tick だけ**。`heartbeat.report` の body に 5 行以内 (200 字目安) で圧縮して渡す。`notify` は使わない (台帳に残るものを OS 通知で割り込ませない)

## 制約と注意

- 観測は事実のみ。ログに無いことを推測で台帳に書かない
- 台帳の項目を勝手に「解決済み」にしない。解決判定は改善を適用した側 (庭師 / 外科医) の仕事
- 同じ兆候を毎 tick 重複記録しない。台帳を先に読むこと
- tool 呼び出しは 5 ラウンドまで。観測 → 台帳確認 → 記録で使い切る設計にする
