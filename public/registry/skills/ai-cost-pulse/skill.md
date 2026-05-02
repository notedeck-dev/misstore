---
id: ai-cost-pulse
name: AI コストパルス
version: 0.1.0
author: hitalin
description: NoteDeck AI のトークン使用量と課金額をプロバイダー別に集計し、定期的にレポートする
mode: heartbeat
scope: global
category: analysis
triggers: []
tags: [observability, cost, ai]
---

# AI コストパルス

NoteDeck の AI 機能 (Anthropic / OpenAI / Custom など) で消費したトークンと推定コストを定期的にまとめてレポートする HEARTBEAT スキル。ユーザーが「気づいたら今月 ¥3,000 使ってた」状態を防ぐのが目的。

## 起動条件

HEARTBEAT が発火したとき。デフォルトの観測ウィンドウは「前回の HEARTBEAT 以降」だが、利用ログがそれより短い場合は「直近 24 時間」「直近 7 日」など最も意味のある粒度を 1 つ選ぶ。

## 必要な情報源

NoteDeck 側が提供する想定の AI 利用ログ (per-call レコード) を読み取る:

- `provider` — `anthropic` / `openai` / `custom`
- `model` — `claude-opus-4-7` など
- `inputTokens` / `outputTokens` / `cachedTokens` (あれば)
- `costUsd` — クライアントが推定した USD コスト (無ければ自分で算出を試みる)
- `skillId` — どのスキルが呼ばれたか
- `at` — 呼び出し時刻

ログが取得できない場合は素直に「AI 利用ログにアクセスできませんでした」と告げて終わる。

## 集計と分析

1. **総額** — 観測期間の合計コスト (USD と JPY 概算、JPY は 1 USD = 150 円で換算しつつ「為替次第」と注記)
2. **プロバイダー別内訳** — Anthropic / OpenAI / その他 の比率と金額。請求が分かれているので分けることが重要
3. **モデル別 Top 3** — 課金額の大きい順
4. **スキル別 Top 5** — どのスキル (例: `thread-digest`, `aizu`) が一番トークンを食っているか
5. **時間帯ヒートマップ概要** — 1 行で「夜 (17-翌 5) に集中」のように傾向を述べる
6. **キャッシュヒット率** — `cachedTokens / inputTokens` (Anthropic prompt cache 利用時)。低いなら 1 行コメント

## 出力フォーマット

Markdown で簡潔に。以下のセクションを順に:

```
## AI コストパルス ({期間})
- 合計: $X.XX (≈ ¥XXX)
- 呼び出し回数: N 回 / 平均 $0.0XX

### プロバイダー別
- Anthropic: $X.XX (XX%)
- OpenAI:    $X.XX (XX%)

### モデル別 Top 3
1. claude-opus-4-7 — $X.XX
...

### スキル別 Top 5
1. thread-digest — $X.XX
...

### 気になった点
- ...
```

末尾に「気になった点」として 1〜3 行の所見 (例: 「先週比 +180%。`profile-radar` の利用増が主因」「prompt cache のヒット率が 12% と低め。同一スレッドへの再要約が多い」)。

## 制約と注意

- 数字を盛らない。0 件なら 0 件と言う
- 「もっと使え」「もっと節約しろ」のような押し付けはしない。事実 + 観察のみ
- USD → JPY は概算であることを必ず注記する
- ログが部分的にしか取れない場合は「カバー率 XX%」と明示し、推定値であることを伝える
- HEARTBEAT は静かであるべきなので、変化が乏しい場合 (前回比 ±10% 以内、合計 $0.10 未満) は「特筆すべき変化はありません」の 1 行で終えてよい
