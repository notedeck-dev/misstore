# Red-team Log — misstore security spec

セキュリティ仕様(security-principles.md / docs/design/security.md)に対する
批判的検証の記録。各ラウンドで独立した攻撃者視点をぶつけ、反証を判定し、
仕様へ反映した内容を残す。判定は正直に行う — 「既に防がれている」「残存リスク
として受容済み」も反証と同格に記録する(なぜ成立しないかが後の設計判断を守る)。

判定語:
- **CONFIRMED**: 真の反証。仕様の主張を崩す。要修正。
- **RESIDUAL**: 仕様が受容済み、または受容すべき残存リスク。明記で対処。
- **DEFENDED**: 攻撃を試みたが仕様で既に防がれている(仕様の勝ち)。
- **PAPER**: 仕様は正しいが未実装。現在形の記述が「稼働中」と誤読される問題。

---

## Round 1 (2026-08, 攻撃者 4 名: 認証 / サプライチェーン / 悪性作者 / 運用経済)

### 最重要の構造的発見(複数攻撃者が独立に到達)

**R1-A. `Nd:call` / `Nd:http` が S10 権限導出モデルの射程外 — CONFIRMED(致命)**
S10 は「`Mk:api` の第一引数リテラルから権限を静的導出」とするが、出荷済みアイテムの
実際の外部通信・流出・自己書換の主経路は `Nd:call("vault.fetch", …)`(10 箇所)と
`Nd:http(テンプレートURL)`(url-safety-check:87 で実在)。`Nd:` 名前空間は S10 の
導出語彙(`Mk:api`/`Plugin:register_*`/`Mk:save`)に無い。「流出は必ず導出表示に
現れる」という残存リスク節の主張、および「エコシステムはバイナリストアに勝る」と
いう優位性が NoteDeck アイテムで成立しない。運用条項の「汎用 fetch が**将来**
追加されたら」は誤り — 運営者自身のクライアントに**既に存在**していた。
→ 反映: P4 を全ホスト関数へ一般化。S10 を全ホスト関数・引数レベル導出へ拡張
(security.md S10 改)。`Nd:http`/`vault.fetch`/`files.export` 保有は Tier 2。
`network.external` を `network.external:<host>` に粒度分解。

**R1-B. 公開経路は Git 一本ではない(デプロイ平面) — CONFIRMED(致命)**
`pnpm deploy` は `wrangler deploy` を呼び、`dist` は gitignore 済み。配信バイトの
source of truth は Worker asset store で、git はその入力にすぎない。Cloudflare
トークン保有者は git を迂回して任意配信でき、履歴に残らない。P2 は「能力の不在」
では書けない。→ 反映: P2 を「git は唯一の**正規**経路、逸脱は**検出**」に改訂。
外部モニタ(別権限ドメインで期待ハッシュ vs 実配信バイト突合)を必須化。

**R1-C. 生成物の三重コミットでレビュー対象 ≠ 配布物 — CONFIRMED(致命)**
`plugin.is`(レビュアーが読む source)・`api.json` の `data`(Misskey が実際に
install する実体)・`plugins.json` の `sha512`(install URL の hash)が git 内に
独立 3 コピーで存在し、`registry:build` は `build` に含まれない(vite は public/ を
コピーするだけ)。無害な `plugin.is` + 悪性 `api.json`(巨大 1 行で diff 不読)+
一致 sha512 で、詳細ページ・レビュー・Misskey のハッシュ検証を全通過。
→ 反映: 生成物を git から追放(.gitignore)し `registry:build` を `build` 前段へ。
または CI で `registry:build && git diff --exit-code`。IntegrityCard は表示中
ソースから WebCrypto で sha512 を再計算して突合(S11 改)。

**R1-D. 「仕様が紙」— CI・ブランチ保護・.github/・revoked.json が全て未実装 — PAPER**
`.github/` は履歴上一度も存在せず。main に branch protection なし(実測 404)、
全コミット未署名・merge commit ゼロ(全直 push)、書込権限者 1 名。security.md が
全て現在形(「CI が reject する」)で書かれ稼働中と誤読される。Tier 2「2 名レビュー」
は実数 1 名で構造的に充足不能。→ 反映: security.md の各 S に**実装状態欄**を必須化。
未実装の制御を現在形で書かない。Tier 2 を「2 名」から「投稿者以外 1 名 + 公開
異議申立期間(時間)」へ再定義。

