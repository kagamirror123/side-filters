# Side Filters 総合レビュー

レビュー日: 2026-09-04  
対象: `main` / `75604c9` (`docs: ストアの申請手順とリリース自動化の手順を追加`)

## 結論

Side Filters は、**個人の明確な不便を解く道具としては筋がよく、コードと見た目の基礎品質も高い**。URL を状態の正本にする、Shadow DOM で Google と隔離する、権限と通信を最小化する、壊れたときは表示しない、という判断は維持してよい。現在の Google 検索でもカードは所定の列に収まり、ライト／ダークとも後付け感が少ない。

一方、現状を「実装完了、残りはストア申請だけ」とするのは早い。公開前に解消すべき機能上・運用上の問題がある。

- Google のカスタム期間が有効でも「全期間」が選択中になる。
- 設定画面は「開いている検索結果にもすぐ反映」と案内するが、配置変更ではカードを差し直さない。
- 自動保存は最後の変更を失いうるうえ、失敗を利用者へ示さない。空のプリセットも見た目どおりには保存されない。
- `v*` タグで zip を作るつもりの CI は、タグ push では起動しない。公開手順の Chrome Web Store API v2 設定も不足している。
- `wxt submit init` が作る秘密情報入り `.env.submit` を `.gitignore` が除外していない。
- ストア文言は「保存しない」と「Chrome Sync に保存する」を同時に述べている。
- UI は視覚的にはよいが、入力エラー、除外チップ、トグルの ARIA に公開前に直せるアクセシビリティ欠陥がある。
- 「同じ体験の現役代替はない」という 2026-09-02 の競合調査は、現在確認できる Chrome Web Store の近似製品と矛盾する。

したがって、**P0（今すぐ止血が必要な障害）はないが、P1 を直して回帰テストを足すまでストア提出は見送る**のが妥当である。全面リライトや UI 刷新は不要で、主に状態表現、ライフサイクル、保存、配布経路を局所的に直せばよい。

## 評価の前提と調査範囲

次を確認した。

- リポジトリ内の全ソース、設定、README、`docs/DESIGN.md`、`docs/STORE.md`、プライバシーポリシー、ストア画像
- 7 コミットの履歴、過去に記録された自作理由・配置判断・実 Chrome 検証手順
- `task check`（lint、format、TypeScript、Vitest、build）と `task zip`
- 生成された MV3 manifest、配布 zip、バンドルサイズ
- GitHub の公開状態、CI 実行、Issue、Release、tag
- 実 Chrome の Google 検索結果（通常、ニュース、カスタム期間、除外語、ナレッジパネルあり）
- WXT、Chrome Extensions / Chrome Web Store、WAI-ARIA、現行 Web Interface Guidelines の一次情報
- Chrome Web Store と Greasy Fork の現行競合

制約も明記しておく。

- ストア掲載は見つからず、README も公開予定としている。よって調べられる「本番サービス」はなく、実際の利用者数、継続率、レビュー、障害履歴は評価できない。
- 実 Chrome の検証環境は 2560×1289 CSS px、DPR 2。狭幅、ズーム、Windows、Chrome Beta は未検証である。
- ブラウザ操作のセキュリティ制約により `chrome-extension://` の設定画面を直接操作できなかった。設定画面はソースと 1280×800 のストア画像で監査した。
- Performance trace 用の Chrome DevTools 接続が利用できなかった。サイズは測ったが、LCP / INP / CPU 時間への実害は未計測である。
- ライブの `npm audit` は registry 応答待ちで完了しなかった。`npm audit --offline` のローカル advisory cache では 0 件だったが、これを最新の脆弱性監査完了とは扱わない。GitHub Dependabot alerts も現在の CLI token 権限では取得できなかった。

## 優先度

- **P0**: 公開・利用を直ちに止める必要があるもの。今回はなし。
- **P1**: Chrome Web Store へ出す前に直すもの。
- **P2**: 初回公開直後の保守性・品質改善。
- **P3**: 計測や利用実態を見てから判断するもの。

複雑さ欄は、修正後の恒常的な複雑さが `↓` 減る、`→` ほぼ変わらない、`↑` 増える、を表す。

## 優先事項の一覧

