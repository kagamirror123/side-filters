# Side Filters

Google 検索結果の右カラムに、期間・言語・検索語で絞り込むチップを出す Chrome 拡張。
ストア掲載名は Side Filters for Google Search。

> 現状: 実装・テスト・ストア素材は揃っている。次は Chrome ウェブストアへの初回申請（手作業）。
> 2026-09-04 のレビュー（[docs/REVIEW.md](docs/REVIEW.md)）で挙がった P1・P2 は対応済み。
> タグ push からの release だけは、実際にタグを打つまで動作を確認できていない。

## なにをするツールか

- 検索結果の右（ナレッジパネルが出る位置）にカードを出し、「24時間」「1週間」のような期間をワンクリックで切り替える
- 言語（日本語 / 英語など）のチップも同じカードに出す。要らなければ設定で消せる
- 期間・言語は URL の `tbs` / `lr` を差し替えるだけ。検索語や他の条件はそのまま残る
- 検索語まわりも同じカードから触れる。完全一致（同義語展開なし）、フレーズ（引用符で囲む）、除外リスト
- データ収集も外部通信もしない（[PRIVACY.md](PRIVACY.md)）
- Google が「期間を指定」で絞っているときは、どの控えも選択中にせず「期間を指定中」とだけ示す
- 検索結果に重なる・幅が潰れると分かったときは、無理に出さずに引っ込む

## 狙いと非目標

Google の空いている右列に、よく使う絞り込みだけを、Google に馴染む小さなカードとして置く。
検索履歴を集めず、外部通信をせず、操作は普通のリンクのまま。

多目的な SERP ツールボックス、SEO スイート、検索履歴の管理にはしない。
機能数で競わず、静かさ・一貫性・壊れにくさを優先する（[docs/DESIGN.md](docs/DESIGN.md)）。

# 使う人向け

## 入れかた

Chrome Web Store で公開予定。公開後にここへリンクを書く。

開発版を試すときは、開発する人向けの手順でビルドし、`chrome://extensions` の「パッケージ化されていない拡張機能を読み込む」で `.output/chrome-mv3` を選ぶ。

## 使いかた

Google で検索すると、結果の右側にカードが出る。押すとその条件で検索し直す。

- **期間**: 「24時間」「1週間」…を選ぶ。先頭の「全期間」で解除
- **言語**: 「日本語」「英語」…を選ぶ。先頭の「全言語」で解除
- **検索語**: 「完全一致」（同義語に広げない）、「フレーズ」（検索語全体を引用符で囲む。2 語以上のとき）、除外欄（入れた語を含むページを外す）
- ニュースのときだけ、期間の横に「日付順」が出る

設定画面（カード右上の歯車、または `chrome://extensions` の「拡張機能のオプション」）で、
プリセットの編集、セクションの表示・非表示、カードを出す場所、テーマを変えられる。

## 消したいとき

`chrome://extensions` から削除する。設定も一緒に消える。

# 開発する人向け

## 構成

```
extension/
  entrypoints/
    google.content/       検索結果ページに入る content script・カード（React）・自前 CSS
    background.ts         歯車から設定画面を開くためだけの service worker
    options/              設定画面（kumo + phosphor、タブで開く）と自動保存
  lib/                    URL 組み立て・検索語の解析・設定・テーマ判定・配置・ライフサイクル
  public/_locales/        表示文言（en / ja）
  public/icon/            アイコン（assets/icon.svg から生成）
  testing/                テスト用の共通設定（表示文言の差し替え）
  manifest.test.ts        配布物の manifest を固定する
  a11y.test.tsx           カードと設定画面に axe をかける
docs/DESIGN.md            設計判断と却下した案・実測値・性能計測
docs/STORE.md             ストア掲載内容・申請手順・運用（runbook）
docs/REVIEW.md            2026-09-04 の総合レビューと、その後の対応
assets/store/             ストアのスクリーンショット（1280×800）
scripts/make-icons.sh     assets/icon.svg から PNG アイコンを作り直す
```