### 認証(S7 / S6)

**R1-1. `user.host`/`username` を信じると acct 偽装 — CONFIRMED**
偽 Misskey が `{user:{username:"syuilo", host:"misskey.io"}}` を返せば D1 の
`syuilo@misskey.io` 行を乗っ取り、S6 の更新権を得る。`username` に改行や `@` を
入れれば PR 本文/meta.json/ログへのインジェクション。→ acct の host 成分は KV 復元
host のみ、`user.host != null` は reject、`username` を `^[a-zA-Z0-9_]{1,20}$` 再検証。

**R1-2. acct 文字列は所有権の根拠にならない(ドメイン失効・管理者) — CONFIRMED**
ドメイン失効後に第三者が取得し `bob` を再登録 / インスタンス管理者が `bob` を
削除再登録すれば、乗っ取りなしに acct を再取得できる。→ 同一性を `(host,
remote_user_id)` に錨。`remote_user_id`(Misskey の不変 user.id)を D1 に保存。

**R1-3. MiAuth confused-deputy(permission 改竄 + check レース) — CONFIRMED**
MiAuth に PKCE もアプリ登録もない。攻撃者が自前で `permission=write:*` 付き URL を
組み(name も自由)、ストアのコールバックドメインを借りて被害者に承認させ、check を
タイトループでレースして被害者トークンを先取り。ストア側は ok:false を見るだけ。
→ check 成功後トークンの実効権限を検証(空を期待、非空なら異常として拒否+警告)。
`/api/auth/start` を Origin 検証 + Turnstile で無認証量産を封じる。

**R1-4. `redirect:'follow'` が host 検証を無効化 — CONFIRMED**
Workers fetch は既定でリダイレクト追従。検証済み host が 307/308 で任意宛先へ
再送。無限長レスポンスで CPU/メモリ枯渇も。→ `redirect:'manual'` + 3xx 即エラー +
`AbortSignal.timeout(5000)` + レスポンスサイズ上限 64KB + Content-Type 検証。

**R1-5. ログイン CSRF / セッション固定(両方向) — CONFIRMED**
事前認証バインディングが無い。攻撃者が自分の認可を途中まで進めた session を被害者に
踏ませ、被害者のブラウザに攻撃者アカウントの Cookie を設定(SameSite=Lax は防げない)。
→ `/api/auth/start` で `__Host-preauth=<nonce>` 発行、KV に `sha256(nonce)` 保存、
コールバックは nonce 一致時のみ check。成功時セッション ID ローテート。

**R1-6. `__Host-` 接頭辞欠如 + Lax 2 分例外 — CONFIRMED**
兄弟サブドメインからの Cookie tossing、ログイン後 120 秒の CSRF 窓。
→ Cookie 名を `__Host-misstore_session`。全状態変更 API に `Sec-Fetch-Site:
same-origin` 必須。`workers_dev:false`。

**R1-7. 「トークン即破棄」の破棄漏れ経路 — CONFIRMED(1-3)/RESIDUAL(4)**
observability.logs 既定 on で `console.error(await res.text())` がトークンを永続
ログ化。`?session=` が HTTP ログ/Referer に残る(session は未消費なら bearer 等価)。
MiAuth 生成トークンは権限ゼロゆえ自己 revoke 不能で「接続済みアプリ」に蓄積し続ける
(RESIDUAL、明記すべき)。→ コールバックは必ず 302、`Referrer-Policy: no-referrer`、
check レスポンスを専用関数外に出さない + CI grep、ログイン完了画面で連携削除を案内。

**R1-8. KV はワンタイム消費を保証できない(結果整合性) — CONFIRMED**
KV の delete 伝播は非即時。複数コロへ並行投下で古い値を読み複数 check。ワンタイム性は
実は Misskey の check 実装に外部委託されており(フォークは保証せず)、運用条項に無い。
→ session 消費を D1 `DELETE … RETURNING`(単一プライマリで原子的)か DO で行う。
KV は使わない。「MiAuth のワンタイム性」を運用条項の監視対象へ。

**R1-9. 「初回ログインからの経過日数」は事前ファームで無力 — RESIDUAL/一部 CONFIRMED**
自前インスタンスで 100 アカウント量産→全ログイン→30 日後に投入で Sybil。日数は
時間コストのみで identity コストを上げない。→ 明記 + host 単位レート制限を追加。

