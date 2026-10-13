# 契約チェック — ストア配布物と NoteDeck 実装の機械照合

## 目的

ストアの配布物 (プラグイン / ウィジェット / スキル) は NoteDeck の AiScript 面 — `Nd:call` の
capability id、`Mk:api` の endpoint 対応表、`Nd:on` のイベント名、`Plugin:register_*` のフック、
権限キーと preset — に依存している。NoteDeck 側がこれらを改名・削除すると、ストアの配布物は
**インストールはできるのに動かない** (あるいは heartbeat スキルのように登録自体を拒否される)
状態になる。2026-10-12 の `theme.*` → `themes.*` 改名では、スキル 6 件が追従できていないことが
手作業の調査で初めて見つかった。

契約チェックはこの照合を機械化する。NoteDeck の正本 3 ファイルから抽出した
**契約スナップショット**をリポジトリに置き、全 PR で配布物をそれと照合する。NoteDeck 側の
変更は週 1 回の drift 検知で拾い、スナップショットの更新を人が PR で行う。

## 構成

| ファイル | 役割 |
|---|---|
| `scripts/contract/notedeck-contract.json` | 契約スナップショット (生成物。コミットする) |
| `scripts/sync-notedeck-contract.mjs` | スナップショットの再生成 (`pnpm contract:sync`) |
| `scripts/lib/derive-contract.mjs` | 配布物 1 件から契約を静的導出する `deriveContract()` (build-registry.js と verify が共用) |
| `scripts/verify-contract.mjs` | 全配布物の照合 (`pnpm contract:verify`)。CI の security-check で実行 |
| `.github/workflows/contract-drift.yml` | 週 1 回 NoteDeck main と比較し、差分があれば issue を立てる |

### スナップショットの中身

NoteDeck の正本から抽出する。取得元は `NOTEDECK_DIR` (ローカル checkout) か GitHub raw (`main`)。

| キー | 元ファイル | 内容 |
|---|---|---|
| `capabilities` | `crates/notecore/capabilities.json5` | `{ [id]: { permissions, exec: 'core'\|'device', cheap, confirm, untrusted } }` |
| `permissionPresets` | 同上 `permissions` | `{ [permissionKey]: ('readonly'\|'safe')[] }`。配列が空なら full のみ |
| `endpoints` | `src/permissions/misskeyEndpoints.generated.ts` | `{ [endpoint]: 'allow' \| 'deny:<why>' \| '<permissionKey>' }`。表に無い endpoint は NoteDeck 側で deny-by-default |
| `events` | `src/aiscript/events.ts` の `SUPPORTED_EVENT_NAMES` | `Nd:on` で購読できるイベント名 |
| `hooks` | `src/aiscript/plugin-api.ts` の `Plugin:register_*` | フック名 (`note_action` 等) |
| `ndFunctions` | `src/aiscript/notedeck-api.ts` | NoteDeck が注入する `Nd:*` / `NOTEDECK` の名前 (未知の `Nd:xxx` 検出用) |
| `source` | — | `repo` / `ref` (取得したコミット sha) / `origin` / `files` |

`capabilities.json5` は `json5` でパースする。読めなければ正規表現で近似抽出し、WARN を出す
(どちらでも同じ結果になることを確認済み)。各セクションが 0 件なら正本の形式変更とみなして fail する。

## 運用

### スナップショットの更新 (`pnpm contract:sync`)

```sh
NOTEDECK_DIR=~/.ghq/github.com/notedeck-dev/notedeck pnpm contract:sync   # ローカル checkout から
pnpm contract:sync                                                        # GitHub raw (main) から
pnpm contract:verify                                                      # 配布物が新しい契約で通るか
```

更新は NoteDeck 側の変更に配布物を追従させる PR と一緒に行う。`contract-drift` が立てた issue が
その入口になる (タイトルに新しい ref を含み、同じタイトルの open issue があれば二重に立てない)。

### 検証 (`pnpm contract:verify`)

全 `plugins/*/plugin.is` と `widgets/*/widget.is` を NoteDeck と同じ `@syuilo/aiscript@1.2.1` の
`Parser.parse` に通し (失敗は error)、`deriveContract()` の `issues` を集計する。`skills/*/skill.md`
も同様。error があれば exit 1。

