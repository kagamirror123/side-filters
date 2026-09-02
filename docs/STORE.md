# Chrome ウェブストアの掲載内容

ストアの入力欄にそのまま貼れる形でまとめてある。掲載言語の既定は英語（manifest の `default_locale` に合わせる）。

## 基本情報

| 項目         | 値                                                                 |
| ------------ | ------------------------------------------------------------------ |
| 名前         | Side Filters for Google Search                                     |
| カテゴリ     | Tools（ツール）                                                    |
| 言語         | English（既定）／ 日本語                                           |
| 価格         | 無料                                                               |
| プライバシー | データを収集しない（下の「プライバシーへの取り組み」参照）         |
| ポリシー URL | https://github.com/kagamirror123/side-filters/blob/main/PRIVACY.md |
| サポート URL | https://github.com/kagamirror123/side-filters/issues               |

## 概要（132 文字以内）

**English**

> One-click time, language and search-term filters beside your Google results.

**日本語**

> Google 検索結果の横で、期間・言語・検索語の絞り込みをワンクリック。

## 詳細説明

**English**

```
Side Filters puts a small card next to your Google results so you can narrow a search
without going back to the search box.

• Time — Past 24 hours, week, month, 6 months, year, 3 years. Edit the presets freely.
• Language — Japanese, English, or any Google language code you add.
• Search terms — Verbatim (no synonym expansion), Phrase (wrap your words in quotes),
  and an exclusion list for words you want out of the results.
• On the News tab, a "By date" toggle appears next to Time.

Everything is one click. The card only changes the parts of the URL it owns, so your
query and any other settings stay as they are.

The card follows Google's own light and dark themes, so it does not look bolted on.
Options let you edit every preset, hide sections you do not use, and choose where the
card appears.

No data is collected, stored or sent anywhere. The extension makes no network requests
of its own and asks only for the "storage" permission, used to keep your presets.

Open source (MIT): https://github.com/kagamirror123/side-filters
```

**日本語**

```
Side Filters は、Google の検索結果の横に小さなカードを出します。
検索ボックスに戻らずに、そのまま絞り込めます。

・期間 — 24時間・1週間・1か月・6か月・1年・3年。プリセットは自由に編集できます
・言語 — 日本語・英語のほか、Google の言語コードを足せます
・検索語 — 完全一致（同義語に広げない）、フレーズ（検索語全体を引用符で囲む）、
  結果から外したい語を入れる除外リスト
・ニュースのタブでは、期間の横に「日付順」が出ます

どれもワンクリックです。カードは URL のうち自分が担当する部分だけを書き換えるので、
検索語やほかの条件はそのまま残ります。

カードは Google のライト／ダークに追随するので、後付けに見えません。
設定画面では、プリセットの編集、使わないセクションの非表示、カードを出す場所を選べます。

データの収集・保存・送信は一切ありません。拡張自身の通信も行わず、必要な権限は
プリセットを保存するための "storage" だけです。

オープンソース（MIT）: https://github.com/kagamirror123/side-filters
```

## 単一目的の説明

```
This extension has one purpose: to add filter controls for Google Search result pages.
It renders a card on google.com/search that rewrites the current search URL to apply
time, language and search-term filters.
```

## 権限の理由

| 権限                        | 理由                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                   | ユーザーが編集した期間・言語のプリセットと表示設定を保存するため。`chrome.storage.sync` のみを使い、外部には送らない                  |
| ホスト権限 `www.google.com` | 検索結果ページにカードを描き、現在の URL を読んで絞り込みリンクを組み立てるため。content script の `matches` に含まれる唯一のドメイン |

英語で書くなら:

```
storage: Saves the user's own filter presets (time ranges, languages) and display
preferences. Uses chrome.storage.sync only; nothing is sent anywhere.

Host permission for www.google.com: The extension renders its card on the search
results page and reads the current URL to build the filter links. This is the only
site the content script runs on.
```

## プライバシーへの取り組み（フォームの回答）

- 個人情報・健康情報・金融情報・認証情報・個人的な通信・位置情報・ウェブ閲覧履歴・
  ユーザー活動・ウェブサイトのコンテンツ — **いずれも収集しない**
- リモートコードの使用 — **なし**（すべて拡張に同梱）
- 用途の制限、販売・譲渡しないことへの同意 — すべて該当

## スクリーンショット

1280×800（推奨）または 640×400。最大 5 枚。撮りたい場面:

1. **ナレッジパネルが無い検索**（例: `typescript satisfies operator`）— カードが結果の右上に出ているところ
2. **期間を選んだ状態** — 「1週間」が青く塗られているところ
3. **除外を使っているところ** — 除外欄にチップが 2 つ入っている状態
4. **設定画面** — プリセットの編集と「カードを出す場所」の選択が見えるところ
5. **ライトテーマ** — 同じカードがライトでも馴染んでいるところ

小さいプロモタイル 440×280 は任意だが、あると一覧での見え方がよくなる。
`assets/icon.svg` の図案を流用して作れる。