**R1-10. `/api/auth/start` がオープンリダイレクタ兼無認証 KV 書込 — CONFIRMED(影響中)**
`store.notedeck.io/api/auth/start?host=phish.example` が信頼ドメイン配下の汎用
リダイレクタに。→ POST 限定 + Origin 必須 + Turnstile。302 でなく JSON で URL を
返し SPA が遷移(HTTP リダイレクトを無くす)。

**R1-11/12. 空 permission の意味論は外部依存 / コールバックのパラメータ汚染 — RESIDUAL/CONFIRMED**
空 permission=全権のフォークがあれば全権トークン。`?session=A&session=V` で
`get('session')` が最初を返す実装だと横取り。→ 運用条項に空 permission 意味論を追加。
`getAll('session').length !== 1` は 400。

**R1-13. NoteDeck クライアントの認証受け口 — CONFIRMED(空白)**
カスタム URI スキーム横取り、ループバック先取り、WebView の Cookie 平文、
`/api/*` の CORS 反射(ライブラリ全読み)。→ NoteDeck はセッション Cookie を使わず、
Web UI で明示発行する device token(`read:library` のみ、失効可)を使う。`/api/*` の
CORS は無条件無効(Origin 反射しない、Allow-Credentials 返さない)。

### 悪性作者(S2 / S4 / S9 / S10 / S13)

**R1-E. queries は AiScript(実行コード)なのに Tier 0 自動マージ — CONFIRMED**
`query.is` は AiScript で、build-registry は meta+sha512 しか見ず v1 サブセット
逸脱を検証しない。安全性を全消費者の再コンパイラ品質に委譲(P7 違反)。per-note CPU
DoS も。→ queries を Tier 1 へ。自動マージゲートにストア側サブセット linter 必須。

**R1-F. themes は「確認画面を描画する層」— Tier 0 でコントラスト攻撃 — CONFIRMED**
`fg≒panel`(権限リスト不読)、`warn/error≒bg`(警告消去)、accent のみ高コントラスト
(install ボタンだけ鮮明)なテーマが人手ゼロで自動マージされ、P5 の最後の防壁
(`/install-extensions` 確認画面)を不可視化。→ Tier 0 自動チェックに WCAG コントラスト
下限 + 値域検査。確認ダイアログ系 props(popup/modalBg/fg/warn/error)を触るテーマは
Tier 1。`background-image:url()` 相当のビーコンも値文法 lint で封じる。

**R1-G. skills → `plugins.create` のクロス Tier 越境 — CONFIRMED**
最軽量の skill 審査(Tier S)を通した悪性 skill が、AI に `Nd:call("plugins.create")`
で高権限プラグインを生成させる。生成物は git PR も plugin レビューも通らない第二の
取り込み経路。→ skill 本文が AI に `plugins.create/update`/`vault.fetch`/`files.export`
等を実行させる指示を含むことを S8/S13 の明示 reject 項目に。生成プラグインにも起動時
S10 導出+権限表示を強制。

**R1-H. S10 リテラル限定は AiScript 一級関数で回避 — CONFIRMED(素朴実装に対し)**
`let f = Mk:api; f(ep, params)` や高階関数・ディスパッチテーブルで、`Mk:api(` を
探す素朴スキャナを回避。厳密な別名解析は動的型付き言語で一般に決定不能。→ P4 の
とおり「ホスト関数は呼び出し構文形でのみ出現可、束縛/引数渡し/格納は無条件 reject」。
(注: AiScript インタプリタ未確認、Playground で 1 行検証を推奨)

**R1-I. エンドポイント名 ≠ capability(specified DM 流出 / webhook 永続化) — CONFIRMED**
`notes/create` に `visibility:"specified", visibleUserIds:[attacker]` で読んだ物を
DM 流出。導出表示は `notes/create` のみで宛先・可視性は出ない。`i/webhooks/create`
で Misskey サーバ自身が全ノートを attacker へ POST し続け、アンインストールも S5 失効も
超えて残る。→ 導出を**引数レベル**まで(visibility/visibleUserIds/webhook url)。
`i/webhooks/*` 等サーバ側永続副作用は専用最上位 Tier + 「アンインストール後も残る」
フラグ。