## セットアップ

[mise](https://mise.jdx.dev/) と [go-task](https://taskfile.dev/) が入っている前提。

```bash
mise install
task setup
```

## よく使うコマンド

| コマンド     | 内容                                        |
| ------------ | ------------------------------------------- |
| `task dev`   | 変更を監視してビルド                        |
| `task build` | `.output/chrome-mv3` へビルド               |
| `task check` | lint・整形・型・ビルド・テスト（CI と同じ） |
| `task fix`   | lint と整形の自動修正                       |
| `task zip`   | ストアに上げる zip                          |
| `task icons` | アイコンの PNG を作り直す                   |

## 決まりごと

- [WXT](https://wxt.dev/) + React 19 + TypeScript。`extension/entrypoints/` の各エントリがそのまま content script / ページになる
- 検索結果ページ側のカードは自前 CSS、設定画面は [kumo](https://github.com/cloudflare/kumo) + phosphor icons
- 設定は `chrome.storage.sync`。IndexedDB や `storage.local` は使わない（理由は DESIGN.md）
- Google のページ構造に依存するのは `#rcnt` / `#center_col` / `#rhs` の 3 つの id だけ。見つからなければ何も描かない
- 文言は `_locales` に置き、コードに直書きしない
- lint / 整形は oxlint / oxfmt、テストは vitest。`task check` が CI と同じ内容
- **build は test より前**に走らせる。`extension/manifest.test.ts` が production build の出力を読むため
- テストは純関数・カード・設定画面・ライフサイクル・配布物 manifest・アクセシビリティの 6 層
  （内訳は [docs/DESIGN.md](docs/DESIGN.md) のテストの節）
- 公開前の手動確認と、壊れたときの調べ方は [docs/STORE.md](docs/STORE.md) の運用の節
- コミットメッセージは日本語。Co-Authored-By は付けない

UI の設計と磨き込みには vpn-on-demand と同じ外部スキルを使う。
`.agents/skills/` にベンダリングし、`.claude/skills/` から symlink する。

これらは第三者の著作物なので**このリポジトリには含めていない**（`.gitignore` 済み）。
取得元と版は [skills-lock.json](skills-lock.json) に記録してあるので、必要なら同じものを取り直せる。

| スキル                        | 使うとき                       |
| ----------------------------- | ------------------------------ |
| `impeccable`                  | 画面の設計・作り直し・磨き込み |
| `web-design-guidelines`       | UI コードのレビュー            |
| `vercel-react-best-practices` | React の書き方                 |

## いまの状態と進め方

`task check` は通る。

1. ~~`lib/`: URL 組み立て（`tbs` / `lr` の差し替え）と選択中チップの判定、設定の読み書き。vitest で固める~~
2. ~~content script: `#rhs` / Grid への配置とテーマ判定~~
3. ~~カードの UI と CSS（連結ピル・全期間の区切り・格子への退避）~~
4. ~~設定画面（`entrypoints/options/`、kumo + phosphor）~~
5. ~~アイコン（`assets/icon.svg`）とストア素材（[docs/STORE.md](docs/STORE.md)、`assets/store/`）~~
6. ~~2026-09-04 のレビュー対応（期間の三状態・配置のライフサイクル・保存の契約・アクセシビリティ・CI とストア文言）~~

残っているのは Chrome ウェブストアへの初回申請（手作業）。
タグ push で release job が走ることは workflow 上そう書いてあるだけで、実際のタグではまだ確認していない。

## ドキュメント

- [設計判断と却下した案](docs/DESIGN.md) — 実測値、性能計測、テストの層
- [ストア掲載内容・申請手順・運用](docs/STORE.md) — リリース前チェック、manual matrix、ロールバック
- [総合レビュー（2026-09-04）と対応](docs/REVIEW.md)
- [プライバシーポリシー](PRIVACY.md)
