# Security Design — misstore

[`security-principles.md`](../../security-principles.md)(P1–P7、ロック文書)から
導出される**仕様層**。批判的検証の記録は [`redteam-log.md`](redteam-log.md)。

## アーキテクチャ(2026-08 確定)

```
投稿/更新 ── GitHub PR ──▶ CI(GitHub Actions)機械チェック ──▶ 高権限のみ人手
                                                                      │
                                          保護された main へマージ ◀──┘
                                                      │
                                    registry:build ──▶ 静的配信(store.notedeck.io)
                                                      │
利用状況 ── NoteDeck クライアントがローカル所有(ストアは持たない)
失効 ────── revoked.json(静的)を NoteDeck / ストア UI がクライアント側で照合
```

- **ログイン・アカウント・サーバー側ライブラリは無い**(P6)。作者同一性は GitHub
  アカウント。利用状況はユーザーの手元(データ主権はユーザー側)。
- セキュリティは **CI による機械的担保 + 高権限アイテムのみ人手**。投稿量が小さい
  うちは人手が全行を読めるので、これで足りる。

## 実装状態の凡例

現在形の記述を「稼働中」と読まないこと。**【未実装】/【一部】/【実装済み】** を各 S に付す。
現況(2026-08): `.github/` に CI 骨組みを新設(本コミット)。`build-registry.js` は
必須フィールド + sha512 + frontmatter パースのみ。main の branch protection・
`revoked.json` は未整備。

## 脅威モデル

| # | 脅威 | 深刻度 | 備考 |
|---|------|--------|------|
| T1 | 悪意あるアイテムの新規掲載 | 高 | plugins/widgets は `Mk:api`/`Nd:call` でアカウント全権級 |
| T2 | 信頼済みアイテムの更新経由の攻撃 | 高 | 既存権限内なら Tier も上がらない (R1-J) |
| T4 | ストア基盤・デプロイ平面の侵害 | 高 | デプロイ平面が第二経路 (R1-B) |
| T5 | typosquatting / なりすまし | 中 | homoglyph 検査を name にも (R1-L) |
| T6 | skills の prompt injection / クロス Tier 越境 | 中〜高 | skill→`plugins.create` (R1-G) |
| T10 | 運営消滅・ドメイン失効 | 中〜高 | 悪意でなく「消滅」(R1-T) |

**アーキテクチャ変更で消えた脅威**: T3(投稿者 acct 乗っ取り)は作者同一性が GitHub に
移り縮小。T7(MiAuth 脆弱性)・T8(ライブラリ privacy)・T9(ログインフィッシング)は
**ログイン/サーバーライブラリを持たないため消滅**(redteam-log Round 3 参照)。

---

## S1. 公開経路は GitHub PR 一本 + デプロイ平面の検出 — P2 / T4 / R1-B,C

【状態: 未実装(branch protection 無し・生成物 git 追跡下)】

- アイテム公開の唯一の入口は GitHub PR → 保護 main マージ → `registry:build` →
  静的配信。動的な書き込み経路は存在しない。
- **生成物を git から追放 (R1-C)**: `public/registry/**/api.json` と
  `public/registry/*.json` を `.gitignore` に入れ、`"build"` を
  `"pnpm registry:build && vue-tsc --noEmit && vite build"` に。レビュー対象が
  ソースのみになり「表示・配布・ハッシュの乖離」の置き場が消える。
  移行途中は CI で `registry:build && git diff --exit-code`。**ただし先に S4 の
  ビルド決定化が必要**(現状 index に `updatedAt: now` が入り常に diff が出る、R2-1)。
- **デプロイ平面 (R1-B)**: デプロイは Workers Builds のみ、トークンは単一 Worker
  スコープ。人間は長命トークンを持たず `pnpm deploy` を常用しない。git 迂回配信の
  検出は「git 由来の期待ハッシュ vs 実配信バイト」の突合で行う。**規模的に常設の
  外部モニタは過剰(赤チーム現実主義)** — 当面は CI + 数回/年の手動突合で足りる。
- main: 直接 push 禁止・署名コミット・force-push 禁止・self-merge 禁止。
- `build-registry.js` の `SITE_URL` env override を廃しリポジトリ内定数に(R1 補足)。

## S2. CI ゲート + 高権限のみ人手 — P4, P7 / T1 / R1-E,M

【状態: 一部(CI 骨組みを新設。深い解析は未実装)】

配布は GitHub PR なので、審査は **GitHub Actions が全 PR で機械チェック** し、
**危険候補フラグが立ったアイテムだけ人間が読む**。「人力最小」を実現しつつ CI を
万能と誤認しない。