**R1-J. S4 更新 diff の欺き / 過剰宣言 envelope — CONFIRMED**
config 既定値 1 行フリップで挙動反転(diff 極小・permissions 不変で Tier 据置)。
過剰宣言は S10 で warning 止まりのため、広く宣言しておけば以後の危険エンドポイント
追加で permissions が増えず Tier が上がらない。→ Tier 判定を**導出エンドポイント集合の
差分**で行う。過剰宣言は warning でなく**掲載不可**。config 既定値・分岐条件変更を
diff 強調。

**R1-K. S13「レジストリ内参照は安全」は偽(バージョン化間接 injection) — CONFIRMED**
レジストリ内アイテムは攻撃者が投稿でき、更新される。skill A が skill B を参照し、
後日 B を悪性版に更新すれば A 経由で実効指示が差し替わる。frontmatter の
description/triggers もプロンプト注入面。→ skill 間参照もハッシュピン留め。他アイテムの
指示を参照・追従させる表現を reject。frontmatter 全フィールドを raw/rendered 検査へ。

**R1-L. homoglyph 検査が ID 限定、name/description が素通し — CONFIRMED**
S9 の homoglyph/bidi 排除は ID(`[a-z0-9-]`)のみ。`meta.name` に実物完全一致名 +
全角/合字が自由。ame テーマの UUID 末尾に非 hex `q` が実在(UUID 妥当性未検査)。
→ homoglyph/bidi/ゼロ幅検査を name/description/表示名へ拡張。類似検出を name 正規化
文字列にも。theme UUID 形式検査 + Misskey 標準テーマ UUID 衝突検査。

### 運用・経済・プライバシー・持続可能性

**R1-M. 「詰まったら遅延に倒れる」は歴史的に偽(AMO/Obsidian は浅化に倒れた) — CONFIRMED**
キュー圧力が数ヶ月続くと「掲載を遅らせる」でなく「レビューを浅くする」方に倒れる。
遅延はユーザーに見えるが浅化は誰にも見えないので浅化が選ばれる。→ 「キューが N 件/
M 日超で新規受理を自動停止」を数値で仕様化(遅延を自動化し人の意志に任せない)。
レビュアーが導出 capability 各項目にチェックした記録を PR に必須化(浅化の可視化)。

**R1-N. Tier 2 の 2 名レビューは充足不能 / self-merge — CONFIRMED**
→ Tier 2 を「投稿者以外 1 名 + 7 日間の公開異議申立期間」に置換(単独運営で
スケールする資源は人数でなく時間)。self-merge 禁止を branch protection に実設定。
2 人目確保まで Tier 2 相当の新規受理を停止と明記。

**R1-O. S5 失効: revoked.json 未実装で P7 現在進行違反 / MTTD 未論 — CONFIRMED**
kill switch がゼロで「失効手段を持たない配布形態」(P7 禁止)が現状そのもの。仕様は
MTTR(コミット 1 つ)しか論じず MTTD(検知)を論じない。専任なし・telemetry なし・
SECURITY.md なしで検知は「誰かが騒ぐまで」= 24-72h。→ revoked.json を空配列で即作成、
UI 警告を Phase 1 前倒し。SECURITY.md + 通報窓口 + 一次応答目標。素の Misskey 向けは
「詳細ページ警告 + 運営アカウント告知」を正式手順化。

**R1-P. S3 権限表示は consent fatigue で無力 — CONFIRMED(P5 の防壁過大評価)**
エンドポイント名の羅列はエンドユーザーには意味不明で読まれない(Android/Chrome の
実証)。S10 の価値はレビュアー向けで、エンドユーザーには効かない。→ エンドユーザー
向けは「エンドポイント名」から「危険度フラグ + 説明文との不整合の指摘」へ。カテゴリ別
期待プロファイルと導出結果の乖離を機械判定して赤表示。エンドポイント一覧は折畳み。

**R1-Q. 投稿者乗っ取りの緩和が単一防壁(P7 自己抵触) — CONFIRMED(緩和の十分性)**
「乗っ取られても更新は S4 のゲートを通る」が単一防壁化。Chrome 拡張連続侵害・
fractureiser はいずれも既存物への小差分でレビュー通過。既存権限内なら Tier も上がらず。
→ 投稿時に任意の公開鍵を登録させ更新 PR に署名要求(2FA 強制不能を回避しつつ Misskey
乗っ取りだけでは更新不可に。最も費用対効果が高い)。高権限更新に待機期間。長期無更新
アイテムの突然更新をフラグ。