- `--json` 機械可読出力 (contract-drift が使う)
- `--strict` `unresolved` も error にする (既定は warning)
- `--contract <path>` 別のスナップショットで照合する

出力様式は `check-registry-integrity.mjs` に合わせている (`WARN  [kind/id] …` / `ERROR [kind/id] …`)。

## 導出スキーマ (`deriveContract(kind, source, meta, contract?)`)

```js
import { deriveContract } from './lib/derive-contract.mjs'
const d = deriveContract('plugins', source, meta) // kind: 'plugins' | 'widgets' | 'skills'
```

```ts
{
  runsOn: ['notedeck'] | ['notedeck', 'misskey-web'],
  //   Nd:* / NOTEDECK / Ui:* を一切参照しないプラグインは両方。widget / skill は常に ['notedeck']
  profile: 'readonly' | 'safe' | 'full' | null,
  //   導出した全呼び出しが許可される最小 preset。何も呼ばなければ 'readonly'。
  //   解決できた呼び出しが無く unresolved だけなら null
  permissions: string[],   // 導出された必要 permission key (S10 の「導出値」。ソート済み)
  ndCalls: string[],       // Nd:call("<id>") のリテラル id。skill は本文バッククォート内の既知 capability id
  mkApi: string[],         // Mk:api("<endpoint>") のリテラル endpoint
  hooks: string[],         // Plugin:register_note_action → 'note_action'、Nd:register_command → 'command'、Nd:on("x") → 'on:x'
  external: boolean,       // Nd:http / Nd:call("http.fetch") / Nd:call("vault.fetch") のいずれか
  unresolved: string[],    // 第 1 引数がリテラルでない Nd:call / Mk:api / Nd:on ("Nd:call@L12")
  issues: string[],        // 契約違反。空なら合格
  parseError?: string      // AST 解析に失敗して正規表現にフォールバックしたとき (verify では error)
}
```

`issues` に入るもの:

- 未知の capability id / `Mk:api` の endpoint が対応表に無い (deny-by-default) / 恒久拒否 (`deny:*`) の endpoint
- `Nd:on` の未知イベント / 未知の `Plugin:register_*` / 未知の `Nd:*` ホスト関数
- ホスト関数 (`Nd:call` / `Mk:api` / `Nd:http`) を値として参照 (束縛・引数渡し。S10 / R1-H)
- `meta.permissions` が NoteDeck の permission key で宣言されているのに、導出された key がそこに無い (過少宣言)。
  未知の key を宣言している
- skill: `cheapCheckCapabilities` の id が未知、または `exec:core` かつ `cheap` でない (heartbeat 登録が拒否される)
- skill: 本文の `` `xxx.yyy` `` が「capability の名前空間 (単複のゆれ込み) + capability の動詞」の形なのに
  NoteDeck に無い (改名・削除の疑い。`theme.list` → `themes.list` のような改名を拾う)

`meta.permissions` が本家 Misskey の scope 形式 (`read:account` 等) のアイテムは照合できないので、
verify が warning を出す (導出値を併記)。

### 抽出の方法

`@syuilo/aiscript` の `Parser.parse` で AST を得て全ノードを歩く
(`notedeck/src/services/columnQuery/purity.ts` の識別子収集と同じ発想)。`call` ノードの
`target` が識別子 `Nd:call` 等なら第 1 引数を見る: `str`、または全パートが `str` の `tmpl`
ならリテラル、それ以外は `unresolved`。`call` の target 以外の位置に現れた `Nd:call` /
`Mk:api` / `Nd:http` 識別子は値参照として `issues`。コメントは AST に出ないので偽陽性にならない。

パースに失敗したソースは文字列リテラルを保ったままコメントを落とし、正規表現で近似する
(`parseError` を立てる。verify では別途 error になる)。

skill は frontmatter (フラット YAML + ブロックリスト) と本文を分け、本文のバッククォート内の
`xxx.yyy` トークンのうち `capabilities` に存在するものを `ndCalls` とみなす。