| クラス | 対象 | 担い手 |
|---|---|---|
| 機械的(構造的担保) | 正規テキスト(S9)・SVG(S12)・ID=dirname 全種別(S11)・storeId 形式 + 全 kind 横断一意 + テーマ内部 ID 一意(notedeck#913)・生成物/ソース乖離・サイズ上限・必須フィールド・sha512 整合・ホスト関数リテラル限定 best-effort | CI(`scripts/check-registry-integrity.mjs`) |
| 論理(人手必須) | ロジックボム・権限と説明の釣り合い・第2引数の宛先・config 駆動の引数 | 人間(CI が候補フラグを提示) |

- Tier は種別でなく**導出されるホスト関数**で決める。`write:*` / `Nd:http` /
  `vault.fetch` / `files.export` / `i/webhooks/*` / `plugins.*` を導出するアイテムは
  高権限 = 人手必須。**queries は AiScript(実行コード)なので低リスク扱いしない (R1-E)**。
- themes も「確認画面を描画する層」なのでコントラスト/値域 lint を通す (R1-F)。生 CSS
  文字列(先頭 `"`)や `$` 定数参照を含むテーマは人手へ (R2 付随)。
- **投稿量が小さいことが最大の資産**。月数件なら全高権限アイテムを人間が読める。
  スケールしたら「キュー閾値超で新規受理を自動停止」を検討(それまでは不要)。

## S3. 権限は導出して客観表示 — P5 / T1 / R1-I,P

【状態: 未実装】

- `permissions` は投稿者の宣言でなく **CI が AST から導出した値**を表示(S10)。
  宣言は導出との照合にのみ使い、過少/過剰宣言はともに掲載不可 (R1-J)。
- **エンドユーザー向けは「危険度フラグ + 説明との不整合」を提示** (R1-P)。エンドポイント
  名の羅列は consent fatigue で読まれない。「⚠ このテーマ系プラグインは投稿できます」の
  ように**ストアが判断を出す**。詳細な導出結果は折りたたむ。
- 導出は**引数レベル**まで(`visibility`/`visibleUserIds`/webhook `url`)(R1-I)。
  サーバ側に永続副作用を残す操作は「アンインストール後も残る」フラグ。
- **客観 signal のみ表示**(design.md 118-120 の指標禁止と整合): CI チェック合格・
  作者 GitHub 検証済み・独立コントリビュータ数・最終更新。**☆評価・DL 数は出さない**
  (連合ネットワークでは Sybil で水増し自由なため信頼 signal として機能しない)。

## S4. バージョン不変・ハッシュ固定・ビルド決定化 — P3 / T2 / R1-J / R2-1,2

【状態: 未実装】

- 公開済み (id, version) は不変。同一 version の内容変更は CI が reject。
- **ビルドを決定的にする (R2-1)**: index の `updatedAt: now`(壁時計)を除去。日付は
  git 由来のみとし、`meta.createdAt`/`meta.updatedAt` を**禁止フィールド**にする
  (R2-2、現状 self-申告が git に優先し「突然更新」フラグを無効化できる)。これが無いと
  S1 の `git diff --exit-code` が常に失敗する。CI は `fetch-depth: 0`。
- 更新の Tier は導出ホスト関数集合の差分で決める(permissions 増減でなく)(R1-J)。
- インストール URL の `hash=<sha512>` は掲載時点で固定(TOCTOU 防御)。
- NoteDeck が自動取得する場合はインストール時 sha512 にピン留めし、変化時は自動適用
  せずユーザー確認。live fetch は禁止(S14)。

## S5. 失効(kill switch)— P7 / T1, T2 / R1-O

【状態: 未実装(revoked.json 不在 = P7 現在進行違反)】

- `public/registry/revoked.json` を**空配列で即作成**し、UI 警告を前倒しする。
  形式 `{type, id, versions, reason, date}`。
- **ログイン不要のクライアント側照合**: NoteDeck / ストア UI が revoked.json を
  フェッチしローカルの利用/表示と突合。ユーザーデータをストアに送らずに失効が効く。
- `revoked.json` は `Cache-Control: max-age=0, must-revalidate`(現状 `/registry/*` の
  300 秒に巻き込まれる、R2-19)。失効は「ファイル削除」でなく「revoked.json 追加 +
  該当エントリの明示無効化」。SPA fallback で 404 が 200 化する問題も塞ぐ(R2-19)。
- **限界**: 素の Misskey のインストール済みコピー・`i/webhooks` 等の永続副作用には
  届かない。ゆえに重心は S2 の事前審査。`SECURITY.md` + 通報窓口 + 一次応答目標。

## S6. 作者の同一性 = GitHub アカウント — T5

【状態: 実装(GitHub の仕組みに委譲)/ 表示は未実装】

- 配布が GitHub PR になったことで、作者の同一性は **GitHub アカウント + git 署名**が
  担保する。旧仕様の MiAuth acct 錨(`(host, remote_user_id)`)や acct 偽装対策は**不要**
  になった(認証系の攻撃面ごと消滅、redteam-log Round 3)。
- レガシー author 文字列(`hitalin`/`@hitalin`/`@hitalin@yami.ski`/`syuilo` 等の混在)を
  正規化し、`meta.json` の `author` は表示用、権威は PR の GitHub アカウント。
- typosquatting 対策(R1-L): `id` のレーベンシュタイン類似検出 + `name`/`description` の
  homoglyph/bidi 検査(S9)。

## S9. 正規テキスト形式の強制 — P4 / T1, T6 / R1-L / R2-17

【状態: 一部(CI 骨組みで bidi/ゼロ幅/BOM/CRLF/`meta.id` を検査)】

- CI で reject: Unicode 双方向制御文字(U+202A–202E, U+2066–2069)/ ゼロ幅・不可視
  文字 / BOM / CRLF 混在。検査対象は ID だけでなく `name`/`description`/表示名にも (R1-L)。
- **絵文字 ZWJ の例外 (R2-17)**: `👨‍👩‍👧`・VS16 等を一律 reject すると日本語圏の name が
  落ちる。ZWJ/VS は UTS #51 RGI シーケンスとして妥当なもののみ許可(骨組みでは
  ZWJ を警告、bidi 制御は hard-fail)。
