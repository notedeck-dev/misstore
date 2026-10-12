---
id: time-capsule
name: タイムカプセル (1 年前の今日)
version: 0.2.0
author: hitalin
description: 手元に貯まった自分の過去ノートから「1 年前 / N 年前の今日」を 1 日 1 回掘り出して見せる
mode: heartbeat
scope: global
category: analysis
triggers: []
tags: [memory, nostalgia, digest]
---

# タイムカプセル

自分のノートから **「1 年前の今日」「2 年前の今日」… の投稿** を掘り出して、1 日 1 回だけそっと差し出す HEARTBEAT スキル。Twitter Memories の Misskey 版。

## 導入手順 (インストール直後に一度だけ)

- AI 設定で HEARTBEAT を有効にする。間隔は 1 日 1 回程度 (例: 1440 分) が合う
- AI 設定 → 権限で `ai.heartbeat` に `notes.readArchive` を許可する。過去の日付を指定して自分のノートを引けるのは手元アーカイブの検索 (`notes.searchArchive`) だけで、既定の読み取り専用権限には含まれていない
- 手元アーカイブには NoteDeck を使い始めてから画面に流れてきたノートしか無い。使い始めて 1 年未満なら「1 年前の今日」は見つからないのが正常

## 手順

1. `account.list` でアカウント一覧を取る (HEARTBEAT には文脈アカウントが無い)。各アカウントの `username` と `host` から自分の投稿者表記 `name@host` を組む
2. 「今日の月日」を確定する。タイムゾーンはユーザー設定が分かればそれ、分からなければ Asia/Tokyo
3. N = 1 から順に、`notes.searchArchive` を `author` = 自分、`since` = N 年前の同日 0:00、`until` = 同日 23:59:59 (ISO 8601)、`accountIds` = そのアカウント、`limit` 100 で呼ぶ。`includePrivate` は false のまま (公開ノートだけを掘り出す)
4. N の上限は 5。tool 呼び出しは 5 ラウンドまでなので、見つからない年が続いたら途中で打ち切ってよい
5. `permission_denied` が返ったら、初回だけ `heartbeat.report` で「`notes.readArchive` の許可が必要」と伝え、以降の tick は `HEARTBEAT_OK` で終える

## 選別

該当ノートが多い (10 件超) なら、以下の優先度で 3 件だけ選ぶ:

1. テキスト長 100 文字以上の内省的なノート
2. リプライではない自発投稿
3. CW 付きでないもの

## 出力

報告は `heartbeat.report` の body で返す (`notify` は使わない)。1 年分につき 1 件を目安に、合計 200 字程度に収める:

```
タイムカプセル {YYYY-MM-DD}
1 年前: 「{冒頭 80 文字}…」
2 年前: 「{冒頭 80 文字}…」
```

該当が 0 件なら tool を呼ばず `HEARTBEAT_OK` とだけ返す (「見当たりませんでした」の報告は出さない。毎日の静けさを優先する)。同じ日に既に報告していれば同じく `HEARTBEAT_OK`。

## 制約と注意

- **本人のノートのみ**。他人の過去ノートを掘り起こさない (リプライ先も引用しない)
- CW 付きのノートは「[CW: 理由]」だけ表示し、本文は出さない
- 過去の自分が言ってることに対して **評価しない**。「黒歴史」「成長したね」みたいな茶化しは禁止。事実として並べるだけ
- ネガティブな内容 (体調不良、葬儀、別れなど) でも検閲はしないが、挨拶や感想は付けない
- 複数アカウントがあれば、アカウントごとに 1 ブロックにし、どのアカウントの話か分かるように `@username@host` を添える
