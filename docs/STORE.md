# Chrome ウェブストアの掲載内容

ストアの入力欄にそのまま貼れる形でまとめてある。掲載言語の既定は英語（manifest の `default_locale` に合わせる）。

## 基本情報

| 項目         | 値                                                                 |
| ------------ | ------------------------------------------------------------------ |
| 名前         | Side Filters for Google Search                                     |
| カテゴリ     | ダッシュボードの一覧から選ぶ（Tools が無ければ Productivity）      |
| 言語         | English（既定）／ 日本語                                           |
| 価格         | 無料                                                               |
| プライバシー | 開発者はデータを収集しない（下の「データの扱い」参照）             |
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

The developer does not collect browsing or personal data. Your presets and display
preferences are stored through Chrome Sync and are not sent to the developer. The
extension reads the current search URL in the page only to build its filter links, and
neither stores nor transmits it. It makes no network requests of its own, contains no
analytics or tracking, and asks only for the "storage" permission.

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

閲覧履歴や個人データを開発者が収集することはありません。プリセットと表示設定は
Chrome Sync に保存され、開発者には送られません。検索 URL は絞り込みリンクを
組み立てるためにページ内で読むだけで、保存も外部送信もしません。拡張自身の通信、
解析、トラッキングはありません。必要な権限は "storage" だけです。

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

## データの扱い（ストア・ポリシー・ダッシュボードで同じ定義を使う）

ストアの説明文、[PRIVACY.md](../PRIVACY.md)、ダッシュボードの申告は、次の 1 つの定義から派生させる。
言い回しがずれると審査でも利用者への説明でも信用を失う。

> The developer does not collect browsing or personal data. Your filter presets and display
> preferences are stored through Chrome Sync (`chrome.storage.sync`) and are not sent to the
> developer. The extension reads the current search URL in the page only to build its filter
> links; it does not store or transmit it. The extension makes no network requests of its own
> and contains no analytics or tracking.

ダッシュボードの「データ使用」フォームの回答:

- 個人情報・健康情報・金融情報・認証情報・個人的な通信・位置情報・ウェブ閲覧履歴・
  ユーザー活動・ウェブサイトのコンテンツ — **いずれも収集しない**（開発者へは何も送られない）
- リモートコードの使用 — **なし**（すべて拡張に同梱）
- 用途の制限、販売・譲渡しないことへの同意 — すべて該当

「収集しない」と「Chrome Sync に保存する」は矛盾しない。
Chrome Web Store の [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) と
[Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) の言うところの
「収集」は開発者側への送信を指す。ローカル／Sync のみで処理する場合も開示は要るので、上の定義をそのまま使う。

## スクリーンショット

1280×800 で `assets/store/` に用意済み。上げる順番もこの順でよい。

| ファイル                           | 内容                                                          |
| ---------------------------------- | ------------------------------------------------------------- |
| `assets/store/01-card.png`         | AI による概要のある検索で、カードが結果の右上に出ているところ |
| `assets/store/02-time.png`         | 「1週間」を選んだ状態                                         |
| `assets/store/03-exclude.png`      | 除外に `Linkedin` を入れて、その結果が消えているところ        |
| `assets/store/04-options.png`      | 設定画面の上半分（タイトル・説明・期間のプリセット）          |
| `assets/store/05-options-card.png` | 設定画面の下半分（言語のプリセット・カード・出す場所）        |

元は Retina で撮ったものを `sips` で 1.6:1 に切って 1280×800 へ縮小した。撮り直すときも同じ手順でよい。

設定画面（04 / 05）は 2026-09-04 に撮り直した。手順は「ビューポート 1024×640・DPR 2 で拡張の
`options.html` を開き、スクロール位置 0 と 560 で撮って `sips -z 800 1280` で縮める」。
1 枚に詰めるとタイトルか主要設定のどちらかが切れるので 2 枚に分けている。
画像は必ず実画面から撮る（作図で設定画面を再現しない）。

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

| 欄                 | 内容                                             |
| ------------------ | ------------------------------------------------ |
| 名前               | Side Filters for Google Search                   |
| 概要               | 「概要（132 文字以内）」の節                     |
| 説明               | 「詳細説明」の節                                 |
| カテゴリ           | Tools / Productivity（一覧から選ぶ）             |
| 言語               | English（既定）／ 日本語                         |
| スクリーンショット | `assets/store/` の 5 枚（1280×800、上限も 5 枚） |
| アイコン           | manifest の 128px が自動で使われる               |

## 5. プライバシー

| 欄                   | 内容                                         |
| -------------------- | -------------------------------------------- |
| 単一目的             | 「単一目的の説明」の節                       |
| 権限の理由           | 「権限の理由」の節（`storage` とホスト権限） |
| データ利用の申告     | 「データの扱い」の節                         |
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

