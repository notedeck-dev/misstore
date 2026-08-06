# Contributing — misstore

アイテム(テーマ・プラグイン・ウィジェット・クエリ・スキル)の配布は
**GitHub の Pull Request** で行います。Misskey ログインは使いません — 作者の同一性は
PR を出す GitHub アカウントが担保します。

## 手順

1. このリポジトリを fork する。
2. `public/registry/<種別>/<id>/` にディレクトリを作り、`meta.json`(skill は
   `skill.md` の frontmatter)と主ソースを置く。種別ごとの詳細な書式は
   [docs/registry-format.md](docs/registry-format.md) を参照。
3. `pnpm run registry:build` をローカルで実行し、成功することを確認する。
4. PR を出す。テンプレートのチェックリストに答える。

## セキュリティ上のルール(掲載条件)

配布物は**人間が読めるソースそのもの**です。以下は掲載できません
(詳細は [`security-principles.md`](security-principles.md)):

- 難読化・極端な minify・ビルド済み/生成済みコード(P1)
- 見た目とパーサ解釈を乖離させるテキスト(双方向制御文字・ゼロ幅文字など、S9)
- ホスト関数(`Mk:api` / `Nd:call` / `Nd:http` / `vault.fetch` 等)を変数に束縛
  したり間接的に呼ぶコード。権限を静的に読み取れなくなるため(P4/S10)
- `meta.id` とディレクトリ名の不一致、`meta.json` への `createdAt`/`updatedAt` 記入

## レビュー

- PR には GitHub Actions が機械的チェック(正規テキスト・SVG・ID 一意性・サイズ等)を
  自動でかけます。
- アカウント全権級の操作(投稿・DM・外部送信・自己書換)や外部 API を叩くアイテムは、
  **人間が全行を読みます**。外部接続先と「なぜ必要か」を PR に明記してください。
- CI が緑でも「安全」ではなく「機械的に問題が無い」だけです。悪意の最終判断は人間が
  行います。

## 悪性アイテムを見つけたら

[`SECURITY.md`](SECURITY.md) を参照してください(公開 issue にしないでください)。