| ID      | 優先度 | 問題 / 方針                                                                 | 期待効果                                                           | 複雑さ   | 実施しない場合                                                          |
| ------- | ------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------- |
| F-01    | P1     | カスタム期間を「指定なし」と区別する                                        | 現在の検索条件を正しく表示し、解除操作の意味も明確になる           | →        | 絞り込み中なのに「全期間」と誤案内し続ける                              |
| F-02    | P1     | URL 遷移、DOM 差し替え、設定変更、resize 時に配置を再評価する               | Google の SPA 的遷移や遅延描画、設定変更に追従する                 | ↑ 小     | カードが古い位置に残る、消えたままになる、狭幅で衝突する可能性が残る    |
| F-03    | P1     | 自動保存に flush、保存状態、エラー処理を加える                              | 「保存された」という利用者の期待と実データを一致させる             | ↑ 小     | タブをすぐ閉じたときや quota / API 失敗時に設定が黙って失われる         |
| F-04    | P1     | 空配列の意味を決め、UI と正規化を一致させる                                 | 削除操作が予測可能になる                                           | →        | 最後の行を削除しても再読込で既定値が復活する                            |
| R-01    | P1     | tag trigger、CWS API v2 の必須値、`.env.submit` 除外を直す                  | リリース失敗と秘密鍵誤コミットを防ぐ                               | →        | 「タグだけで提出」が動かず、鍵漏えいの人為リスクも残る                  |
| P-01    | P1     | ストア説明と Privacy 文言を実装どおりにそろえる                             | 審査時と利用者への説明の信頼性が上がる                             | ↓        | 「保存しない」と「sync 保存」の矛盾が残り、審査・信頼を損なう           |
| A-01    | P1     | 入力エラーの関連付け、除外削除の操作領域・名前、トグル semantics を修正する | キーボード・スクリーンリーダー・細かなポインティング操作を改善する | →        | 視覚以外でエラー理由や操作対象が分かりにくいまま公開される              |
| T-01    | P1     | 上記の壊れ目に component / lifecycle テストを置く                           | 既存 101 テストでは捕まらなかった回帰を防ぐ                        | ↑ 小     | 純関数が通っても利用者向け挙動が壊れる状態が続く                        |
| V-01    | P1     | 「競合なし」を撤回し、狙う価値を明文化する                                  | 機能競争ではなく、静かさ・一貫性・導入容易性で判断できる           | ↓        | より多機能な現役競合を無視して機能追加の軸がぶれる                      |
| D-01    | P2     | 重複コード、重複プリセット、引用符を含む除外語を整理する                    | データ品質と React 描画の安定性が上がる                            | ↓        | 重複 key、効かない言語コード、壊れた query の端ケースが残る             |
| C-01    | P2     | `openOptionsPage` の background 中継を再検証して除去する                    | service worker とメッセージ定義を削減できる                        | ↓        | 害は小さいが、不要な実行面と説明が残る                                  |
| O-01    | P2     | リリース／ロールバック／Google DOM 破壊時の短い runbook を置く              | 将来の自分が短時間で復旧できる                                     | ↑ ごく小 | 外部 DOM 変更のたびに調査をやり直す                                     |
| S-01    | P2     | GitHub Actions を最小権限・commit SHA pin にする                            | CI supply-chain の改ざん面を狭める                                 | →        | 公開物を作る workflow が mutable tag に依存し続ける                     |
| UX-01   | P2     | ストア画像とメタデータを現機能に合わせる                                    | 初見で製品と設定画面を理解しやすくなる                             | →        | 設定画像が途中から始まり、検索語機能が一部説明から抜けたままになる      |
| PERF-01 | P3     | content script の parse / execute 時間を計測してから分割を判断する          | 根拠のない React 排除や過剰最適化を避ける                          | 判断後   | 70.7 KiB gzip のスクリプトを全 `/search` に読み込むが、実害は不明のまま |

## 1. プロダクト価値と市場

### 率直な評価

**自分で日常的に使う道具としては、公開に値する。一般向けサービスとしては、現時点で価値仮説が未検証で、差別化も想定より弱い。**

時間フィルターを検索後に何度も切り替える人にとって、Google の「ツール」を毎回開かず、結果の横からワンクリックで変えられる価値は具体的である。右カラムに常設し、URL の一部だけを書き換え、通常のリンクとして新しいタブでも開ける設計は、単なる設定画面やショートカットより作業の流れに合っている。

ただし、公開前の調査で次の現役製品が確認できた。