- できる: zip のアップロードと審査への提出、段階的公開（`--chrome-deploy-percentage`）、提出だけして公開は保留（`--chrome-publish-type STAGED_PUBLISH`）
- **できない**: 掲載情報（説明文・スクリーンショット・カテゴリ）の更新。これは常にダッシュボードで手作業
- 審査は自動化しても省けない。「送信までが自動」であって「即公開」ではない
- **初回は必ず手でやる**。アイテム ID が要るのと、掲載情報は API で入れられないため。API を使うのは 2 回目以降だけ

**準備**

1. 上の「初回の申請手順」を手で終わらせ、アイテム ID を控える
2. Google Cloud でプロジェクトを作り、**Chrome Web Store API** を有効化する
3. サービスアカウントを作り、鍵（クライアントのメールアドレスと秘密鍵）を発行する
   ※ API v2 はサービスアカウント方式。旧 v1.1（リフレッシュトークン方式）は 2026-10-15 に終了予定
4. ダッシュボードでそのサービスアカウントに、このアイテムへのアクセスを与える
5. ダッシュボードの URL（`.../devconsole/<publisher-id>/...`）から **publisher ID** を控える。v2 では必須
6. GitHub の Secrets に入れる

   | Secret 名                      | 中身                                |
   | ------------------------------ | ----------------------------------- |
   | `CHROME_EXTENSION_ID`          | 手順 1 で控えたアイテム ID          |
   | `CHROME_PUBLISHER_ID`          | 手順 5 の publisher ID（v2 で必須） |
   | `CHROME_SERVICE_ACCOUNT_EMAIL` | サービスアカウントのメールアドレス  |
   | `CHROME_SERVICE_ACCOUNT_KEY`   | サービスアカウントの秘密鍵          |

7. 手元で試すなら `npx wxt submit init` が対話的に設定を作る。
   **作られる `.env.submit` には秘密鍵が入る**ので、絶対にコミットしない（`.gitignore` 済み）。
   `--dry-run` を付ければ認証だけ確かめられる

**同梱の CLI が API v2 で要求する項目**（`npx wxt submit --help` で確認できる。publish-extension 6.1.1）

| オプション                              | 用途                                         |
| --------------------------------------- | -------------------------------------------- |
| `--chrome-api-version v2`               | v2 を使う。付けないと v1.1 の扱いになる      |
| `--chrome-extension-id`                 | アイテム ID                                  |
| `--chrome-publisher-id`                 | **v2 専用・必須**。所有する publisher        |
| `--chrome-service-account-client-email` | **v2 専用**。サービスアカウント              |
| `--chrome-service-account-private-key`  | **v2 専用**。サービスアカウントの秘密鍵      |
| `--chrome-publish-type STAGED_PUBLISH`  | 任意。提出しても即公開しない                 |
| `--chrome-deploy-percentage`            | 任意。段階的公開（0〜100）                   |
| `--dry-run`                             | 認証だけ確かめる。アップロードも提出もしない |

**CI に足すジョブ**

`.github/workflows/ci.yml` の `release` job（`v*` タグ push で走り、zip を artifact にする）の後ろに足す形になる。

```yaml
submit:
  needs: release
  if: startsWith(github.ref, 'refs/tags/v')
  runs-on: ubuntu-latest
  permissions:
    contents: read
  steps:
    - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6.1.0
    - uses: jdx/mise-action@5228313ee0372e111a38da051671ca30fc5a96db # v3.6.3
    - run: npm ci
    - run: npm run zip
    - run: >
        npx wxt submit
        --chrome-api-version v2
        --chrome-zip .output/*-chrome.zip
        --chrome-extension-id "$CHROME_EXTENSION_ID"
        --chrome-publisher-id "$CHROME_PUBLISHER_ID"
        --chrome-service-account-client-email "$CHROME_SERVICE_ACCOUNT_EMAIL"
        --chrome-service-account-private-key "$CHROME_SERVICE_ACCOUNT_KEY"
        --chrome-publish-type STAGED_PUBLISH
      env:
        CHROME_EXTENSION_ID: ${{ secrets.CHROME_EXTENSION_ID }}
        CHROME_PUBLISHER_ID: ${{ secrets.CHROME_PUBLISHER_ID }}
        CHROME_SERVICE_ACCOUNT_EMAIL: ${{ secrets.CHROME_SERVICE_ACCOUNT_EMAIL }}
        CHROME_SERVICE_ACCOUNT_KEY: ${{ secrets.CHROME_SERVICE_ACCOUNT_KEY }}
```

Secrets を入れる前にこの job を足しても意味がないので、**初回公開が済んでから足す**。

---

# 運用（runbook）

短く保つ。困ったときにここだけ見れば戻せる、を目安にする。

## リリース前チェック

