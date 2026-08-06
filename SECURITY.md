# Security Policy — misstore

misstore は Misskey / NoteDeck 拡張(テーマ・プラグイン・ウィジェット・クエリ・
スキル)の配布ストアです。設計上のセキュリティ原則は
[`security-principles.md`](security-principles.md)、詳細仕様は
[`docs/design/security.md`](docs/design/security.md) にあります。

## 報告してほしいこと

- 掲載中アイテムに悪性・不審な挙動を見つけた(データ外部送信、無断投稿・フォロー、
  権限と説明の不一致、難読化など)
- ストア/CI/配布経路の脆弱性
- 作者なりすまし・アイテム乗っ取りの疑い

## 報告方法

**公開 issue にしないでください。** GitHub の
[Security Advisories](https://github.com/notedeck-dev/misstore/security/advisories/new)
(Private vulnerability reporting)から報告してください。

- 一次応答の目標: 概ね数日以内(単独運営のため遅れることがあります)。
- 悪性アイテムが確認された場合の失効: `public/registry/revoked.json` への追加
  (コミット 1 つ)で行い、ストア UI と NoteDeck がクライアント側で照合します。

## 失効の限界(正直な明記)

- 素の Misskey に**既にインストール済み**のコピーには失効が届きません
  (Misskey は失効リストを購読しないため)。
- `i/webhooks` 等、Misskey サーバー側に永続副作用を残す操作は、アイテムを消しても
  残ります。これらは掲載前の人手レビューで重点的に見ます。

したがって防御の重心は事後失効ではなく**掲載前の審査**にあります。
