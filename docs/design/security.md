# Security Design — misstore

MiAuth ログイン・アイテム投稿・ライブラリ同期 (#31) のセキュリティ詳細仕様。
本文書は [`security-principles.md`](../../security-principles.md)(P1–P7、ロック文書)
から導出される**仕様層**であり、閾値・Tier・体制などは運用に応じて調整してよい。
ただし調整の結果が原則に抵触してはならない。

批判的検証の記録は [`redteam-log.md`](redteam-log.md)。本文書の各仕様は Round 1
の反証を反映済みで、対応する反証 ID(R1-x)を付す。

## 実装状態の凡例(重要)

**本文書に書かれた制御の多くはまだ実装されていない。** 現在形の記述を「稼働中」と
読んではならない。各仕様に次の状態を必ず付す:

- **【未実装】**: 設計のみ。コードは存在しない。この制御に依拠してはならない。
- **【一部】**: 部分的に存在。残りは未実装。
- **【実装済み】**: 稼働中で、CI ないし本番で強制されている。

現時点の全体状況(2026-08): `.github/` は不在で **CI は 1 本も無い**。
`scripts/build-registry.js` は必須フィールド検査 + sha512 + frontmatter パースのみ。
main に branch protection 無し。`revoked.json` 不在。したがって S2/S4/S5/S9/S10/S12 は
原則**全て【未実装】**である。167 アイテムはこれらのゲートを通っていない。

---

## 脅威モデル

| # | 脅威 | 深刻度 | 備考 |
|---|------|--------|------|
| T1 | 悪意あるアイテムの新規掲載 | 高 | plugins/widgets は `Mk:api`/`Nd:call` でアカウント全権級 |
| T2 | 信頼済みアイテムの更新経由の攻撃 | 高 | 全ストア共通の本命。既存権限内なら Tier も上がらない (R1-J/Q) |
| T3 | 投稿者アカウントの乗っ取り・売却 | 高 | Chrome/fractureiser で定番。緩和が単一防壁化していた (R1-Q) |
| T4 | ストア基盤の侵害(repo / CDN / 動的層 / **デプロイ平面**) | 致命的 | デプロイ平面が第二の公開経路 (R1-B) |
| T5 | typosquatting / 作者なりすまし | 中 | homoglyph 検査が ID 限定だった (R1-L) |
| T6 | skills 経由の prompt injection / クロス Tier 越境 | 中〜高 | skill→`plugins.create` (R1-G)、間接 injection (R1-K) |
| T7 | MiAuth 実装の web 脆弱性 | 高(中→引上げ) | confused-deputy・CSRF・SSRF (R1-1〜13) |
| T8 | ライブラリのプライバシー漏洩 | **中〜高**(低→引上げ) | PII・GDPR・運営者常時閲覧 (R1-R) |
| T9 | フィッシング(偽ストア→MiAuth 誘導) | 中 | ログイン導入で新規発生 (R1-S) |
| T10 | 運営消滅・ドメイン失効・継承 | 高 | 悪意でなく「消滅」。記述皆無だった (R1-T) |

## 先例から採る実証済みの原則

主要ストア(VSCode / Chrome / npm / PyPI / AMO / Apple / Flathub / F-Droid /
Debian / Obsidian / CurseForge)の「何が効き、何が破られたか」から:

1. **ランタイムの権限制御は審査に勝る**(Apple/Flatpak)。審査はすり抜けられる前提。
2. **事前審査は小規模なら機能し、事後スキャンは規模を問わず主防壁にならない**。
   ただし事前審査は「遅延」でなく「浅化」に倒れる(AMO/Obsidian、R1-M)。
3. **攻撃の主戦場は新規投稿ではなく、更新と投稿者アカウント**(Chrome/fractureiser/xz)。
4. **配布物とレビュー対象が一致していること**(F-Droid)。misstore はこれを構造的に
   持つが、生成物の三重コミットで自ら壊していた (R1-C)。

misstore の構造的優位(絶対に手放さない): 配布物が可読ソースそのもの / 素の Misskey に
自動更新機構が無い。**ただし優位①は生成物の git コミット (R1-C) で、優位②は NoteDeck の
自動取得と `Nd:http` (R1-A) で、いずれも自ら削っていた。**

---

## S1. 公開経路は Git を正規経路とし、逸脱は外部モニタで検出 — P2 / T4 / R1-B,C

【状態: 未実装(現在 branch protection 無し・外部モニタ無し・生成物 git 追跡下)】

- アイテム公開の正規経路は「保護された main へのマージ → `registry:build` →
  静的配信」のみ。Web 投稿は D1 下書き → GitHub App が **PR を生成するだけ**。
- **生成物を git から追放する (R1-C)**。`public/registry/**/api.json` と
  `public/registry/*.json` を `.gitignore` に入れ、`"build"` を
  `"pnpm registry:build && vue-tsc --noEmit && vite build"` に変更する。これで
  レビュー対象がソースのみになり、「表示・配布・ハッシュの乖離」の置き場が消える
  (P1 の「能力の不在」と初めて整合)。移行が困難な間は、必須 CI として
  `registry:build && git diff --exit-code`。
- **デプロイ平面の担保 (R1-B)**: デプロイは Workers Builds からのみ。人間は長命
  デプロイトークンを持たず、ローカル `pnpm deploy` を廃止。**別権限ドメインの外部
  モニタ**が「git 由来の期待ハッシュ」と「実配信バイトの sha512」を定期突合して
  不一致を通報する。これが無い限り git 迂回デプロイは無検知。
- main のブランチ保護: 直接 push 禁止、**署名コミット必須**、force-push 禁止、
  self-merge 禁止、bypass list 空 + include administrators 有効。
- Workers Builds のビルド設定(build/deploy command・env)は git 管理外なので、
  `SITE_URL` 等の env override を廃しリポジトリ内定数にする (R1 補足4)。Cloudflare
  Audit Logs のビルド設定変更を通知対象に。
- git 履歴は署名 + force-push 禁止 + 外部モニタが揃って初めて透明性ログになる。

## S2. リスク階層別の公開ゲート — P4, P7 / T1 / R1-E,F,M,N

【状態: 未実装(CI 不在、レビュアー実数 1 名)】

| 階層 | 種別 | ゲート |
|---|---|---|
| Tier 0(非実行の構造データ) | themes | 自動チェック + **コントラスト/値域 lint** で自動マージ可(新規のみ) |
| Tier 1(実行コード) | **queries**, plugins, widgets | 自動チェック + 人手 1 名 |
| Tier 2(高権限・永続副作用) | `write:*` / `Nd:http` / `vault.fetch` / `files.export` / `i/webhooks/*` / `plugins.*` を導出するアイテム | 自動チェック + 人手 1 名 + **7 日間の公開異議申立期間** |
| Tier S(AI 向け) | skills | 自動チェック + S8/S13 チェックリストで人手 |

変更点(R1 反映):
- **queries を Tier 1 へ (R1-E)**。`query.is` は AiScript = 実行コードであり構造データ
  ではない。自動マージのゲートにストア側サブセット linter(AST allowlist、`Mk:api`/
  `Nd:call` 出現で reject、再帰検出、評価コスト上限)を必須化。検証不能なら Tier 0 外。
- **Tier 2 を「2 名」から「1 名 + 時間」へ (R1-N)**。単独運営でスケールする資源は
  人数でなく時間。7 日間の公開異議申立期間を置き、diff を公開して第三者の目に晒す。
  self-merge 禁止。運営者自身の投稿にも同じゲート。2 人目の独立レビュアー
  (別組織・別インスタンス)が確保できるまで Tier 2 相当の新規受理を**停止**する。
- **キューの自動停止 (R1-M)**: 未処理 PR が N 件 / M 日を超えたら新規受理を自動停止。
  「開放へ倒れない」を人の意志でなく設定で担保する。レビュアーは導出 capability の
  各項目に明示チェックした記録を PR に残す(浅化の可視化)。
- **Tier 0 自動マージは新規のみ (R1 DEFENDED)**。既存アイテムの更新は種別を問わず
  必ず人手。GitHub App が作った PR は自動マージ対象から除外(人間の PR のみ)。

自動チェック(門前払い用。単独を防壁としない):
- AiScript パース通過、既存 `build-registry.js` バリデーション。
- **全ホスト関数のリテラル限定 + エイリアス禁止 (R1-H)**: `Mk:api`/`Nd:call`/
  `Nd:http`/`Mk:save` 等は `関数名(リテラル, …)` の構文形でのみ出現可。変数束縛・
  引数渡し・オブジェクト格納を検出したら無条件 reject(P4)。
- 難読化禁止(文字コード演算・極端 minify・無意味長大コード)、サイズ上限 500KB。
- ID 衝突・レーベンシュタイン類似名検出。**name/description の正規化文字列にも (R1-L)**。
- S9 の正規テキスト検査。

## S3. 権限モデル — 導出とエンドユーザー向け判断 — P5 / T1 / R1-I,P

【状態: 未実装(permissions 宣言は plugins 21/24・widgets 0/44)】

- plugins/widgets/queries の `permissions` を**必須化**。未宣言は掲載不可
  (現状 widgets は宣言 0 件、即時棚卸し)。
- **エンドユーザー向け表示は「エンドポイント名の羅列」をやめる (R1-P)**。consent
  fatigue でユーザーは読まない。代わりにストアが判断を出す: カテゴリ別の期待
  capability プロファイルと S10 導出結果の乖離を機械判定し、「⚠ このテーマ系
  プラグインはあなたの代理で投稿できます — 説明と釣り合いません」と赤表示。
  エンドポイント一覧は開発者向けに折りたたむ。**表示は宣言でなく導出から生成**。
- **導出は引数レベルまで (R1-I)**: `notes/create` の `visibility`/`visibleUserIds`、
  `i/webhooks/create` の `url` を抽出。定数でない宛先/URL は Tier 引上げ。
  サーバ側に永続副作用を残す操作(webhook/アンテナ/アプリ登録)は「アンインストール
  後も残る」フラグを付ける。
- **Misskey の `/install-extensions` 確認画面をバイパスしない**。ストア側権限による
  registry 直接書き込み型のワンクリック/一括インストールは実装しない (P5)。
- 一括インストール: 素の Misskey はガイド付き順次(確認画面は毎回通る)。NoteDeck は
  権限一覧表示 → 明示承認 → 適用(承認の集約はしても省略はしない)。

## S4. バージョン不変性・ハッシュ固定・更新ゲート — P3 / T2 / R1-J,Q

【状態: 未実装】

- 公開済み (id, version) は不変。同一 version の内容変更は CI が reject。修正は
  version を上げ S2 を再通過。
- **更新は新規と同一ゲート + 導出差分で Tier 判定 (R1-J)**。Tier を「宣言 permissions
  の増減」でなく「**導出エンドポイント集合の差分**」で決める。新規エンドポイント出現で
  Tier を上げる。過剰宣言は warning でなく**掲載不可**(最小権限の実効化)。config
  既定値変更・分岐条件変更を diff で強調表示。
- **更新署名 (R1-Q)**: 投稿時に投稿者が任意の公開鍵を登録でき、更新 PR に署名を要求
  できる。任意にすることで「Misskey 2FA 強制不能」を回避しつつ、Misskey アカウント
  乗っ取りだけでは更新できなくする(最も費用対効果が高い緩和)。高権限アイテムの
  更新には待機期間(S2 の異議申立期間)。長期無更新アイテムの突然更新をフラグ。
- インストール URL の `hash=<sha512>` は掲載時点で固定(TOCTOU 防御)。
- NoteDeck が自動取得する場合、インストール時点の sha512 にピン留めし、ハッシュ変化時は
  自動適用せずユーザーに確認。live fetch は禁止 (S14)。

## S5. 失効(kill switch)と検知 — P7 / T1, T2 / R1-O

【状態: 未実装(revoked.json 不在 = P7 現在進行違反)】

- `public/registry/revoked.json`(Git 管理・静的)を**空配列で即作成**し、UI 警告
  表示を Phase 1 に前倒しする(機構が存在すること自体に意味がある)。
- 形式 `{type, id, versions, reason, date}`。ストア UI は該当ページを警告に差し替え、
  `api.json` は 410 相当で無効化。NoteDeck は起動時 + 定期でフェッチし無効化・警告。
- **検知(MTTD)を明記 (R1-O)**: 失効はコミット 1 つ(MTTR)だが、支配的なのは検知時間。
  `SECURITY.md` + 通報窓口 + 一次応答目標時間を設ける。素の Misskey 向けの唯一の現実的な
  失効通知は「詳細ページ警告 + 運営アカウントからの告知」であり、これを正式手順化する。
- **限界の明記**: 素の Misskey のインストール済みコピー、および `i/webhooks` 等の
  サーバ側永続副作用 (R1-I) には revoked.json が届かない。ゆえに重心は S2 の事前審査。

## S6. 投稿者の同一性 — `(host, remote_user_id)` に錨 — T3, T5 / R1-1,2,8,9

【状態: 未実装(現行 author は `hitalin`/`@hitalin`/`@hitalin@yami.ski` 等の混在)】

- 同一性の権威は acct 文字列でなく **`(host, remote_user_id)`** (R1-1,2)。
  `remote_user_id` は Misskey の不変 `user.id`。ログイン時 acct が一致しても
  `remote_user_id` が異なれば別人として扱い、旧行の所有物へは移譲手続きを要求する
  (ドメイン失効・管理者による acct 再取得を無効化)。
- acct の host 成分は **MiAuth の KV 復元 host のみ**を使う。`user.host != null` は
  reject(ローカルユーザーは `host: null`)。`user.username` を
  `^[a-zA-Z0-9_]{1,20}$` で再検証。`author` は Functions が権威的に記入し自己申告不可。
  D1 は `username`/`host`/`remote_user_id` を別カラムで持ち、acct は表示用の派生値。
- **既存アイテムの更新は同一 `(host, remote_user_id)` のみ受理**。移譲は両者確認 + 審査。
- **レガシー author の扱い (R1-8)**: 検証済み acct を持たない既存 167 アイテムには
  `authorVerified: false` を付け UI で「作者未検証」と明示。裸文字列(`syuilo` 等)への
  claim は自動承認せず authorUrl での相互確認を要する。author 表記ゆれ 3 種を正規化。
- **運営者 identity の単一障害点 (R1-8)**: `@hitalin@yami.ski` は自己ホスト依存。
  バックアップ identity を紐付ける。
- 新規投稿者制限は「**ストア初回ログインからの経過日数**」(自己ホストの `createdAt` は
  偽装可能ゆえ使わない)+ 同時係属 PR 数制限 + Turnstile。**これは Sybil 耐性でなく
  時間コストにすぎない (R1-9)** ことを明記し、host 単位のレート制限を併用する。

## S7. MiAuth / セッション実装 — P6 / T7, T8, T9 / R1-3〜13

【状態: 未実装】

```
[SPA] ホスト入力
  │ POST /api/auth/start { host }   ← Origin 検証 + Turnstile 必須 (R1-3,10)
[Functions] host 検証 → session 生成(CSPRNG)
  │ __Host-preauth=<nonce> Cookie 発行、D1 に {session→{host, sha256(nonce)}} 保存
  │   (KV でなく D1: 原子的ワンタイム消費のため R1-8)
  │ 302 でなく JSON で MiAuth URL を返し SPA が遷移 (R1-10)
  │   https://{host}/miauth/{session}?name=Misstore&callback=.../api/auth/callback&permission=(空)
[Misskey] 承認 → callback?session={session}
[Functions] preauth Cookie の nonce と D1 の sha256 一致を検証 (R1-5)
  │ getAll('session').length===1 を検証 (R1-12)
  │ D1 DELETE ... RETURNING host で session を原子的に消費 (R1-8)
  │ POST https://{host}/api/miauth/{session}/check
  │   fetch は redirect:'manual' + AbortSignal.timeout(5000) + サイズ上限64KB (R1-4)
  │ → { ok, token, user }
  │ user.host!=null なら reject、username 再検証、(host, remote_user_id) で同一性 (R1-1)
  │ token で権限必須 API を1本叩き、成功したら「想定より広い権限」として拒否+警告 (R1-3)
  │ token を即破棄(専用関数外に出さない、console に出さない)(R1-7)
  │ __Host-misstore_session Cookie 発行、セッションIDローテート (R1-5,6)
  │ 302 でクリーンURLへ(HTML を返さない、Referrer-Policy: no-referrer)(R1-7)
```

- **host 検証**: `https` 固定、ポート/IP リテラル/内部名禁止。fetch 先は check のみ、
  かつ**リダイレクト追従を禁止** (R1-4)。allowlist に自ドメイン・`*.workers.dev` を
  含めない。`workers_dev: false` (R1-6)。
- **Cookie**: `__Host-misstore_session`(Secure/Path=/・Domain 属性禁止で host-only、
  サブドメインからの tossing を構造的に不可能に)。全 `/api/*` 状態変更に
  `Sec-Fetch-Site: same-origin` 必須(Lax の 2 分例外も閉じる)(R1-6)。
- **`/api/*` の CORS は無条件無効** (R1-13): Origin を反射しない、Allow-Credentials を
  返さない。NoteDeck はセッション Cookie でなく、Web UI で明示発行する **device token**
  (`read:library` のみ、`Authorization` ヘッダ、ユーザーが失効可)を使う。
- **トークン破棄の徹底 (R1-7)**: check レスポンスは専用関数内でのみ触り `{ok, username,
  remote_user_id}` 以外を外に出さない。CI に「`console.*` に `token`/`res.text()`/
  `res.json()` 結果が現れないか」の grep を入れる(P4 の機械保証を実装コードにも)。
  observability のフィールドから URL クエリを除外。
- **フィッシング対策 (R1-S / T9)**: ログイン画面に「misstore は権限を一切要求しません。
  権限が並ぶ確認画面は偽サイトです」を常時表示。公式ドメインを 1 つに固定・明記し
  類似ドメインを監視。**ログインは任意化** — ライブラリはログイン不要のローカル保存 +
  エクスポート/インポートでも使え、同期したい人だけログインする。
- D1 スキーマ(最小・R1-R でプロフィールを削減):

```sql
users(id, host, username, remote_user_id, created_at, last_login_at,
      UNIQUE(host, remote_user_id))            -- display_name/avatar は保存しない
auth_sessions(id, host, preauth_hash, expires_at)   -- 原子的ワンタイム消費用
device_tokens(id, user_id, token_hash, scope, created_at, revoked_at)
library(user_id, item_type, item_id, added_at, PRIMARY KEY(user_id,item_type,item_id))
submissions(id, user_id, item_type, payload, status, pr_url, created_at)
```

- **MiAuth 生成トークンの残存 (R1-7, RESIDUAL)**: 権限ゼロトークンは `write:account` を
  持たず自己 revoke できないため、ユーザーの「接続済みアプリ」に蓄積する。ログイン完了
  画面で「不要なアプリ連携は Misskey 設定から削除できます」を案内。
- **空 permission の意味論 (R1-11)** と **MiAuth check のワンタイム性 (R1-8)** は外部
  実装依存であり、運用条項の監視対象。

## S8. skills の prompt injection 審査 — T6 / R1-G

【状態: 未実装】

- 秘密情報の外部送信誘導、無断操作の指示、他指示の上書き、外部/可変参照。
- **クロス Tier 越境の reject (R1-G)**: skill 本文が AI に `plugins.create/update`・
  `vault.fetch`・`files.export`・`Nd:http` 等の高権限 tool を実行させる指示を含むことを
  明示 reject 項目とする。skill が誘導しうる tool を frontmatter に allowlist 宣言させ、
  宣言外 tool 誘導を検出。`plugins.create` で生成される plugin にも起動時 S10 導出 +
  権限表示を強制(クライアント側)。

## S9. 正規テキスト形式の強制 — P4 / T1, T6 / R1-L

【状態: 未実装】

CI で無条件 reject: Unicode 双方向制御文字 / ゼロ幅・不可視文字 / 非 UTF-8・BOM・
CRLF 混在 / AiScript 文字列リテラルのエスケープ密度閾値超過。**検査対象を ID だけで
なく `name`/`description`/表示名にも拡張 (R1-L)**(homoglyph による視覚衝突対策)。
ID は `[a-z0-9-]`。**theme の UUID 形式検査 + Misskey 標準テーマ UUID 衝突検査を追加**
(現行 `ame` テーマに非 hex 文字を含む UUID が実在)。「raw = レビュアー = パーサー =
ユーザー」の四者一致を機械保証。

## S10. 権限は宣言でなく全ホスト関数から導出する — P4, P5 / T1 / R1-A,H,I

【状態: 未実装。**設計の中核であり Round 1 で最も大きく変わった**】

- **導出対象を全ホスト関数へ一般化 (R1-A)**。従来の `Mk:api`/`Plugin:register_*`/
  `Mk:save` に加え、**`Nd:` 名前空間全体**(`Nd:call` の全 capability、`Nd:http`)を
  必ず含める。実際の外部通信・流出・自己書換の主経路はここにある。
- `Nd:call` / `Nd:http` も第一引数リテラル限定。`Nd:http` は meta にホスト allowlist を
  宣言させ CI で AST 照合。`network.external` は `network.external:<host>` に粒度分解。
- **エイリアス・間接呼び出しの禁止 (R1-H)**: ホスト関数は `関数名(リテラル, …)` の
  構文形でのみ出現可。変数束縛・引数渡し・格納は reject(素朴スキャナ回避の封じ)。
- **引数レベル導出 (R1-I)**: エンドポイント名だけでなく `visibility`/`visibleUserIds`/
  webhook `url` 等の引数まで抽出。`vault.fetch` 系は「任意外部ホストへ送信しうる」旨を
  導出表示に明示。`i/webhooks/*` 等サーバ側永続副作用は専用最上位 Tier。
- `permissions` は「宣言 ⊇ 導出」を CI 検証。過少宣言・過剰宣言ともに掲載不可 (R1-J)。
- 注: エイリアス回避の実挙動は AiScript インタプリタで未確認 (R1-H)。実装前に Playground
  で `let f = Mk:api; f(...)` を 1 行検証すること。

## S11. 詳細ページ = 監査ページ(ハッシュ再計算) — P1, P3 / R1-C

【状態: 一部(shiki 表示はあるが sha512 は index 値の素通し)】

- インストールされる正確なソース全文を常時表示。バージョン間 diff ビューア(git 履歴)。
- **IntegrityCard は表示中ソースから WebCrypto で sha512 を再計算し index 値と突合する
  (R1-C)**。現状は index の sha512 文字列をそのまま表示するだけで、表示物とハッシュの
  一致を保証していない。詳細ページは `sourceUrl` でなく**実際に install される
  `api.json` の `data`** を表示する(見せる物と入る物を一致させる)。

## S12. `icon.svg` のサニタイズ — P1

【状態: 未実装】

CI: `<script>`/`<foreignObject>`/`on*` 属性/外部 `href`/`data:` URI を含む SVG は
reject(許可要素ホワイトリスト)。配信: `/registry/*` に
`Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`。

## S13. skills の raw/rendered 乖離とバージョン化間接 injection — P4 / T6 / R1-K

【状態: 未実装】

- HTML コメント禁止。alt/title 等「レンダリングで目立たないが本文として読まれる」領域も
  検査対象。**frontmatter の全フィールド**(description/triggers 等)も raw/rendered 検査
  および prompt 注入面として扱う (R1-K)。
- **skill 間参照もハッシュピン留め (R1-K)**。「レジストリ内=安全」は偽 — レジストリ内
  アイテムは攻撃者が投稿でき更新される(A が B を参照し後日 B を悪性版に更新する間接
  injection)。他アイテムの指示を参照・追従させる表現を reject。参照先は原則レジストリ内
  かつピン留めされたバージョン。

## S14. 前提保存則 — 禁止リストと条件付き許可 — P1, P3, P5 / R1-U

【状態: 一部(外部 API 呼び出しは既に混入)】

採用しない(採用には `security-principles.md` の改定 PR を要する):
1. バイナリ・ビルド済みアセットの受け入れ — P1 の死
2. ビルドステップの導入(TS→AiScript コンパイル等)— P1 の死
3. 外部 CDN・外部 URL への**実体(アセット)配置** — P3 の死
4. live fetch での自動更新 — P3 の死
5. Misskey 確認画面をバイパスする直接インストール — P5 の死

**条件付き許可(禁止でなく条件化。R1-U)**:
- **外部 API 呼び出し**(`Nd:http`/`vault.fetch`)は現実に必要な機能ゆえ禁止しない。
  ただし **Tier 2 + ホスト allowlist 宣言 + 「応答は未レビューで可変であり信頼しない」旨の
  明記**を条件とする。S14-3 が「配置」しか禁じず「呼び出し」を素通しさせていた穴を塞ぐ。

## S15. プライバシー(ライブラリ・アカウント) — T8 / R1-R

【状態: 未実装(PRIVACY.md 不在)】

- **T8 を中〜高に格上げ**。`library` + acct は「誰がどの拡張を使うか」の完全リストで
  fingerprint 化・deanonymization が可能、機微カテゴリ(dlsite 連携等)を含み、GDPR/
  個人情報保護法の対象。
- `display_name`/`avatar_url` は**保存せず表示時取得**(P6 の思想をプロフィールにも)。
- ライブラリはデフォルト非公開だが、**「デフォルト非公開」は他ユーザーに対してであって
  運営者に対してではない**ことを UI に明記。運営者も読めない設計(user 由来鍵での
  item_id HMAC — 同期可・集計不可のトレードオフ)を選択肢として検討。
- **`PRIVACY.md` + 保存項目 + 保存期間 + 削除手順 + 退会 = 物理削除を Phase 1 リリース
  条件**とする。

## S16. 運営の持続可能性・継承 — T10 / R1-T

【状態: 未実装(記述皆無だった)】

- 全 URL が `store.notedeck.io` 固定のため、ドメイン失効 → 第三者取得で revoked.json を
  空にでき、NoteDeck はそこから取りに行く。放棄後も静的サイトは古い脆弱アイテムを配り
  続ける。資金切れの安易な出口は event-stream 型の雑な譲渡。
- **レジストリ index への署名 (R1-T)**: NoteDeck にレジストリ公開鍵を焼き込み、registry
  index に署名する。ドメインが移転しても鍵が無ければ配信を乗っ取れない(単一ドメイン
  依存を切る唯一の方法。P1/P2 と矛盾しない追加)。
- ドメインは長期(10 年)登録し期限管理を運用条項に。dead-man staleness(N ヶ月更新が
  無ければクライアントが stale 警告)。`SUCCESSION.md`(継承手順)を明文化。

---

## 実装フェーズ

| フェーズ | 内容 | 前提となる先行タスク |
|---|---|---|
| **0**(基盤) | branch protection・署名・`.github/` CI 骨組み・revoked.json 空作成・SECURITY.md・PRIVACY.md・author 正規化・外部モニタ | 実装より前に必須(S1/S5/S6/S15) |
| **1**(= #31) | MiAuth ログイン(S7、任意化)+ ライブラリ(ローカル + 同期) + device token | Phase 0 |
| **2** | 投稿フォーム → 自動チェック(S2/S9/S10/S12)→ PR 自動生成 → 人手ゲート | Phase 0, 1 |
| **3** | NoteDeck 一括インストール UI(S3)・失効購読(S5)・ハッシュピン留め(S4)・index 署名(S16) | Phase 2 |

**Phase 0 を先行させる (R1-D)**: 従来 Phase 1 から始める想定だったが、CI・branch
protection・revoked.json・privacy が無いまま機能を足すと、原則が機械強制されない
状態で攻撃面だけ増える。原則を CI に翻訳する Phase 0 が全ての前提。

## 運用条項(外部依存のウォッチ)

misstore が制御できない前提。変化したら仕様側で吸収する:
- **NoteDeck 自身のホスト関数追加** (R1-A): 現状 `Nd:http`/`Nd:call` が既に汎用
  ネットワーク/自己書換面。新 capability 追加を追跡し S10 導出対象に加える。
- **AiScript のホスト関数追加 / エイリアス実挙動** (R1-H)。
- **Misskey `/install-extensions` の挙動変更**(確認画面・sha512 検証)。
- **MiAuth の空 permission 意味論・check のワンタイム性**(フォーク差異、R1-8,11)。

## 残存リスク(受容するもの)

- **ロジックボム** (R1-J): 可読コードでも発火条件付き悪性は書ける。受け皿は S3(権限
  封じ込め)+ S5(失効)+ 発火条件分岐の機械抽出によるレビュアーへの注意フラグ。
- **投稿者の Misskey アカウント乗っ取り** (R1-Q): 緩和は S4 更新署名 + 待機期間 +
  無更新突然更新フラグの**複数**。単一防壁にしない(P7)。
- **MiAuth 生成トークンの残存**(自己 revoke 不能、R1-7)。
- **運営全体の悪意**: スコープ外。単独犯は署名 + 外部モニタ + 異議申立期間で抑止。
