<div align="center">

# misstore

**Misskey / NoteDeck 拡張ストア — テーマ・プラグイン・ウィジェット・クエリ・スキルを探してインストール**

[![security-check](https://github.com/notedeck-dev/misstore/actions/workflows/security-check.yml/badge.svg)](https://github.com/notedeck-dev/misstore/actions/workflows/security-check.yml)
[![License](https://img.shields.io/github/license/notedeck-dev/misstore?style=flat-square)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/notedeck-dev/misstore?style=flat-square)](https://github.com/notedeck-dev/misstore/commits)
[![GitHub Issues](https://img.shields.io/github/issues/notedeck-dev/misstore?style=flat-square)](https://github.com/notedeck-dev/misstore/issues)
[![GitHub Stars](https://img.shields.io/github/stars/notedeck-dev/misstore?style=flat-square)](https://github.com/notedeck-dev/misstore/stargazers)
[![Made with Vue](https://img.shields.io/badge/Vue-3-42b883?style=flat-square&logo=vuedotjs)](https://vuejs.org)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?style=flat-square&logo=cloudflare&logoColor=fff)](https://developers.cloudflare.com/workers/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

[**🛒 ストアを開く**](https://store.notedeck.io) ·
[投稿する](CONTRIBUTING.md) ·
[レジストリ形式](docs/registry-format.md) ·
[セキュリティ](SECURITY.md) ·
[設計](docs/design/security.md)

</div>

---

## これは何?

**misstore** は Misskey と [NoteDeck](https://github.com/notedeck-dev/notedeck) の拡張を
配布するストアです。[store.notedeck.io](https://store.notedeck.io) から拡張を検索・
プレビューし、自分の Misskey インスタンスや NoteDeck にインストールできます。

配布物はすべて**人間が読めるソースそのもの**(AiScript / JSON5 / Markdown)です。
バイナリもビルド工程も無いので、入れる前に「何が入るか」を全文確認できます。

## 扱う拡張

| 種別 | 何をするもの | 形式 |
|------|-------------|------|
| 🎨 **テーマ** | Misskey / NoteDeck の配色 | `theme.json5` |
| 🧩 **プラグイン** | Misskey の AiScript プラグイン(投稿補助・ノート操作など) | `plugin.is` |
| 📊 **ウィジェット** | NoteDeck の AiScript App ウィジェット | `widget.is` |
| 🔎 **クエリ** | NoteDeck のカラムフィルタ式 | `query.is` |
| 🤖 **スキル** | NoteDeck の AI に持たせるシステムプロンプト | `skill.md` |

## 使う

1. [store.notedeck.io](https://store.notedeck.io) を開く。
2. 拡張を探して詳細ページでソースを確認。
3. インストール(Misskey の確認画面 / NoteDeck のカラムから)。

利用状況(どの拡張を入れているか)は NoteDeck 側の手元で管理されます。misstore は
アカウントもログインも持たず、あなたのデータを一切保存しません。

## 投稿する

拡張の配布は **GitHub の Pull Request** で行います(Misskey ログインは不要)。

- 全体の流れとセキュリティ上のルール → [CONTRIBUTING.md](CONTRIBUTING.md)
- 種別ごとの書式・カテゴリ・制約 → [docs/registry-format.md](docs/registry-format.md)

投稿は GitHub Actions が機械的にチェックし、アカウント全権級の操作を含むものは
人間がレビューします。

## 開発

```bash
pnpm install
pnpm run dev       # 開発サーバー
```

| コマンド | 説明 |
|---------|------|
| `pnpm run dev` | 開発サーバー起動 |
| `pnpm run build` | 型チェック + プロダクションビルド |
| `pnpm run preview` | ビルド結果のプレビュー |
| `pnpm run registry:build` | レジストリインデックスの再生成 |
| `pnpm run deploy` | Cloudflare Workers へデプロイ |
| `pnpm run typecheck` | 型チェックのみ |

**技術スタック:** Vue 3 + TypeScript + Vite / pnpm / Cloudflare Workers (Static Assets)

## ドキュメント

- [CONTRIBUTING.md](CONTRIBUTING.md) — 投稿の手順とルール
- [docs/registry-format.md](docs/registry-format.md) — レジストリ構造・種別ごとの書式
- [SECURITY.md](SECURITY.md) — 脆弱性・悪性アイテムの報告
- [security-principles.md](security-principles.md) — セキュリティ原則(ロック文書)
- [docs/design/security.md](docs/design/security.md) — セキュリティ詳細仕様
- [design.md](design.md) — デザインシステム

## ライセンス

MIT