**R1-R. T8 過小評価 — ライブラリは PII / GDPR / 運営者常時閲覧 — CONFIRMED**
`library` + `users(acct,display_name,avatar_url)` = 誰がどの拡張を使うかの完全リスト。
組合せは fingerprint。dlsite 連携が実在し NSFW 傾向が機微。acct+display_name+avatar は
個人情報で GDPR 対象。PRIVACY.md も規約もなし。「デフォルト非公開」は他ユーザーに対して
であって運営者に対してではない。→ T8 を「中」以上へ。display_name/avatar は保存せず
表示時取得。運営者閲覧可能を UI 明記。PRIVACY.md + 保存期間 + 削除手順を Phase 1
リリース条件。退会 = 物理削除。運営者も読めない設計(user 由来鍵で HMAC)を選択肢に。

**R1-S. MiAuth 導入自体がフィッシング面を増やす — CONFIRMED(「攻撃面ほぼ不変」は店側のみ)**
静的サイトゆえ偽ストアが完全コピー可能。偽 `store-notedeck.io` が `permission=write:*`
付き MiAuth に誘導、被害者の Misskey が出す確認画面は本物。misstore の権限ゼロ設計が
逆にユーザーを「権限を確認しない MiAuth」に慣らす。→ ログイン画面に「misstore は権限を
一切要求しません。権限が並ぶ確認画面は偽サイトです」を常時表示(権限ゼロを逆手に)。
公式ドメイン固定 + 類似監視。**ライブラリをログイン不要(ローカル + エクスポート)でも
使えるようにしログインを任意化**(S7 自身がライブラリ = ID リストで完結と認めている)。

**R1-T. 運営消滅・ドメイン失効・継承(悪意でなく「消滅」) — CONFIRMED(記述皆無)**
全 URL が store.notedeck.io 固定。ドメイン失効→第三者取得で revoked.json を空にでき、
NoteDeck はそこから取りに行く。放棄後も静的サイトは古い脆弱アイテムを配り続ける。
資金切れの安易な出口は「D1 停止」か「雑な譲渡」(event-stream 型)。→ ドメイン長期登録。
**NoteDeck にレジストリ公開鍵を焼き込み registry index に署名**(ドメイン移転でも鍵が
無ければ乗っ取れない。単一ドメイン依存を切る唯一の方法)。dead-man staleness 警告。
SUCCESSION.md。

**R1-U. S14 は既に破られている(外部 API 呼び出しは禁じていない) — CONFIRMED**
S14-3 は外部**アセット配置**を禁じるが外部 API **呼び出し**を禁じておらず、url-safety-
check/saucenao/todoist が外部を叩く。応答は未レビューで可変(ハッシュ固定の趣旨に反する)。
入れたのは外部貢献者でなく原則の著者本人。ロック文書は著者=唯一の実装者では自分への
ロックにならない。→ S14 に「外部 API 呼び出し」を追加し、禁止でなく**条件付き許可**
(Tier 2 + ホスト allowlist + 応答を信頼しない旨の明記)に降格。原則遵守を CI に落とす。

### DEFENDED(仕様の勝ち)

- **コールバックから host を受け取らない設計**は正しく効いている(被害者 session を
  攻撃者 host の check に流す経路を消す)。設計判断として質が高い。
- **Workers fetch にメタデータサービス SSRF 経路が無い**(素の形では内部 IP へ出られ
  ない)。成立するのは R1-4 のリダイレクト追従経由のみ。
- **`pnpm-workspace.yaml` の `allowBuilds` で lifecycle script が既定ブロック**は
  良い設計(ただしビルド時任意コードは vite/wrangler 経由で残る = R1 サプライチェーンの
  依存関係項)。
- **P2/S1 による被害限定**は本当に効く — 認証層の全滅(R1-1〜13)も最終的に「PR を作る
  能力」で止まる。**例外は Tier 0 自動マージと接続する箇所**(R1-E/F)で、そこだけは
  認証/投稿の穴が配布能力に化ける。→ Tier 0 自動マージは新規のみ、更新は必ず人手。

### 実装ギャップ(別枠、PAPER)
現行 `scripts/build-registry.js` は S2/S9/S10/S12 を未実装(必須フィールド + sha512 +
frontmatter パースのみ)。仕様が正しくてもコードが追いつくまで全アイテムが実質ノー
チェック。167 アイテムが既にこのゲート未通過で配布中。
