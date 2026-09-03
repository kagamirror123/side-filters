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

1280×800 で `assets/store/` に用意済み。上げる順番もこの順でよい。

| ファイル                      | 内容                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| `assets/store/01-card.png`    | AI による概要のある検索で、カードが結果の右上に出ているところ |
| `assets/store/02-time.png`    | 「1週間」を選んだ状態                                         |
| `assets/store/03-exclude.png` | 除外に `Linkedin` を入れて、その結果が消えているところ        |
| `assets/store/04-options.png` | 設定画面（プリセットの編集）                                  |

元は Retina で撮ったものを `sips` で 1.6:1 に切って 1280×800 へ縮小した。撮り直すときも同じ手順でよい。

小さいプロモタイル 440×280 は任意だが、あると一覧での見え方がよくなる。
`assets/icon.svg` の図案を流用して作れる。

---

# 初回の申請手順

## 1. 開発者登録（1 回だけ・$5）

1. [Chrome ウェブストア デベロッパー ダッシュボード](https://chrome.google.com/webstore/devconsole) を開く
2. **拡張を所有させたい Google アカウント**でログインする。あとから移すのは手間なので、ここで決める
3. 登録料 **$5**（1 回きり、拡張ごとではない）を支払う
4. 公開元の表示名を決める。ストアの「提供元」に出る
5. アカウントに 2 段階認証を求められることがある。先に有効にしておくと詰まらない

## 2. パッケージを作る

```bash
task zip
```

`.output/side-filters-<version>-chrome.zip` ができる。バージョンは `package.json` の `version` がそのまま manifest に入る。

## 3. アイテムを作る

1. ダッシュボードで「新しいアイテム」→ 手順 2 の zip をアップロード
2. アップロードが通るとアイテム ID が発行される。**この ID を控える**（CI で自動化するときに使う）

## 4. ストアの掲載情報

このファイルの上半分から貼る。

| 欄                 | 内容                                |
| ------------------ | ----------------------------------- |
| 名前               | Side Filters for Google Search      |
| 概要               | 「概要（132 文字以内）」の節        |
| 説明               | 「詳細説明」の節                    |
| カテゴリ           | Tools                               |
| 言語               | English（既定）／ 日本語            |
| スクリーンショット | `assets/store/` の 4 枚（1280×800） |
| アイコン           | manifest の 128px が自動で使われる  |

## 5. プライバシー

| 欄                   | 内容                                         |
| -------------------- | -------------------------------------------- |
| 単一目的             | 「単一目的の説明」の節                       |
| 権限の理由           | 「権限の理由」の節（`storage` とホスト権限） |
| データ利用の申告     | 「プライバシーへの取り組み」の節             |
| プライバシーポリシー | PRIVACY.md の URL                            |

## 6. 配布

無料 / 公開 / 地域は全世界。

## 7. 審査に出す

「審査のために送信」を押す。審査は数日が目安。権限が `storage` とホスト 1 つだけなので重い部類ではない。
通ればストアに出る。

---

# 2 回目以降のリリース

## 手でやる場合

1. `package.json` の `version` を上げる（**同じバージョンは再アップロードできない**）
2. `task zip`
3. ダッシュボードの「パッケージ」タブから新しい zip をアップロード
4. 「審査のために送信」

掲載情報やスクリーンショットを変えないなら、触るのはパッケージだけでよい。

## CI で自動化する場合

`wxt submit`（[publish-browser-extension](https://github.com/aklinker1/publish-browser-extension)）が最初から入っているので、
タグを打つだけで審査に出すところまで自動化できる。

**できること / できないこと**

- できる: zip のアップロードと審査への提出、段階的公開（`--chrome-deploy-percentage`）
- **できない**: 掲載情報（説明文・スクリーンショット・カテゴリ）の更新。これは常にダッシュボードで手作業
- 審査は自動化しても省けない。「送信までが自動」であって「即公開」ではない

**準備**

1. **初回の申請は手でやる**。アイテム ID が要るのと、掲載情報は API で入れられないため
2. Google Cloud でプロジェクトを作り、**Chrome Web Store API** を有効化する
3. サービスアカウントを作り、鍵（クライアントのメールアドレスと秘密鍵）を発行する
   ※ Chrome Web Store API は v2 でサービスアカウント方式になった。旧 v1.1 のリフレッシュトークン方式は非推奨
4. ダッシュボードでそのサービスアカウントに、このアイテムへのアクセスを与える
5. GitHub の Secrets に入れる

   | Secret 名                      | 中身                       |
   | ------------------------------ | -------------------------- |
   | `CHROME_EXTENSION_ID`          | 手順 3 で控えたアイテム ID |
   | `CHROME_SERVICE_ACCOUNT_EMAIL` | サービスアカウントのメール |
   | `CHROME_SERVICE_ACCOUNT_KEY`   | サービスアカウントの秘密鍵 |

6. `npx wxt submit init` で対話的に設定を作れる。手元で `--dry-run` を付けて認証だけ確かめられる

**CI に足すジョブ**

いまの `.github/workflows/ci.yml` は `v*` タグで zip を artifact にするところまでやっている。
その後ろに提出を足す形になる。

```yaml
submit:
  needs: check
  if: startsWith(github.ref, 'refs/tags/v')
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - uses: jdx/mise-action@v3
    - run: npm ci
    - run: npm run zip
    - run: >
        npx wxt submit
        --chrome-zip .output/*-chrome.zip
        --chrome-extension-id "$CHROME_EXTENSION_ID"
        --chrome-service-account-client-email "$CHROME_SERVICE_ACCOUNT_EMAIL"
        --chrome-service-account-private-key "$CHROME_SERVICE_ACCOUNT_KEY"
      env:
        CHROME_EXTENSION_ID: ${{ secrets.CHROME_EXTENSION_ID }}
        CHROME_SERVICE_ACCOUNT_EMAIL: ${{ secrets.CHROME_SERVICE_ACCOUNT_EMAIL }}
        CHROME_SERVICE_ACCOUNT_KEY: ${{ secrets.CHROME_SERVICE_ACCOUNT_KEY }}
```

リリースの流れは「`version` を上げてコミット → `git tag v1.0.1` → push」だけになる。