- **bidi は入力検査でなく表示の分離でも解く (R2-17)**: SPA のアイテム由来テキストを
  `<bdi>`/`unicode-bidi: isolate`/`dir="auto"` で包み、セキュリティ表示と同じ bidi
  段落に置かない。
- theme UUID の形式検査 + Misskey 標準テーマ UUID 衝突検査(現行 `ame` に非 hex UUID)。

## S10. 権限を全ホスト関数から導出 — P4, P5 / T1 / R1-A,H,I / R2-6

【状態: 未実装。**設計の中核。天井あり**】

- 導出対象は**全ホスト関数**: `Mk:api`/`Plugin:register_*`/`Mk:save` に加え **`Nd:`
  名前空間全体(`Nd:call` の全 capability、`Nd:http`)** を必ず含める (R1-A)。
- ホスト関数は `関数名(リテラル, …)` の構文形でのみ出現可。束縛/引数渡し/格納は
  reject (R1-H)。`Nd:http`/`vault.fetch` は meta にホスト allowlist を宣言させ照合。
- **静的導出の天井を明記 (R2-6)**: `vault.fetch` の第2引数(`connectionRef`/`path`)や
  `Plugin:config` 由来の引数、一級関数経由は完全には静的導出できない。CI はこれらを
  **「導出不能 = 最悪ケース(任意宛先)」として赤フラグ**にし、人間が読む(P4 の天井)。
- 実装には Misskey/NoteDeck と同一バージョンの `@syuilo/aiscript` を依存に固定し、
  その parser の AST 上で判定する(正規表現は R1-H の回避に無力、R2-5)。
- 注: エイリアス回避の実挙動は AiScript Playground で 1 行検証してから実装(R1-H)。

## S11. 詳細ページ = 監査ページ / アイテム同一性 — P1, P3 / R1-C / R2-3

【状態: 一部(表示はあるが sha512 は index 値の素通し、`meta.id` 検査は CI 骨組みで追加)】

- インストールされる正確なソース全文を常時表示 + バージョン間 diff(git 履歴)。
- **IntegrityCard は表示中ソースから WebCrypto で sha512 を再計算し index 値と突合**
  (R1-C)。詳細ページは実際に install される `api.json` の `data` を表示。
- **`meta.id` はディレクトリ名と一致必須 (R2-3, R1 D1)**: 別ディレクトリから既存 `id` を
  名乗るとアイテム乗っ取り(URL/ハッシュを奪取)ができる。CI で `meta.id !== dirname` を
  reject(理想は `meta.id` を廃し ID をディレクトリ名に一本化)。

## S12. `icon.svg` のサニタイズ — P1

【状態: 一部(CI 骨組みで script/on*/foreignObject/外部 href を検査)】

- CI: `<script>`/`<foreignObject>`/`on*` 属性/外部 `href`/`data:` URI を含む SVG は
  reject(許可要素ホワイトリスト)。
