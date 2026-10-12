# カラムクエリの原子対応表

配布クエリは、NoteDeck のカラムクエリが解釈できる**原子クエリ**(1 フィールド × 1 演算)を
できるだけ 1 つ以上の実用アイテムで例示するように選んでいる。アイテム自体は原子でも
分子(AND / OR / 否定の合成)でもよいが、**実際に絞り込めて用途がある**ものだけを置く。

- ⚡ = QIR v1 サブセット内(キャッシュ検索・FTS プリフィルタが効く)
- 🐢 = サブセット外だが純粋(Worker で 1 件ずつ逐次適用。`tags` に `sequential`)

原子の定義は notedeck `src/services/columnQuery/compiler.ts` の `NOTE_FIELD_TYPES` と
メソッド allowlist、🐢 側は `NormalizedNote`(`src/bindings.ts`)のフィールド。

## ⚡ サブセット内の原子

| 原子 | 例示するアイテム |
|------|------------------|
| `note.text` の `incl` | keyword-dig / topic-watch / keyword-hide / link-only / no-link / hashtag-watch |
| `note.text` の `starts_with` | calm-timeline(冒頭 @ の呼びかけ) |
| `note.text` の `lower` | topic-watch / keyword-hide / link-only / spam-guard |
| `note.text == null` | calm-timeline(純リノート判定)/ quotes-only |
| `note.cw` | no-cw / keyword-hide / topic-watch |
| `note.visibility` | public-only / non-public-only / calm-timeline |
| `note.localOnly` | no-federation |
| `note.renoteId` | quotes-only / calm-timeline |
| `note.replyId` | calm-timeline / foreign-reply-hide |
| `note.files.len` | text-only |
| `note.reactions["絵文字"]` | reaction-boost |
| `note.user.username` | user-hide / user-watch |
| `note.user.host`(`==` / `null`) | local-only / remote-only / server-only / server-hide / user-watch |
| `note.user.host` の `ends_with` | server-hide(サブドメイン群) |
| `note.user.name` | spam-guard(表示名なし) |
| `let` + 否定の合成 | calm-timeline / spam-guard |
| 純粋関数(`@f(x) {}`) | keyword-hide / topic-watch / hashtag-watch / server-hide / user-hide / user-watch / reaction-boost |

**例示していない ⚡ 演算:** `str.upper`(`lower` と等価で用途が増えない)、`arr.incl`
(サブセット内の配列は `files` だけで、要素がオブジェクトのため実用形がない)、
`str.ends_with` の本文適用(用途が立たない。host 側で例示)。

## 🐢 サブセット外の原子

| 原子 | 例示するアイテム |
|------|------------------|
| `note.renoteCount` | renote-boost |
| `note.repliesCount` | discussion-watch |
| `note.myReaction` | reacted-hide |
| `note.channelId` | channel-hide / channel-only |
| `note.poll` | poll-watch |
| `note.user.isBot` | bot-only(隠す向きは組込トグル) |
| `note.user.isCat` | cat-only |
| `note.files[].type`(`some` + `starts_with`) | video-only |
| `note.renote.text` / `note.renote.files` | hashtag-hide / video-only |
| `note.reply.user`(投稿者との横断比較) | foreign-reply-hide |
| `note.modeFlags["isNoteInYamiMode"]` | yami-hide |
| `str.len` | long-hide / long-only |

**例示していない 🐢 フィールドと理由:**

| フィールド | 理由 |
|-----------|------|
| `createdAt` / `updatedAt` / `poll.expiresAt` | クエリに現在時刻がなく、日時文字列は比較演算も使えない |
| `files[].isSensitive` | 組込トグル(センシティブ非表示)と重複 |
| `files[].size` / `files[].name` | サムネイル表示には効かず用途が立たない |
| `emojis` / `reactionEmojis` / `user.emojis` / `user.avatarDecorations` | 表示用メタデータで絞り込み対象にならない |
| `reactionAcceptance` / `visibleUserIds` / `uri` / `url` / `isFavorited` / `contentHidden` | 実用的な絞り込みが見つかっていない(需要があれば追加) |
| `user.instance` | `name` / アイコン類のみでソフトウェア名を持たず、ホストで足りる |
| `channel.name` | 特定チャンネルはチャンネルカラムの方が正確 |

## 分子クエリにする基準

適用は複数クエリの **And 合成** なので、`A && B` の形は原子アイテムを 2 つ入れれば組める。
分子アイテムにするのは、And 合成では組めない形のときだけ:

- **OR**(`A || B` で広げる)…… topic-watch / hashtag-watch の複数キーワード
- **連言の否定**(`!(A && B)` で隠す)…… spam-guard(リモート ∧ リンク ∧ (メンション ∨ 表示名なし))
- **フィールド横断比較**(`note.reply.user.username == note.user.username`)…… foreign-reply-hide
- **複数条件の一括非表示**を 1 アイテムで済ませる利便性 …… calm-timeline

## 検証

追加・変更時は notedeck の実コンパイラ(`compileColumnQuery`)と参照評価器
(`createReferenceFilter`、AiScript 1.2.1)に全アイテムを通し、⚡ は警告ゼロ、🐢 は
`degradable: true`、代表的なノート群で per-note エラー(`error` verdict)がゼロであることを確認する。