| 製品                                                                                                                                       | 2026-09-04 時点で確認できる内容                                                                          | Side Filters への示唆                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [Custom Search Sidebar](https://chromewebstore.google.com/detail/custom-search-sidebar/cnanceabnogiieiepiehjhpnmgpagjbm)                   | 123 users、6 ratings、2026-06-15 更新。期間・言語・verbatim・カスタム filter・表示順・サイドバー位置など | 「同じ体験の現役代替はない」は成立しない。機能数で競わない方がよい              |
| [Google Search Time Filter](https://chromewebstore.google.com/detail/google-search-time-filter/lfofefijimhdkamppkkgahclcednkhdo?hl=en)     | 64 users、2025-12-22 更新。期間・言語・折り畳み sidebar、日英、無通信を訴求                              | コア機能の直接競合。Side Filters の優位は右列への自然な統合と編集体験に置くべき |
| [Google Search by Date](https://chromewebstore.google.com/detail/google-search-by-date-%E2%80%93-d/mchncdgncchoolmnjicpddhkmgebjopg?hl=en) | 1,000 users、28 ratings、2026-07-16 更新。期間、カスタム範囲、verbatim、13 言語                          | 期間だけを求める利用者には強い既存選択肢がある                                  |
| [Google Search Custom Sidebar userscript](https://greasyfork.org/en/scripts/535629-google-search-custom-sidebar/versions)                  | 継続更新。保存 filter、除外、複数選択、狭幅 toolbar など                                                 | 高機能化の競争は終わりがなく、この製品の簡潔さを壊す                            |

`docs/DESIGN.md:12` の再調査不要という記述は削除し、調査日・検索範囲・近似競合との差を残すべきである。以前の判断が不注意だったというより、競合の存在・更新が速い領域なので、永続的な事実として固定しない方がよい。

### 推奨する立ち位置

機能数ではなく、次を約束にする。

> Google の空いている右列に、よく使う絞り込みだけを、Google に馴染む小さなカードとして置く。検索履歴を集めず、外部通信をせず、操作は普通のリンクのまま。

この立ち位置なら、現在の簡潔な UI、最小権限、オープンソース、URL ベースの動作が一つの価値になる。逆に、filetype、country、site、保存 filter、drag、自由な配色などを競合に追随して足すと、設定とテストの面積だけが増え、この製品の良さを失う。

### 機能の過不足

維持する:

- 期間、言語、完全一致、フレーズ、除外は「検索をその場で絞る」という単一目的に収まる。
- Recipe、CSV import/export、独自サーバー、アカウント、常時 analytics を持たない判断は妥当。
- 言語と検索語セクションを非表示にできるため、期間だけの小さな道具としても使える。

公開前に足すべきなのは新機能ではなく、**Google 側で既に指定されたカスタム期間を正しく表現すること**である。独自の日付 picker は利用要求が出てからでよい。もし加えるなら Google の既存 date range と競合せず、URL の `cdr/cd_min/cd_max` を同じ状態モデルで扱う。

公開後は analytics を入れずとも、Chrome Web Store の aggregate installs / ratings、GitHub Issues、作者自身の継続利用で最初の判断はできる。5〜10 人に実際の検索作業で試してもらい、「1 週間後も残して使うか」「どの filter を使ったか」を聞く方が、今の段階ではイベント計測より価値が高い。

## 2. 機能、状態、データ品質

### F-01: カスタム期間を「全期間」と表示する

`extension/lib/url.ts:51-60` の `getQdr` は、期間指定なしと `cdr:1,cd_min:...,cd_max:...` の両方を `null` にする。`extension/entrypoints/google.content/Card.tsx:242-249` は `qdr === null` なら「全期間」を選択中にする。

実 Chrome で次の URL を開くと、検索結果は 2026 年 8 月の日付に限定されたまま、カードは「全期間」を選択中と読み上げ・表示した。

```text
https://www.google.com/search?q=typescript&tbs=cdr:1,cd_min:8/1/2026,cd_max:8/31/2026
```

`extension/lib/url.test.ts:46-48` は `cdr` を `null` とする現在の実装を固定しており、UI 上の意味までテストしていない。

推奨:

- 期間状態を `none | preset(qdr) | custom(cdr...)` として表す。
- custom では「全期間」を選択中にしない。
- 狭いカードに新しい操作を増やしたくなければ、「期間指定中」という非操作ラベルだけでもよい。「全期間」は解除リンクとして残す。

### F-02: 配置は初回 mount でしか決めない

`extension/entrypoints/google.content/index.tsx:99-105` は `append` 時にだけ `settings.placement` と Google の Grid を測る。ところが次の更新は `render()` だけである。

- `wxt:locationchange`: `index.tsx:120-130`
- `storage.sync` の変更: `index.tsx:132-136`

React の内容は更新されるが、host の親、`data-slot`、wide alignment は変わらない。このため、設定画面の「開いている検索結果にもすぐ反映」は配置について事実ではない。Google が同じページ内で `#rhs` や全幅 block を遅延追加・差し替えした場合も、古い配置が残りうる。wide 判定は window resize でも再評価されない。

実 Chrome では 2560px 幅で wide host が x=1350 / w=372 に収まることと、通常の右列が w=372 であることは確認できた。これは現在の計算の正しさを支持するが、ライフサイクルの不足を解消しない。

推奨:

- 描画と配置を分けず、`ensureMountedAtCurrentSlot()` のような一つの調停関数にする。
- location change、placement change、debounced resize、対象 DOM の重要な変更で slot を再計算する。
- mode / anchor が変わるときだけ host を移動し、wide の observer を張り直す。
- `host.isConnected` も確認し、Google が host だけを除去した場合に再 mount する。
- 狭幅・100/125/200% zoom で、重なるくらいなら表示しないという既存の fail-closed 方針を守る。

### F-03 / F-04: 設定画面の保存契約が曖昧

`extension/entrypoints/options/App.tsx:55-61` は 400ms の timer 後に `void saveSettings(settings)` を呼ぶ。timer の cleanup / flush がなく、Promise rejection も処理しない。利用者が 400ms 以内にタブを閉じると最後の変更は保存されず、quota や API エラーも表示されない。それにもかかわらず `optionsLede` は「変更は自動で保存」と断定している。

Chrome の `storage.sync` は約 100KB / item 8KB で、この設定量には十分である。一方、書き込みは失敗時に Promise を reject するため、無視してよいわけではない。[Chrome storage の現行仕様](https://developer.chrome.com/docs/extensions/reference/api/storage) も rejection を明記している。

また、UI は最後の期間・言語行も削除でき、空状態を表示する。しかし `extension/lib/settings.ts:87-127` は空配列を `null` 相当にして既定値へ戻し、`saveSettings` も正規化後の既定値を保存する。空状態はその画面内だけで、再読込すると既定行が戻る。

推奨:

- 最新値を ref に保持し、timer cleanup と `pagehide` / `visibilitychange` で pending save を即時実行する。
- `saving / saved / error` を画面に出し、status は `aria-live="polite"`、error は再試行可能にする。
- 空配列を有効な利用者設定として保存し、カードには「全期間」「全言語」だけを残す。期間 preset を必須の製品契約にしたいなら、代わりに最後の削除を disabled にし、その理由を表示する。現在の中間状態は避ける。
- 編集中の不正行を storage から落とす現在の設計は合理的だが、「保存済み」とはしない。入力と error を関連付ける。

### D-01: 小さなデータ品質上の穴

- `LANG_CODE` と `LR_PATTERN` が options と settings に重複している。共通の `isValidLangCode` にする。
- 同じ `qdr` / `lr` を複数作れる。カードでは `key={item.id}` が重複し、同じ選択肢が複数同時に選択中になる。保存時に semantic value で重複を除くか、UI で明示的にエラーにする。
- 除外入力に内部の `"` があると、`normalizeWord` は壊れた引用句を作れる。例: `foo "bar"` → `-"foo "bar""`。引用符を拒否して理由を出すか、対応する parser / escaping を定義する。
- settings schema は version を持たない。ただし v0.1 の小さな additive schema では今すぐ migration framework を入れる方が過剰である。初めて非互換変更をするときに `version` と一度限りの migration を加えればよい。

## 3. アーキテクチャとコード品質

### 良い点

- TypeScript は `strict` と `noUncheckedIndexedAccess` を有効化している。
- URL、query、theme、placement、settings を純関数へ分けており、外部 DOM と Chrome API の境界が狭い。
- URL を現在状態の正本にしている。拡張内に重複状態を持たないため、本人が検索 box に入力した条件とも自然に統合できる。
- content UI を Shadow DOM に置き、Google の CSS / event handler との干渉を抑えている。
- `#rcnt / #center_col / #rhs` だけに依存し、骨格がなければ出さない。外部 DOM を相手にする拡張では安全側の判断である。
- URL 遷移を `<a href>` にしているため、通常 click だけでなく新規 tab、context menu などブラウザの標準動作を維持する。
- 設計判断だけでなく却下案と実測値まで `docs/DESIGN.md` に残している。小規模個人プロジェクトとして非常に良い。

### 維持してよい技術選択

- WXT + React を bundle size だけで捨てる必要はない。カードの responsive layout と options editor は状態を持ち、現在のコード量なら React の読みやすさが勝つ。
- options だけ Kumo、検索ごとに走る card は自前 CSS、という分離は妥当。
- `chrome.storage.sync` はこの規模の設定に適する。IndexedDB、zod、Effect、独自 backend は増やさない。
- Card.tsx や App.tsx を行数だけで細切れにしない。Term / Lang editor の多少の重複も、無理な generic form を作るより現在は読みやすい。

### C-01: background は不要になっている可能性が高い

`extension/entrypoints/background.ts` は options を開くためだけに存在し、設計文書は content script から `runtime.openOptionsPage` を呼べないとしている。しかし現行 Chrome MV3 の [`chrome.runtime.openOptionsPage()`](https://developer.chrome.com/docs/extensions/reference/api/runtime#method-openOptionsPage) には foreground-only の制約が記されておらず、Runtime API 自体も content script から利用する例を持つ。

対象が Chrome のみなら、content script から直接 `browser.runtime.openOptionsPage()` が通ることを unpacked build で一度確認し、通れば background、message 定数、sendMessage を削除する。これは根本設計変更ではなく、古くなった前提を外して構成を小さくする改善である。

## 4. UI、UX、デザイン、アクセシビリティ

### 良い点

- ライトは境界、ダークは影という Google の現在の面表現を実測し、単に色を反転していない。
- 右列 372px に対し期間 preset を 1 本の segmented control に収め、収まらなければ実寸で Grid に落とす。固定個数や文字数で推測しないのがよい。
- 見出し、余白、選択色、hover、focus-visible は一貫している。ストア画像と実 Chrome の両方で後付け感が少ない。
- 設定画面は操作画面として素直で、field set、radio、switch、reorder controls の大枠も適切である。
- 装飾的 animation、gradient、過剰なカード nesting がない。全面的なデザイン刷新は不要。

### A-01: 公開前に直すアクセシビリティ

1. **入力エラーが入力と結び付いていない**

   `App.tsx:85-91` は赤枠と text を出すだけで、input に `aria-invalid` と `aria-describedby` / `aria-errormessage` がない。個々の error に安定 ID を付けて関連付ける。保存 error と status も live region にする。

2. **除外削除の target が 16×16px しかない**

   実 Chrome と `style.css:301-310` の双方で 16×16px だった。現行 [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) の desktop 24px 目安より小さい。見た目を 16px のまま擬似要素や padding で 24px 以上へ広げる。

3. **複数の削除 link がすべて「除外から外す」**

   実 accessibility tree では `linkedin` と `facebook` の削除がどちらも同じ名前だった。`「linkedin」を除外から外す` のように対象を名前へ含める。

4. **`aria-pressed` を link に付けている**

   `Toggle` は `<a>` だが `aria-pressed` を使う。WAI-ARIA 1.2 は [`aria-pressed` を button role 用](https://www.w3.org/TR/wai-aria-1.2/#aria-pressed)としている。ここは URL へ移動する link なので link semantics を維持し、現在状態には `aria-current` または名前／説明を使う。button に変えて JavaScript navigation にするより、今の link の標準動作を守る方がよい。

5. **disabled の理由が `title` にしかない**

   1 語検索時の「フレーズ」は accessibility tree で説明なしの text だった。`title` だけに依存せず、`aria-describedby` で理由を関連付けるか、短い視覚補助を用意する。

6. **現在状態がほぼ色だけ**

   `aria-current` は支援技術にはよいが、視覚上は背景色だけである。太字、check、境界の変化など小さな非色 cue を一つ追加する。Google らしい静けさを損なわない範囲でよい。

### ストア画像

`assets/store/01-card.png` は製品の価値を一目で示せている。一方 `04-options.png` はページの途中から始まり、タイトルと期間 preset の前半が切れ、下端も途中で終わる。設定画面の全貌ではなく「切れたフォーム」に見える。タイトル、代表的な期間／言語、表示設定が一枚で理解できる状態に撮り直すか、設定画面を二枚に分ける。

狭幅と zoom はまだ評価できていない。最低でも 1280 / 1440 / 1750 / 2560px と 100 / 125 / 200% zoom を release checklist にし、結果列と重なる場合は表示を消すか結果の上へ安全に退避する。

## 5. 性能

production build の実測は次のとおり。

| 資産               |        raw |      gzip |
| ------------------ | ---------: | --------: |
| content script JS  |  223,076 B |  70,692 B |
| content script CSS |    5,313 B |   1,529 B |
| options JS         |  444,676 B | 141,505 B |
| options CSS        |  134,586 B |  21,027 B |
| background JS      |      608 B |     366 B |
| 配布 zip 全体      | 246.81 KiB |         - |

options の Kumo は大きいが、利用者が設定時だけ開く cold path なので問題視しない。content script は `https://www.google.com/search*` の全ページで読み込まれ、`isFilterablePage` が false の画像や shopping でも React を含む JS の parse / execute は発生する。

ただし 70.7 KiB gzip という数字だけで性能問題とは言えない。拡張資産は local であり、Google 自体のページコストの方が大きい可能性もある。次の順で判断する。

1. content script の startup mark と Chrome Performance trace で parse、`loadSettings`、mount、layout の時間を測る。
2. unsupported mode と通常検索を比較する。
3. 実害が見えた場合だけ、軽い entrypoint から Card / React を dynamic import する、または card のみ DOM 実装へ寄せる。

React の全面排除や Kumo の再実装は、現時点では保守性を下げるだけなので提案しない。

## 6. セキュリティとプライバシー

### 実装上の良い点

- manifest permission は `storage` のみで、content script の対象も `www.google.com/search*` だけ。
- 外部 fetch、analytics、remote code、広告、account、backend がない。
- user text は React text / URLSearchParams を通り、HTML として挿入しない。
- Shadow DOM と isolated world により Google page script との直接干渉を抑える。
- `package-lock.json` + `npm ci`、週次 Dependabot、MV3 を採用している。
- Google は 2025 年から country code domain を段階的に `google.com` へ redirect すると発表しているため、[www.google.com だけに絞る判断](https://blog.google/products-and-platforms/products/search/country-code-top-level-domains/)は、権限最小化との trade-off として現在も妥当である。

### P-01: 「保存しない」は事実と矛盾する

`docs/STORE.md:48-49` は “No data is collected, stored or sent anywhere” の直後に preset 保存のため storage を使うと書く。日本語も `:72-73` で同じ矛盾がある。`PRIVACY.md` は「開発者へ送られない」と区別しており、こちらの方が実装に近い。

Chrome Web Store は、local や Chrome Sync だけで処理する場合も data handling の開示が必要としている。[User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) と [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) に合わせ、次のように統一する。

> The developer does not collect browsing or personal data. Your filter presets and display preferences are stored through Chrome Sync and are not sent to the developer. The extension makes no network requests of its own and contains no analytics or tracking.

検索 URL は filter link を作るためページ内で読むが、拡張が保存・外部送信しないことも明記する。Dashboard の checkbox と Privacy URL と listing の文言は同じ定義で回答する。

### R-01 / S-01: release security

- `docs/STORE.md:223` は `wxt submit init` を案内するが、秘密情報入り `.env.submit` を `.gitignore` が除外していない。公開 repo なので P1 とする。
- CI は third-party Action を major tag (`@v6`, `@v3`, `@v5`) で参照している。公開 package を作る workflow は full commit SHA pin と `permissions: contents: read` を採用する。
- live advisory 取得が完了していないため、初回提出前に接続できる環境で `npm audit` と、可能なら Dependabot alerts を再確認する。

## 7. テスト、信頼性、外部 DOM 依存

### 現在の強み

- Vitest は 5 files / 101 tests が通る。
- URL の未知 parameter 維持、`tbs` の部分更新、query tokenizer、設定正規化、theme、基本配置を細かく固定している。
- Google の実ページを CI から叩かず bot 判定を避け、最小 HTML fixture と手動 smoke を分ける方針は妥当。
- `task check` が lint / format / typecheck / tests / production build を一つにしている。

### 現在の盲点

テストは pure lib に偏り、利用者が触る結合部を通していない。その結果、`getQdr(cdr) === null` という単体テストは通る一方、Card が「全期間」を選ぶ誤動作を許している。

公開前に最小限追加するテスト:

1. Card render: none / qdr / cdr / unknown qdr / lr / news の選択状態と href。
2. ExclusionField: keyboard submit、重複、remove 名、引用符を含む入力。
3. Options: debounce、unmount flush、save rejection、空配列、invalid row、status / ARIA。
4. Content lifecycle: placement change、location change、anchor replacement、host disconnect、resize。
5. Packaged manifest snapshot: permission、matches、options、background の有無。
6. axe または accessibility snapshot: Card と Options の deterministic fixture。

Google 実ページの定期自動巡回は CAPTCHA と規約・揺らぎのコストが高い。代わりに、release 前の短い manual matrix を文書化し、Google DOM 変更が疑われるときだけ実 Chrome で再計測する。

fail-closed、つまり骨格がなければ何も表示しない判断は維持する。ただし「表示されない」障害は気付きにくいので、公開後は support Issue template に Chrome version、URL の query parameter、viewport、Google theme、DOM selector の有無を含める。

## 8. デプロイ、リリース、運用

### R-01: 現在の tag release は動かない

`.github/workflows/ci.yml` は `push.branches: [main]` と `pull_request` だけで、tag push を trigger に含めない。したがって `zip` job の `if: startsWith(github.ref, 'refs/tags/v')` は tag から到達できない。`docs/STORE.md:227` と `:252` の「タグで artifact / 提出」は現状では成立しない。

`push.tags: ["v*"]` を追加し、release 用 job を dry-run から検証する。tag 名と `package.json.version` の一致も検査すると、同じ version の再 upload 失敗を早く見つけられる。

さらに、同梱 `publish-browser-extension 6.1.1` の `wxt submit --help` では API v2 に次が必須である。

- `--chrome-api-version v2`
- `--chrome-publisher-id`
- `--chrome-extension-id`
- service account client email / private key

`docs/STORE.md` の例は API version と publisher ID がなく、そのままでは validation を通らない。Chrome Web Store API v2 は service account、staged publish、deploy percentage を提供し、旧 v1.1 は 2026-10-15 で終了予定である。認証項目は[Chrome の v2 発表](https://developer.chrome.com/blog/cws-api-v2)と同梱 CLI の `--help`、初回／更新時の流れは[WXT の publishing guide](https://wxt.dev/guide/essentials/publishing.html)を確認元にする。

### 公開手順の推奨

1. P1 を修正し、`task check` と manual matrix を完了する。
2. 0.1.x の unpacked build を数日 dogfood する。
3. 初回 item 作成と listing 入力は manual で行う。WXT も初回は manual と明記している。
4. 2 回目以降だけ v2 API を dry-run → staged publish で自動化する。
5. rollback は「直前 version の source から version を上げた修正版を再提出」となるため、tag、zip artifact、store metadata の変更記録を残す。

GitHub は public、Issue 0、Release 0、tag 0、CI の既存 run は成功している。これはコード健康度の証拠にはなるが、公開運用や利用価値の証拠にはまだならない。

## 9. ドキュメント

`docs/DESIGN.md` は、この規模に対して非常に良い。採用案だけでなく却下理由、実測値、Google DOM の落とし穴まであり、今後も判断記録の中心にしてよい。別の大きな ADR 体系は不要である。

更新が必要な点:

- README の「残っているのは申請だけ」は、P1 解消後に戻す。
- `docs/DESIGN.md:12` の競合なし・再調査不要を、比較と最終確認日へ直す。
- `docs/DESIGN.md:232` は options の内容を 3 つだけとするが、現在は query 表示、placement、theme もある。
- package description と `_locales` の manifest description は期間・言語だけで、現在の検索語機能が抜けている。一方 GitHub と store short description には入っている。
- README の構成 tree で `public/icon` が `docs/STORE.md` の子に見える。
- Store、Privacy、manifest、GitHub description の product wording を一つの短い canonical 文から派生させる。

新しい重い `PRODUCT.md` は必須ではない。README または DESIGN に、次の 4 点を 10 行程度で足せば十分である。

- 主利用者: Google で技術・調査検索を繰り返す desktop user
- job: 検索後に期間・言語・query 条件を何度も素早く切り替える
- 非目標: 多目的 SERP toolbox、検索履歴管理、SEO suite
- 初期成功: 公開後も本人と少数利用者が週次で残して使い、配置破壊がない

## 10. 段階的な改善方針

### Phase 0 — ストア提出前

1. F-01: period state を三状態にする。
2. F-02: mount / placement lifecycle を一本化する。
3. F-03 / F-04: 保存 flush、状態、error、空配列の意味を直す。
4. A-01: error association、24px target、対象込み remove 名、link semantics を直す。
5. R-01 / P-01: tag trigger、CWS v2 必須値、`.env.submit`、privacy wording を直す。
6. T-01: 上の回帰テストを追加する。
7. 1280〜2560px、zoom、light/dark、通常/news/video、rhs あり/なし、custom date を manual smoke する。

### Phase 1 — 初回公開

1. 競合との差と single purpose を Store / README / DESIGN でそろえる。
2. options のストア画像を撮り直す。
3. 0.1.x を staged / limited rollout できるなら使う。
4. Issue template と短い release checklist / rollback note を置く。

### Phase 2 — 利用実態が得られた後

- custom date picker、shortcut、追加 filter は要望頻度で決める。
- content script の性能を trace し、必要なら lazy load / DOM 化を検討する。
- schema migration は非互換変更が初めて出た時点で導入する。
- 競合より多機能にするのではなく、壊れにくさ、静かさ、検索面への馴染みを優先する。

## 11. 最終 release gate

次がすべて満たされれば、初回公開へ進んでよい。

- [ ] custom period で「全期間」が選択中にならない
- [ ] 開いた SERP で placement change が即反映される
- [ ] resize / zoom / location change / DOM replacement で重なり・消失がない
- [ ] options をすぐ閉じても最後の変更が保存される
- [ ] save failure が利用者に見える
- [ ] 空 preset の挙動が UI 文言どおりである
- [ ] input error と remove controls の accessibility が直っている
- [ ] `.env.submit` が ignore され、既往 commit に secret がない
- [ ] tag push で check → zip が実際に走る
- [ ] API v2 dry-run が publisher ID を含めて通る
- [ ] Store / Privacy / Dashboard の data handling 説明が一致する
- [ ] `task check`、zip 内容確認、manual matrix が通る

この gate の後なら、コードベースを大きくせずに十分公開可能である。逆に、これらを飛ばして機能追加や UI 刷新へ進むのは、製品価値より不確実性を増やす。

## 12. 検証記録

### ローカル

- `task check`: 成功
  - lint: 成功
  - format check: 成功
  - TypeScript: 成功
  - Vitest: 5 files / 101 tests 成功
  - WXT production build: 成功
- `task zip`: 成功、zip は約 246.81 KiB
- `npm audit --offline --json`: local cache 上 0 件
- manifest: MV3、permission は `storage`、content match は `https://www.google.com/search*`

### 実 Chrome

- 通常検索: card が Google Grid の右列に表示され、期間・言語・検索語の link が動作可能な状態で見える
- custom date URL: `全期間` と `全言語` が選択中になり、period の誤表示を再現
- `q=typescript+-linkedin+-facebook`: accessibility tree で remove link が 2 つとも `除外から外す`、実寸は各 16×16px
- news: `udm=12` から `tbm=nws` へ遷移し、news 判定対象になることを確認
- knowledge panel / wide: host x=1350, w=372、通常 right column w=372 を確認

### 外部状態

- GitHub repository: public、stars 0、issues 0、release 0、tag 0
- 直近 CI run: success
- Chrome Web Store: exact name の listing は確認できず、README も公開予定

---

## 追記: 2026-09-04 の対応記録

このレビュー本文はレビュー時点の記録として残す。以下は同日に行った対応と、そこで新たに分かったこと。

### 対応状況

| ID      | 状態 | 対応の要点                                                                                                                   |
| ------- | ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| F-01    | 対応 | `lib/url.ts` に `getPeriod`（`none` / `preset` / `custom`）。custom ではどの控えも選択中にせず補足を 1 行出す                |
| F-02    | 対応 | `lib/lifecycle.ts` の `createPlacement` に一本化。location / 設定 / resize / DOM 変化 / host 除去で場所を求め直す            |
| F-03    | 対応 | `entrypoints/options/autosave.ts`。unmount・`pagehide`・タブ非表示で flush。saving / saved / error と再試行                  |
| F-04    | 対応 | 空配列を有効な設定として保存。既定へ戻すのは配列でないときだけ。カードは「全期間」「全言語」だけを残す                       |
| R-01    | 対応 | `on.push.tags: ["v*"]` を追加。tag と `package.json` の version 照合。`.env.submit` を `.gitignore`。CWS API v2 を明記       |
| P-01    | 対応 | ストア・PRIVACY・ダッシュボードの文言を 1 つの定義から派生させた（`docs/STORE.md` の「データの扱い」）                       |
| A-01    | 対応 | error の関連付け、24px の当たり判定、対象入りの削除名、`aria-pressed` の廃止、`title` 依存の解消、色以外の cue               |
| T-01    | 対応 | Card / Options / lifecycle / packaged manifest / axe の 5 種を追加（合計 178 テスト）                                        |
| V-01    | 対応 | `docs/DESIGN.md` の「再調査不要」を撤回し、確認日つきの競合表と、狙い・非目標を明記                                          |
| D-01    | 対応 | `isValidLangCode` を `lib/url.ts` へ共通化。重複プリセットは入力エラー＋保存時に 1 つだけ。除外語の引用符は拒否              |
| C-01    | 却下 | 実 Chrome で再確認したところ **content script から `openOptionsPage` は呼べない**。background は残す（下記）                 |
| O-01    | 対応 | `docs/STORE.md` に運用の節（リリース前チェック / manual matrix / tag と version / staged publish / ロールバック / 調査手順） |
| S-01    | 対応 | `permissions: contents: read`、Action を commit SHA で固定（バージョンをコメントで併記）                                     |
| UX-01   | 対応 | 説明文に検索語の操作を追加。設定画面のスクリーンショットを実画面から 2 枚に撮り直し                                          |
| PERF-01 | 計測 | 実測の結果、変更しないと判断（下記）                                                                                         |

### C-01: `openOptionsPage` は content script から呼べない（レビューの推測は誤り）

unpacked build を Chrome for Testing 151 に読み込み、content script の isolated world を CDP で直接調べた。

```
chrome.runtime のキー:
  ContextType / OnInstalledReason / OnRestartRequiredReason / PlatformArch /
  PlatformNaclArch / PlatformOs / RequestUpdateCheckStatus /
  connect / dynamicId / getManifest / getURL / getVersion / id /
  onConnect / onMessage / sendMessage
typeof chrome.runtime.openOptionsPage: "undefined"
await chrome.runtime.openOptionsPage() → TypeError: chrome.runtime.openOptionsPage is not a function
```

よって background service worker、`OPEN_OPTIONS` メッセージ、`sendMessage` はすべて維持する。
歯車から設定画面が開くことも実 Chrome で確認した（クリックでタブが 1 つ増える）。
`extension/manifest.test.ts` が `background` の存在を固定するので、うっかり消しても落ちる。

### 新たに見つかった不具合: 狭い幅と高ズームで検索結果に重なる

F-02 の検証中に、レビューが「残る」とだけ書いていた衝突を実際に再現した。
ウィンドウが狭い・ズームが高いと Google の Grid は列を減らすが、`#center_col` は 652px のままはみ出す。
その結果 `grid-column: span 7 / -2` の列が検索結果に重なる。`#rhs` は幅 0 に潰れる。

| 条件                  | `#center_col` | カードの列 | 対応前     | 対応後 |
| --------------------- | ------------- | ---------- | ---------- | ------ |
| 1440px / 100%         | x=163 w=652   | x=891      | 正常       | 正常   |
| 1440px / 125%（1152） | x=131 w=652   | x=635      | **重なる** | 隠す   |
| 1440px / 200%（720）  | x=27 w=652    | x=307      | **重なる** | 隠す   |
| 1000px / 100%         | x=55 w=652    | x=559      | **重なる** | 隠す   |
| 200% で `#rhs` あり   | x=27 w=652    | x=419 w=0  | **潰れる** | 隠す   |

置いた箱を実測し、検索結果より右・240px 以上・画面内に収まる、を満たさなければ `data-fit="collides"` で隠す。
既存の fail-closed 方針の延長で、host は残すので幅が戻れば差し直さずに出せる。

### PERF-01: 実測して「変更しない」と判断

Chrome for Testing 151 / macOS arm64 / 1440×900、unpacked build、5 回ずつの中央値。

| 区間                                      | 対象ページ | 非対象ページ（`udm=2`） |
| ----------------------------------------- | ---------: | ----------------------: |
| content script の evaluate                |     0.7 ms |                  0.7 ms |
| `loadSettings`                            |     0.3 ms |                  2.2 ms |
| `createShadowRootUi`（CSS 取得 + shadow） |     7.3 ms |                  7.6 ms |
| mount と初回描画                          |     0.9 ms |                    0 ms |
| `main()` 合計                             |     8.3 ms |                  8.0 ms |

拡張あり / なしを同条件で比較しても、`ScriptDuration` `TaskDuration` `LCP` `CLS` に有意な悪化は出ない
（差はページ内容のばらつきに埋もれる）。**50ms 以上の long task は 1 度も観測されなかった。**
非対象ページでも `main()` に約 8ms かかるが、大半は非同期の CSS 取得待ちで主スレッドを塞いでいない。

したがって React の排除、DOM 実装への移行、code splitting はいずれも行わない。
判断を変えるのは、long task・目に見える表示遅延・layout shift のいずれかを再現できたときだけ。
計測に使った一時的な instrumentation は成果物から取り除いてある。

### 検証の制約

- `--load-extension` は製品版 Google Chrome 152 では無効化されている
  （`--load-extension is not allowed in Google Chrome, ignoring.`）。
  実 Chrome の検証は同一エンジンの **Chrome for Testing 151** で行った。Chrome 152 での再確認は未実施
- タグ push は行っていないので、release job が実際に走ることは確認できていない（workflow の静的な確認まで）
- Chrome Web Store への提出も API の dry-run も行っていない（アイテム ID / publisher ID / サービスアカウントが未発行）
- GitHub Dependabot alerts は CLI の token 権限（`security_events`）が無く取得できなかった。
  `npm audit`（オンライン、registry 応答あり）は 0 件
