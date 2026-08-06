# Security Design — misstore

MiAuth ログイン・アイテム投稿・ライブラリ同期 (#31) を導入するにあたっての
セキュリティ詳細仕様。本文書は [`security-principles.md`](../../security-principles.md)
(P1–P7、ロック文書)から導出される**仕様層**であり、閾値・Tier・体制などは
運用に応じて調整してよい。ただし調整の結果が原則に抵触してはならない。

各仕様 S1–S14 には、対応する脅威(T)と依拠する原則(P)を付す。

## 脅威モデル

| # | 脅威 | 深刻度 | 備考 |
|---|------|--------|------|
| T1 | 悪意あるアイテムの新規掲載 | 高 | plugins/widgets は `Mk:api` でアカウント全権級の操作が可能 |
| T2 | 信頼済みアイテムの更新経由の攻撃 | 高 | 全ストア共通の本命。ただし素の Misskey に自動更新はなく、対象は「更新後の新規インストーラー」と自動取得を持つクライアントに限定 |
| T3 | 投稿者アカウントの乗っ取り・売却 | 高 | Chrome Web Store / CurseForge (fractureiser) で定番化 |
| T4 | ストア基盤自体の侵害(repo / CDN / 動的層) | 致命的 | 起きたら全ユーザーに波及 |
| T5 | typosquatting / 作者なりすまし | 中 | npm・PyPI で恒常化 |
| T6 | skills 経由の prompt injection | 中〜高 | 実行コードではないが AI に対する攻撃面 |
| T7 | MiAuth 実装の web 脆弱性(SSRF・セッション固定) | 中 | 実装品質の問題 |
| T8 | ライブラリ(利用リスト)のプライバシー漏洩 | 低〜中 | 「誰が何を使っているか」は個人情報 |

## 先例から採る実証済みの原則

主要ストア(VSCode Marketplace / Chrome Web Store / npm / PyPI / Firefox AMO /
Apple App Store / Flathub / F-Droid / Debian / Obsidian / CurseForge)の
「何が効き、何が破られたか」から抽出:

1. **ランタイムの権限制御は審査に勝る**(Apple / Flatpak)。審査は必ずすり抜けられる前提で設計する。
2. **事前審査は小規模なら機能し、事後スキャンは規模を問わず主防壁にならない**(AMO/Debian vs VSCode/npm)。
3. **攻撃の主戦場は新規投稿ではなく、更新と投稿者アカウント**(Chrome / fractureiser / xz)。
4. **配布物とレビュー対象が一致していること**(F-Droid)。ビルド工程やバイナリが挟まるほど攻撃余地が生まれる。

misstore が最初から持つ構造的優位(仕様はこれを絶対に手放さない):

- **配布物がすべて人間可読なソースそのもの**でビルド工程が存在しない(→ P1)
- **素の Misskey には拡張の自動更新機構がない**。インストールは
  `/install-extensions` での一回きりのコピーであり、悪性一斉配信が構造的に成立しない(→ P3)

---

## S1. 公開経路は Git ただ一本 — P2 / T4

- アイテムの公開は「保護された main へのマージ → `registry:build` → 静的配信」のみ。
- Web 投稿は D1 に下書き → GitHub App が **PR を生成するだけ**。App の権限は
  `contents:write`(投稿用ブランチ)+ `pull_requests:write` に限定し、
  main への push 権限を持たせない。
- main のブランチ保護: 直接 push 禁止、レビュー必須、force-push 禁止。
- 動的層(Functions / D1 / KV)が完全に侵害されても、攻撃者が得るのは
  「PR を作る能力」まで。配布能力ではない。
- git 履歴が公開の透明性ログとなる(certificate transparency 相当)。

## S2. リスク階層別の公開ゲート — P4, P7 / T1

全種別一律の審査はレビュアーを枯渇させ、ザル化する。危険度で分ける:

| 階層 | 種別 | ゲート |
|---|---|---|
| Tier 0(構造データ) | themes, queries | 自動チェックのみで自動マージ可 |
| Tier 1(実行コード) | plugins, widgets | 自動チェック + 人手レビュー 1 名 |
| Tier 2(高権限) | `write:*` 系 permission を要求する plugins | 自動チェック + 人手レビュー 2 名 |
| Tier S(AI 向け) | skills | 自動チェック + S8 チェックリストで人手レビュー |

自動チェック(門前払い用。これ単独を防壁とはみなさない):

- AiScript パース通過、既存 `scripts/build-registry.js` のバリデーション
- **`Mk:api` の第一引数は文字列リテラル限定**。動的に組み立てたエンドポイント名は
  無条件 reject(これにより S10 の静的導出が原理的に破綻しなくなる)
- **難読化の禁止**: 文字コード演算による文字列構築、極端な minify、
  無意味な長大コードは内容を問わず reject。「レビュー可能であること」自体が
  掲載条件(P4)。サイズ上限: 500KB(調整可)
- ID 衝突・レーベンシュタイン距離による類似名検出(T5)
- S9 の正規テキスト形式検査

レビューの位置づけ: 「悪意の捜索」ではなく「可読なコードが宣言(導出)通りかの
確認」。詰まった場合は掲載が遅くなる方向に倒れる仕様であり、開放へは倒れない。

## S3. 権限モデル — P5 / T1

- plugins / widgets は `meta.json` の `permissions` を**必須化**(現状は任意)。
  未宣言は掲載不可。
- 詳細ページとインストールボタン脇に権限を**人間語で表示**
  (「あなたのアカウントで投稿できます」)。表示内容は S10 の導出結果から自動生成。
- **Misskey の `/install-extensions` 確認画面をバイパスしない**。
  `write:account` 等でユーザーの registry に直接書き込む「ワンクリック/一括
  インストール」は実装しない。確認画面(権限表示 + sha512 検証)はストアが
  侵害された場合のユーザー側最後の防壁である(P5)。
- 一括インストール:
  - 素の Misskey: ライブラリから「未インストール分を順に開く」ガイド付きリスト。
    確認画面は毎回通る。
  - NoteDeck: `GET /api/users/me/library` を読み「権限を一覧表示 →
    ユーザーが明示承認 → 適用」の専用 UI。権限承認の集約はしても省略はしない。

## S4. バージョン不変性とハッシュ固定 — P3 / T2, T4

- **公開済みバージョンは不変**。同一 version 文字列での内容変更は CI が reject。
  修正は必ず version を上げ、S2 のゲートを再通過する。
- **更新は新規投稿と同一のゲート**を通す。更新レビューには前バージョンとの
  **diff** を提示。`permissions` が増える更新は Tier を一段引き上げる。
- インストール URL の `hash=<sha512>` は掲載時点の値で固定。レジストリが後から
  差し替えられてもハッシュ不一致でインストールは失敗する(TOCTOU 防御)。
- **NoteDeck が skills 等を自動取得する場合、インストール時点の sha512 に
  ピン留めし、ハッシュが変わったら自動適用せずユーザーに更新確認を出す**。
  live fetch は禁止(S14)。自動更新経路が存在しないという構造的優位を
  自ら捨てない。

## S5. 失効(kill switch) — P7 / T1, T2

- `public/registry/revoked.json`(Git 管理・静的)に
  `{type, id, versions, reason, date}` を積む。コミット 1 つで発動。
- ストア UI は該当ページを警告表示に差し替え、`api.json` は 410 相当で無効化。
- NoteDeck は起動時 + 定期でフェッチし、該当アイテムを無効化・警告表示。
- **明記される限界**: 素の Misskey にインストール済みのコピーには届かない
  (Misskey は revocation を購読しない)。ゆえに事後失効は主防壁ではなく、
  重心は S2 の事前審査に置く。

## S6. 投稿者アカウント — T3, T5

- 投稿者の同一性は MiAuth 検証済み `username@host`(acct)。
  `author` フィールドは Functions が強制記入し、自己申告不可。
- **既存アイテムの更新 PR は初回投稿と同一 acct のみ受理**。
  移譲は両者の確認 + 審査を伴う明示的な手続きでのみ。
- 新規投稿者の制限は「**ストアへの初回ログインからの経過日数**」で行う。
  Misskey アカウントの `createdAt` は自己ホストインスタンスで偽装可能なため
  **使わない**。加えて同時係属 PR 数の制限と Turnstile。
- Misskey アカウントへの 2FA 強制はストア側に手段がない。**残存リスクとして
  受容**し、緩和は「乗っ取られても更新は S4 のゲートを通る」ことに依存する。
  更新審査を省略できない理由がこれである。

## S7. MiAuth / セッション実装 — P6 / T7, T8

```
[SPA] ホスト入力(localStorage misstore:misskeyHost を初期値に)
  │ POST /api/auth/start { host }
[Functions] host 検証 → session UUID 生成(CSPRNG)→ KV に {session→host} TTL 10分
  │ 302 → https://{host}/miauth/{session}?name=Misstore
  │        &callback=https://store.notedeck.io/api/auth/callback
  │        &permission=            ← ログインのみなら空(権限ゼロのトークン)
[Misskey] ユーザー許可 → callback?session={session}
[Functions] KV から host を復元(callback のパラメータから host を受け取らない)
  │ POST https://{host}/api/miauth/{session}/check → { ok, token, user }
  │ token は即破棄(P6)。user から acct を構成し D1 users に upsert
  │ 独自セッション Cookie 発行 → 302 /
```

- session はワンタイム。check 成功で即消費し、自セッションと紐付ける
  (他人の認可の横取りではストア側セッションは発行されない)。
- host 検証(SSRF 対策): `https` 固定、ポート指定・IP リテラル・内部名の禁止。
  サーバーからの fetch 先は `/api/miauth/{session}/check` のみ。
- ユーザーの一意性は acct(`username@host`)でスコープする。悪意あるホストは
  自ホスト名前空間のユーザーしか名乗れない。表示は常に acct フル。
- 追加権限が要る将来機能(バックアップ取り込み等)は、その場で必要 permission
  付き MiAuth を都度実行し、用が済み次第トークンを破棄する(インクリメンタル認可)。
- セッション Cookie: HttpOnly / Secure / SameSite=Lax。サーバー側セッション
  (D1)とし、失効可能にする。
- D1 スキーマ(最小):

```sql
users(id, acct UNIQUE, username, host, display_name, avatar_url,
      created_at, last_login_at)
sessions(id, user_id, expires_at)
library(user_id, item_type, item_id, added_at,
        PRIMARY KEY(user_id, item_type, item_id))
submissions(id, user_id, item_type, payload, status, pr_url, created_at)
```

- ライブラリは**デフォルト非公開**。公開はオプトイン(T8)。
  エクスポートは JSON 1 枚(アイテム実体はレジストリにあるため、
  ユーザーごとの状態は ID リストだけで完結する)。

## S8. skills の prompt injection 審査 — T6

skills は実行コードでないため静的解析が効かず、人手レビューが防壁。
チェックリスト:

- 秘密情報(トークン・vault 内容)の外部送信を誘導する指示がないか
- ユーザーの明示依頼なく投稿・フォロー等の操作を指示していないか
- 他の指示の上書き(「以前の指示を無視して」類型)がないか
- 外部 URL を参照する場合、その先が可変コンテンツでないか
  (**間接 injection**: 本文が無害でも参照先の書き換えは実質更新になる。
  参照先は原則レジストリ内に限定 — S13)

## S9. 正規テキスト形式の強制 — P4 / T1, T6

可読ソース配布の敵は「人間の目とパーサーの解釈がずれるテキスト」
(Trojan Source, CVE-2021-42574)。CI で以下を無条件 reject:

- Unicode 双方向制御文字(U+202A–U+202E、U+2066–U+2069 等)
- ゼロ幅・不可視文字(U+200B/200C/200D、U+FEFF、タグ文字 U+E0000 台)。
  skills では「AI にだけ読める」不可視テキストの定番手口
- ID における混同可能文字(homoglyph)。ID は `[a-z0-9-]` に限定
- 非 UTF-8、BOM、CR/LF 混在(正規形は LF — 既存の sha512 正規化と整合)
- AiScript 文字列リテラル内の**エスケープ密度の閾値超過**
  (`\uXXXX` 羅列による文字列構築は S2 リテラル限定ルールの迂回手段)

これで「raw テキスト = レビュアーが見るもの = パーサーが読むもの =
ユーザーに届くもの」の四者一致を機械保証する。

## S10. 権限は宣言ではなく導出する — P4, P5 / T1

- CI が AST から `Mk:api` の全呼び出し先・使用ホスト関数
  (`Plugin:register_*`、`Mk:save` 等)を機械抽出し、実効 capability セットを導出。
- `meta.json` の `permissions` は「宣言 ⊇ 導出結果」を CI が検証。
  過少宣言は reject、過剰宣言は警告(最小権限の強制)。
- ストアの権限表示(S3)は宣言ではなく**導出結果から自動生成**。
  「このプラグインが呼ぶ API: `notes/create`, `following/create`」と
  エンドポイントまで表示する。コードから証明された表示であり、
  バイナリストアには原理的に不可能。
- レビュアーの仕事は「導出された capability がアイテムの説明文と釣り合うか」の
  判断に縮小する(例:「ダークモード切替が `following/create` を呼ぶ」は
  機械が検出し人間が即棄却)。

## S11. 詳細ページ = 監査ページ — P1, P3

- 詳細ページで**インストールされる正確なソース全文**(ハッシュが指すもの)を
  常時表示(shiki は導入済み)。「何が入るか見てから入れる」を標準動線にする。
- **バージョン間 diff ビューア**を詳細ページに置く。実装は git 履歴(S1)の
  diff 表示。更新こそ本丸(T2)に対するユーザー側の対策。
- 表示中ソースの sha512 とインストール URL の `hash=` が同一値であることを
  UI 上で明示(「表示されているものがそのまま入ります」)。

## S12. `icon.svg` のサニタイズ — P1

レジストリで唯一「テキストだが実行能力を持つ」ファイルが SVG。

- CI: `<script>` / `<foreignObject>` / `on*` 属性 / 外部 `href` / `data:` URI を
  含む SVG は reject(許可要素のホワイトリスト方式)。
- 配信: `public/_headers` の `/registry/*` に
  `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'` を付与
  (直接開かれても無力化)。

## S13. skills の raw / rendered 乖離検査 — P4 / T6

- HTML コメント(`<!-- -->`)禁止 — レンダリングで消えるが AI には届く。
- 画像 alt テキスト・リンク title 等「レンダリングで目立たないが本文として
  読まれる」領域もレビュー対象であることをチェックリストに明記。
- 参照 URL は原則レジストリ内のみ。外部の可変コンテンツを参照した瞬間、
  「配布物 = レビューしたもの」の保証が壊れる(S8 の間接 injection 対策)。

## S14. 前提保存則 — 採用しない機能の禁止リスト — P1, P3, P5

UX・利便性・要望の多さを理由に将来提案されても採用しない
(採用には `security-principles.md` の改定 PR を要する):

1. **バイナリ・ビルド済みアセットの受け入れ**(wasm、minify 済みコード等)
   — アーティファクト = ソース(P1)の死
2. **ビルドステップの導入**(「TypeScript から AiScript にコンパイル」等)
   — レビュー対象と配布物の乖離の始まり(P1)
3. **外部 CDN・外部 URL 参照の許可** — ハッシュ固定(P3)の死。
   すべての実体はレジストリ内に置く
4. **live fetch での自動更新** — 自動更新経路が存在しない優位(P3)の死
5. **Misskey 確認画面をバイパスする直接インストール** — 最後の防壁(P5)の死

---

## 実装フェーズ

| フェーズ | 内容 | 追加インフラ |
|---|---|---|
| **1**(= #31) | MiAuth ログイン(S7)+ ライブラリ(追加/削除/エクスポート) | `functions/` + D1 + KV |
| **2** | 投稿フォーム → 自動チェック(S2, S9, S10, S12)→ PR 自動生成(S1)、`revoked.json`(S5) | GitHub App |
| **3** | NoteDeck 側の一括インストール UI(S3)、失効リスト購読(S5)、ハッシュピン留め(S4) | NoteDeck 側実装 |

Phase 1 は Misskey トークンを持たない(P6)ため、攻撃面をほぼ増やさずに
「アカウントで貯める」価値を出せる。Phase 2 は人手レビューがボトルネックに
なる設計を意図的に選んでいる — 詰まったら自動チェックを厚くして人手を
差分に集中させる。先に開放して後からスキャンを足す順序(VSCode の逆走)は
採らない。

## 運用条項(外部依存のウォッチ)

以下は misstore が制御できない前提であり、変化したら本仕様側で吸収する:

- **AiScript のホスト関数追加**: 現行のプラグイン環境は汎用ネットワーク
  機能を持たず、外部との通信は実質 `Mk:api` に限定される。汎用 fetch 等が
  追加された場合、S10 の導出対象に加え、S2 の Tier 判定を引き上げる。
- **Misskey `/install-extensions` の挙動変更**: 確認画面・sha512 検証の
  仕様変更は S3 / S4 の前提に影響するためリリースノートを追跡する。

## 残存リスク(受容するもの)

- **ロジックボム**: 可読コードでも発動条件付き悪性コードは書ける。
  ソース配布は発見可能性を最大化するだけで発見を保証しない。
  受け皿は S3(権限で被害を閉じ込める)と S5(失効)。
- **`Mk:api` 経由のデータ流出**: 汎用 fetch がなくても、読んだデータを
  公開ノートとして投稿すれば外部へ出せる。ただし流出には必ず該当権限と
  API 呼び出しが要るため、S10 の導出表示に必ず現れる(不整合として検出可能)。
- **投稿者の Misskey アカウント乗っ取り**(S6)。
- **運営全体の悪意**: どのストアでも防げない前提としてスコープ外。
  単独犯は Tier 2 の 2 名レビューと git 透明性ログ(S1)で抑止する。
