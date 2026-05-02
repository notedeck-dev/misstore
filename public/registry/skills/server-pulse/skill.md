---
id: server-pulse
name: サーバーパルス
version: 0.1.0
author: hitalin
description: 接続中の Misskey サーバーの稼働状態と API レイテンシを定期的に観測し、異常を通知する
mode: heartbeat
scope: per-account
category: analysis
triggers: []
tags: [observability, health, ops]
---

# サーバーパルス

接続中の Misskey サーバーの「いま生きてるか」「遅くなってないか」を定期的に観測する HEARTBEAT スキル。落ちる前の予兆 (応答遅延、エラー率上昇) を早めに気づきたい運用者・複数サーバー利用者向け。

## 起動条件

HEARTBEAT が発火したとき。NoteDeck にログイン済みのアカウントごとに 1 サーバーを観測対象にする (`scope: per-account`)。

## 観測内容

各 HEARTBEAT で以下を 1 回ずつ叩く:

1. `meta` — サーバーバージョン、機能フラグ、メンテナンスモード
2. `stats` — `originalNotesCount`, `originalUsersCount` 等の総量カウンタ (前回値との差分)
3. `ping` — サーバーが応答するか (応答時間 ms)
4. (任意) `notes/local-timeline` を 5 件だけ取得 — タイムラインが進んでいるか確認

各 API について **応答時間 (ms)** と **成功 / 失敗** を記録。

## 状態判定

| ステータス | 条件 |
| --- | --- |
| OK | 全 API 成功 + 応答時間が直近の中央値の 2 倍以内 |
| SLOW | 全 API 成功だが応答時間が中央値の 2〜5 倍 |
| DEGRADED | 一部 API がタイムアウトまたは 5xx |
| DOWN | `meta` または `ping` が失敗 |
| MAINTENANCE | `meta` が `maintainerNote` / メンテナンスモードを返す |

## 出力フォーマット

通常時 (OK で前回からの変化が小さい):

```
✓ {host}: OK — meta {N}ms / ping {N}ms (median: {N}ms)
```

の 1 行のみ。HEARTBEAT が静かであることを最優先する。

異常時 (SLOW 以上):

```
## サーバーパルス: {host} — {STATUS}

- meta: {N}ms ({前回比 +X%})
- ping: {N}ms
- stats: ノート数 {N} (Δ +{N})
- 直近 1 時間で {STATUS} は {N} 回目

### 推測される原因
- ...

### 推奨アクション
- ...
```

## 制約と注意

- 観測そのものでサーバーに負荷をかけないよう、API 呼び出しは上記の最小セットに留める。タイムラインを 100 件取るなどはしない
- ネットワーク側の問題 (クライアント側のオフライン) とサーバー側の問題を切り分ける。`navigator.onLine` 相当の情報があれば併記
- 「落ちました」と断定せず「応答がありません ({N} 秒タイムアウト)」のような事実ベースで報告
- per-account スコープなので、複数サーバーに繋いでいる場合は各アカウント分のレポートが個別に走る (まとめない)
- レポートはサーバー名 (`host`) を必ず含める。どのインスタンスの話か分からないと意味がない
- メンテナンス告知が `meta.maintainerNote` 等にあれば、それを 1 行引用してから判定する
