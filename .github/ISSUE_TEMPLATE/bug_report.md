---
name: 不具合の報告 / Bug report
about: カードが出ない・位置がおかしい・保存されない、など
labels: bug
---

## 何が起きたか / What happened

<!-- 例: 検索結果の上にカードが重なる / カードが出ない / 設定が保存されない -->

## 環境 / Environment

- Chrome のバージョン（`chrome://version`）:
- OS:
- ウィンドウの幅とズーム倍率:
- Google のテーマ（ライト / ダーク）:

## 開いていた検索結果 / The search page

検索語（`q`）は伏せて構いません。`tbs` / `lr` / `tbm` / `udm` はそのまま貼ってください。

- URL:

## 画面の状態 / Page state

検索結果ページの DevTools コンソールで次を実行し、結果を貼ってください。

```js
(() => {
  const host = document.querySelector("side-filters");
  return {
    host: !!host,
    slot: host?.dataset.slot ?? null,
    fit: host?.dataset.fit ?? "ok",
    theme: host?.dataset.theme ?? null,
    rcnt: !!document.querySelector("#rcnt"),
    center_col: !!document.querySelector("#center_col"),
    rhs: !!document.querySelector("#rhs"),
    width: innerWidth,
  };
})();
```

<!--
fit が "collides" のときは、検索結果に重なる／幅が足りないため意図的に隠しています。
ウィンドウを広げる、ズームを下げると出ます。
-->
