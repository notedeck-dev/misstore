// UI の文言。アイテムの name / description は registry 側が持つ。
// ここの構造が正本で、他の言語はこの型に合わせる (notedeck site と同じ構成)。
// もともと英語で書いている UI ラベル (Install / Author など) は両言語共通なので載せない

const ja = {
  nav: {
    menu: 'メニュー',
    search: '拡張を検索…',
    colorMode: (mode: string) => `カラーモード切り替え (${mode})`,
    colorModes: {
      system: 'システム設定に追従',
      light: 'ライトモード',
      dark: 'ダークモード',
    },
    language: '言語',
  },
  home: {
    sub: 'テーマからスキルまで。見つけて、読んで、そのままインストール。',
    chip: 'Misskey / NoteDeck',
    heroSearch: 'テーマ・プラグイン・ウィジェット・クエリ・スキルを検索…',
    notice: '拡張の投稿は GitHub の Pull Request から',
    searchTitle: (q: string) => `「${q}」の検索結果`,
    searchNote: (n: number) => `種別をまたいで ${n} 件。`,
    seeAll: 'すべて見る',
    browse: '一覧を見る',
    // 種別カード (Hub の「はじめる」4 枚に相当) の一行説明
    kinds: {
      themes: 'Misskey / NoteDeck の配色',
      plugins: 'Misskey の AiScript プラグイン',
      widgets: 'NoteDeck のデッキに置くウィジェット',
      queries: 'NoteDeck のカラムフィルタ式',
      skills: 'NoteDeck の AI に持たせるスキル',
    },
    latest: '新着',
    contribute: {
      title: '拡張を投稿する',
      body: 'ログインもアカウントも要りません。GitHub の Pull Request で、ソースをそのまま配布します。レビューと CI の検査を通ったものがここに並びます。',
      guide: '投稿ガイド',
      format: 'レジストリ形式',
    },
  },
  catalog: {
    results: (n: number) => `${n} 件`,
    sortBy: '並び順',
    server: 'サーバー',
    serverHint: 'Install に使う Misskey サーバーのホスト名',
    searchIn: (kind: string) => `${kind} を検索…`,
  },
  footer: {
    say: 'NoteDeck / Misskey の拡張ストア。カタログは静的 JSON なので、他のクライアントからも読めます。',
    links: '関連リンク',
  },
  install: {
    ready: 'Misskey にインストール',
    needHost: 'Server 欄にホスト名を入力してください',
    hint: 'Misskey サーバーのホスト名を入れて Install を押すと、サーバー側の確認画面が開きます。',
  },
  integrity: {
    note: '配布ソースの SHA-512 チェックサム。インストール前の検証に使えます。',
  },
  code: {
    copy: 'コードをコピー',
    copied: 'コピーしました',
  },
  detail: {
    standalone: 'Standalone — 外部サービス連携なしで動作します',
    noPermissions: '追加の権限要求はありません',
  },
  query: {
    // <code>true</code> を挟む前後
    usageBefore: 'NoteDeck のカラム設定に貼り付けて使う AiScript フィルタクエリです。式が',
    usageAfter: 'を返したノートだけが表示されます。',
  },
}

export type Messages = typeof ja
export default ja