## profile の決め方

1. `ndCalls` の各 capability の `permissions` を集める
2. `mkApi` の各 endpoint の対応表の値を見る。`allow` は何も要求しない、`deny:*` は `issues`、
   それ以外は permission key として集める。表に無い endpoint は `issues`
3. `Nd:http` を呼んでいれば `network.external` を足す (`http.fetch` / `vault.fetch` は capability 側の
   宣言 — それぞれ `network.external` / `vault.use` — から入る)
4. 集めた全キーが `readonly` preset に含まれれば `readonly`、全キーが `safe` に含まれれば `safe`、
   それ以外 (preset に無いキー = full のみ、を 1 つでも含む) は `full`。`network.external` と `vault.use`
   は full のみなので `external: true` なら必ず `full`

NoteDeck の plugin 既定プロファイルは `safe` なので、`profile: 'full'` のアイテムは利用者が
権限を広げないと動かない。これは違反ではなく、ストアが表示する情報 (S3 の危険度フラグ)。

## 既知の限界

- **config 由来の宛先**: `Nd:call(Plugin:config.cap, …)` や `Mk:api(ep, …)` のように第 1 引数が
  リテラルでない呼び出しは `unresolved`。宛先は最悪ケース (任意) として人が読む (S10 / R2-6)。
  既定では warning、`--strict` で error
- **第 2 引数**: `vault.fetch` の `connectionRef` / `path`、`Nd:http` の URL、`notes/create` の
  `visibility` 等、引数レベルの導出はしていない
- **クエリ (`queries/*/query.is`)**: ⚡ (QIR コンパイル) / 🐢 (Interpreter 降格) の判定には NoteDeck 側
  のコンパイラが必要で未対応。クエリは契約チェックの対象外
- **`exists NOTEDECK` で分岐するプラグイン**: `NOTEDECK` を参照した時点で `runsOn: ['notedeck']` に
  なる。本家でも動くよう分岐しているプラグインを両対応と判定するにはフロー解析が必要
- **skill 本文の改名検出**: 動詞まで変わった改名 (`plugins.setActive` → `plugins.setEnabled`) は
  「名前空間 + 動詞」ヒューリスティックに掛からない。`ai.heartbeat` (HEARTBEAT の principal id) は
  capability でない既知 id として除外している
- **実行時の挙動**: 静的検査なので、呼び出しが到達するか・引数が妥当か・返り値を正しく扱うかは
  見ない (今日の手作業検証のようなモック env での実行は別物)

## security.md S10 との関係

S10 (権限を全ホスト関数から導出) の「AST 上で全ホスト関数を拾い、宣言と突合し、導出不能は赤フラグ」
のうち、**第 1 引数レベルの導出・宣言 (`meta.permissions`) との過少宣言検査・値参照の reject・
unresolved の警告**をこのチェックが実装する。S10 が「天井」とした第 2 引数 (宛先) の導出と、
Plugin:config 由来の引数の扱いは未実装のまま (unresolved として人が読む)。契約スナップショット
は S10 の導出が参照する「NoteDeck 側の正本」を固定したものであり、運用条項の「NoteDeck 自身の
ホスト関数追加を追跡する」は contract-drift が担う。

## 既知の欠落(known gaps)

notedeck 側の不備で配布物が「違反」判定になるとき、`scripts/contract/known-gaps.json` に
endpoint と issue URL を書くと `verify-contract.mjs` が error を warning に降格する。
降格は endpoint 対応表の欠落だけを対象にする(capability の改名や権限不足は降格しない)。
issue が閉じたら該当行を消す。消し忘れは次のスナップショット更新で表に載った時点で
「降格対象なのに違反が出ない」状態になるだけで安全側だが、`contract-drift` の issue 本文に
known-gaps の件数を出すので気づける。

初期エントリだった `meta` / `i` / `emojis` / `stats`(notedeck#1250)は notedeck 側の欠落ではなく、
同期スクリプトが引用符つきのキーしか読んでいなかったための誤検知だった(biome は識別子として
書けるキーの引用符を外す)。同期スクリプトは引用符なしのキーも読み、読めない行があれば失敗する。