1. `task check`（lint・整形・型・build・テスト）が通る
2. `task zip` の中身を確認する: `unzip -l .output/side-filters-<version>-chrome.zip`
   - `manifest.json` の `permissions` が `["storage"]` だけ
   - `content_scripts.matches` が `https://www.google.com/search*` だけ
   - `.env*` などの秘密ファイルが入っていない
3. unpacked build を実 Chrome に読み込み、下の manual matrix を通す
4. 数日 dogfood する（初回は特に）

## manual matrix

全部の組み合わせを機械的に回す必要はない。壊れやすい境目を重ねて見る。

| 軸             | 見る値                                                            |
| -------------- | ----------------------------------------------------------------- |
| ビューポート   | 1280 / 1440 / 1750 / 2560px                                       |
| ズーム         | 100 / 125 / 200%                                                  |
| テーマ         | ライト / ダーク                                                   |
| 画面           | 通常 / ニュース / 動画 / 画像（出ないこと）                       |
| ナレッジパネル | あり（例: `python`）/ なし（例: `typescript satisfies operator`） |
| 期間           | 指定なし / プリセット / Google のカスタム期間                     |
| 置き場所       | 「検索結果の右」/「空きがあれば右上」を即時に切り替え             |
| 遷移           | URL 遷移・タブ切替・`#rhs` の遅延追加や差し替え                   |
| 設定画面       | 空プリセットの永続化 / 編集直後に閉じる / 歯車から開く            |
| 操作           | キーボードだけで辿れる・読み上げ名・focus の見え方                |

重点は「重なり」「消失」「誤選択」「保存漏れ」の 4 つ。
狭い幅と高いズームでは**出ないのが正しい**（検索結果に重なるくらいなら隠す）。

## tag・version・artifact の関係

- `package.json` の `version` が、そのまま manifest と zip 名（`side-filters-<version>-chrome.zip`）になる
- タグは `v<version>`。**タグ名と `package.json` が食い違うと release job が落ちる**（意図的な安全弁）
- 手順: `version` を上げてコミット → `git tag v1.0.1` → `git push --follow-tags`
- タグ push で `check` → `release` が走り、zip が artifact `side-filters-v1.0.1` として残る
- 同じ version は Chrome ウェブストアへ再アップロードできない。作り直すときも version を上げる

## staged publish の流れ

1. タグを push して artifact の zip を得る（または手元の `task zip`）
2. `--chrome-publish-type STAGED_PUBLISH` で提出する。審査は通っても公開はされない
3. ダッシュボードで公開を実行する。段階的に出すなら `--chrome-deploy-percentage` を上げていく
4. 問題が出たらダッシュボードで公開を止める

## ロールバック

Chrome ウェブストアに「前のバージョンへ戻す」操作はない。**必ず前へ進んで直す**。

1. 直前の正常な tag（例: `v1.0.0`）から branch を切る
2. 問題の変更だけを戻す
3. `version` を上げる（`1.0.1`）→ タグ → 提出
4. 緊急で被害が大きいときは、ダッシュボードで一時的に公開を停止（Unpublish）してから作り直す
5. 何を戻したかを、その tag のリリースノートか `docs/DESIGN.md` に 1 行残す

## Google の DOM 変更でカードが出なくなったとき

fail-closed なので「壊れる」ではなく「出なくなる」形で現れる。次の順で見る。

1. `chrome://extensions` で拡張が有効か、エラーが出ていないか
2. SERP の DevTools で `document.querySelector("#rcnt")` `#center_col` `#rhs` が存在するか
   → どれかが消えていたら、それが原因。`lib/placement.ts` の依存先を見直す
3. `document.querySelector("side-filters")` が居るか
   - 居ない: 置き場所が見つかっていない（1〜2 か、`isFilterablePage` が false）
   - 居るが `data-fit="collides"`: 重なる／幅が足りないので意図的に隠している。ウィンドウ幅とズームを見る
   - 居るが `data-slot` が想定と違う: Grid の構造が変わった
4. `getComputedStyle(document.querySelector("#rcnt")).gridTemplateColumns` で列の数と幅を測る
   → `docs/DESIGN.md` の実測表と比べる
5. 直したら、実測値を `docs/DESIGN.md` に更新して `lib/placement.test.ts` の fixture も合わせる

## 問い合わせを受けるときに聞くこと

Issue テンプレートにも同じ項目を置く。

- Chrome のバージョン（`chrome://version`）と OS
- 開いていた検索結果の URL（`q` は伏せてよいが、`tbs` / `lr` / `tbm` / `udm` はそのまま）
- ウィンドウの幅とズーム倍率
- Google のテーマ（ライト / ダーク）
- `document.querySelector("side-filters")` の有無と、あれば `data-slot` / `data-fit` / `data-theme`
- `#rcnt` / `#center_col` / `#rhs` の有無