- 配信: `/registry/*` に `Content-Security-Policy: default-src 'none'; style-src
  'unsafe-inline'`。理想は `icon.svg` を別オリジン配信 (R2-20)。`_headers` の
  Content-Type は allowlist でなく「`/registry/*` 既定 text/plain + nosniff」に反転
  (現状 `widget.is`/`query.is` が漏れている、R2-20)。

## S13. skills の injection / クロス Tier 越境 — P4 / T6 / R1-G,K / R2-10,11

【状態: 未実装】

- HTML コメント禁止、alt/title・frontmatter 全フィールドも検査対象 (R1-K)。
- **クロス Tier 越境の reject (R1-G)**: skill 本文が AI に `plugins.create/update`・
  `vault.fetch`・`files.export`・`Nd:http` 等を実行させる指示を含むことを reject。
- **skill 間の暗黙依存 (R2-11)**: `triggers` を検証(重複・件数・既存衝突)。同一
  triggers での共起 injection を防ぐ。skill 間参照もハッシュピン留め (R1-K)。
- `mode`(`heartbeat`/`always`)を導出 capability に含め、`manual`→`heartbeat` 昇格を
  Tier 引上げ対象に (R2-10)。frontmatter パーサは未対応構文・重複キーを error に (R2-12)。

## S14. 前提保存則 — 禁止と条件付き許可 — P1, P3, P5 / R1-U

【状態: 一部】

採用しない(採用には原則の改定 PR を要する): バイナリ/ビルド済みアセット、ビルド
ステップ導入、外部への**実体配置**、live fetch 自動更新、Misskey 確認画面バイパス。

**条件付き許可 (R1-U)**: 外部 API 呼び出し(`Nd:http`/`vault.fetch`)は現実に必要ゆえ
禁止しない。**Tier 高(人手)+ ホスト allowlist 宣言 + 「応答は未レビューで可変であり
信頼しない」旨の明記**を条件とする。

## S16. 運営の持続可能性 — T10 / R1-T

【状態: 未実装】

- **ドメイン長期(10 年)登録 + 期限管理**が最も費用対効果が高い(ドメイン失効 →
  第三者取得 → revoked.json 乗っ取りを防ぐ)。
- dead-man staleness: N ヶ月更新が無ければクライアントが stale 警告(鍵不要、日付比較のみ)。
- `SUCCESSION.md`(継承手順)を明文化。
- **registry index 署名は当面見送り(赤チーム現実主義)**: 焼き込み鍵はローテート不能で
  一生の負債になり、継承をむしろ困難にする。この規模では長期ドメイン登録 + staleness
  警告で受け、署名はユーザーが 100 倍になった日に TUF 型で再検討する(R2-5)。

---

## 実装フェーズ

| フェーズ | 内容 |
|---|---|
| **0(基盤・今回)** | `.github/`: PR/イシューテンプレート + セキュリティ CI 骨組み(`check-registry-integrity.mjs`)。branch protection。`revoked.json` 空作成。`SECURITY.md`。author 正規化。 |
| **1** | ビルド決定化(S4)+ 生成物 git 追放(S1/R1-C)+ `meta.id`=dirname 強制(S11)。CI の `git diff --exit-code` 常設。 |
| **2** | S9/S12 の CI を hard-fail 化 + S10 の AST 権限導出(`@syuilo/aiscript` 依存追加)。高権限フラグ → 人手レビュー導線。 |
| **3** | S3 の客観 signal 表示・IntegrityCard ハッシュ再計算・失効のクライアント照合(S5/S11)。 |

**ログイン/評価/サーバーライブラリのフェーズは無い**(P6)。将来必要になれば原則の
改定 PR から始める。

## 運用条項(外部依存のウォッチ)

- **NoteDeck 自身のホスト関数追加** (R1-A): `Nd:http`/`Nd:call` は既に汎用ネット/
  自己書換面。新 capability を追跡し S10 導出対象へ。
- **AiScript のホスト関数追加 / エイリアス実挙動** (R1-H)。
- **Misskey `/install-extensions` の挙動変更**。

## 残存リスク(受容するもの)

- **ロジックボム** (R1-J): 可読コードでも発火条件付き悪性は書ける。受け皿は S3(権限
  可視化)+ S5(失効)+ 発火条件分岐の機械抽出による注意フラグ。
- **静的導出の天井** (R2-6): 第2引数の宛先・config 駆動引数は人手が読む(S10)。
- **運営全体の悪意**: スコープ外。単独犯は署名 + 公開 git 履歴 + 定期突合で抑止。
