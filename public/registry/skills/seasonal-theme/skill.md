---
id: seasonal-theme
name: 季節テーマ persona
version: 0.2.0
description: 月に 1 度、現在のテーマを読んで季節感に合わせた配色微調整テーマを新規作成して提案する。AI が住居のインテリアを衣替えする体験。
author: "@hitalin"
authorUrl: "https://github.com/hitalin"
category: persona
mode: manual
scope: global
tags: [theme, seasonal, ai]
license: MIT
---

# 季節テーマ persona

このスキルは「**AI が NoteDeck の見た目を季節と一緒に育てる**」のデモ。AI が
月に 1 度 (= HEARTBEAT で動かす想定、または `@seasonal-theme` で明示呼出し)、
現在の月と季節を踏まえて配色を提案し、新規テーマとして install する。

`theme.apply` (適用) はユーザー判断に任せる — AI は **作って提案するだけ**。
気に入らなければ削除すればいい。

## 起動方法 (ユーザー判断)

- **明示呼出し**: チャットで `@seasonal-theme` または「季節テーマ作って」
- **HEARTBEAT 自動化**: mode を `heartbeat` に切り替え。`Mk:save` で
  「前回提案月」を記録しておくと毎月 1 回だけになる

## 動作

1. **現状把握**: `theme.list` で現在の installedThemes 一覧を取得し、
   `theme.read` で現在 active なテーマの props (CSS 変数) を読む
2. **判定**: 現在の月 (= `time.now` から抽出) に対応する季節キーワードを
   ピックアップ
   - 1〜2 月: 凛とした冬・雪・霜
   - 3〜5 月: 桜・新緑・春霞
   - 6〜8 月: 紫陽花・夏空・涼風
   - 9〜11 月: 紅葉・実り・夕焼け
   - 12 月: 冬至・キャンドル
3. **`Mk:save` で前回提案月を確認**: 同月内に既に提案していれば 5 へ (skip)
4. **生成**: `theme.create` で新規テーマを作成
   - `reason` にその月を選んだ根拠 (例:「4 月なので桜の淡紅を accent に置いた」)
     を渡す。既存 id を上書きした場合に編集履歴へ残り、前の配色に戻せる
   - 既存テーマの **base 色構造はそのまま** (= 機能色は触らない)
   - `accent` / `panel` / `bg` / `link` などの彩色系を季節に合わせて微調整
   - name は `<元テーマ名> + <季節タグ>` (例: 「mi-dark + 桜の春」)
5. **完了**: `ui.notify` で「新テーマ作成 → テーマ一覧から適用可」を伝える。
   ユーザーが気に入れば `theme.apply`、気に入らなければ `theme.delete` 相当
   (現状は手で削除)

## 暴走防止

- **同月内に複数作らない** (`Mk:save` で月キーを管理)
- 提案テーマは **必ず新規 id で作る** (= 既存テーマを上書きしない)
- `theme.apply` は AI が勝手に呼ばない (ユーザー操作に委ねる)

## 振り返り

`@seasonal-theme` で「これまで作ったテーマは?」と聞かれたら、`theme.list`
で抽出した seasonal-theme 系 (storeId は null、name に季節タグを含む)
を一覧表示する。

## 提案例 (5 月 / 新緑)

現在 active が `mi-cherry-light` (桜色アクセント) のとき、5 月の新緑を踏まえて
こう提案する想定:

- name: `mi-cherry-light + 新緑の五月`
- 変更箇所 (差分のみ、機能色は据え置き):
  - `accent`: `rgb(219, 96, 114)` → `rgb(135, 175, 95)` (桜 → 若葉)
  - `link`: `rgb(156, 187, 5)` → `rgb(98, 156, 80)` (やや落ち着いた緑へ)
  - `panel`: `rgb(255, 255, 255)` → `rgb(252, 254, 248)` (微かに緑寄りのオフホワイト)
  - `divider`: わずかに緑系のアルファ値へ

このように、`accent` と `link` 周辺だけを季節に寄せ、`fg` / `bg` / `panel` の
明度構造は触らないので「**あなたが選んだテーマ感**」は失われない。気に入ら
なければテーマ一覧から削除するだけ、適用は `theme.apply` 相当をユーザーが
明示するまで起きない。

## 自己拡張デモとしての位置づけ

このスキルは「**AI が NoteDeck の見た目を毎月作って提案する**」体験。
`theme.create` という土台の API を、人間を仲介させずに「住居の衣替え」として
使い切る。プラグインを書かなくても、skill だけで NoteDeck が AI と共に
時間とともに育つ。
