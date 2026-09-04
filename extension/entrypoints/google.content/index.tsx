import "./style.css";
import { createRoot, type Root } from "react-dom/client";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import { defineContentScript } from "wxt/utils/define-content-script";
import { createPlacement, type Placement } from "@/lib/lifecycle";
import { attachHost, type Slot } from "@/lib/placement";
import { loadSettings, watchSettings, type Settings } from "@/lib/settings";
import { detectTheme, isTransparent } from "@/lib/theme";
import { Card } from "./Card";

/** 1 行目を全幅で占める枠（AI による概要など）。無ければ null */
function findFullWidthTopBlock(): Element | null {
  const rcnt = document.querySelector("#rcnt");
  const centerCol = document.querySelector("#center_col");
  if (!rcnt || !centerCol) return null;

  const centerTop = centerCol.getBoundingClientRect().top;
  return (
    [...rcnt.children].find((child) => {
      if (child === centerCol) return false;
      const box = child.getBoundingClientRect();
      // #center_col より上にあり、Grid の全列にまたがる要素
      return (
        box.height > 0 && box.top < centerTop && getComputedStyle(child).gridColumn === "1 / -1"
      );
    }) ?? null
  );
}

/**
 * 右上の空きを実測する。
 * 全幅の枠があると #center_col は 2 行目に落ち、その枠の右側が空く。
 * 空き幅は Grid のいちばん右の列の幅にあたる
 */
function measureWide() {
  const rcnt = document.querySelector("#rcnt");
  const columns = rcnt ? getComputedStyle(rcnt).gridTemplateColumns.split(" ") : [];
  return {
    block: findFullWidthTopBlock(),
    lastColumnWidth: Number.parseFloat(columns.at(-1) ?? "0") || 0,
  };
}

/**
 * 全幅の枠の上端にカードを揃える。
 * 枠の高さは「もっと見る」で変わるので、変わったら測り直す。戻り値で監視を解除する
 */
function alignToTopBlock(host: HTMLElement, block: Element): () => void {
  const align = () => {
    host.style.setProperty("--wide-offset", "0px");
    const shift = block.getBoundingClientRect().top - host.getBoundingClientRect().top;
    host.style.setProperty("--wide-offset", `${Math.round(shift)}px`);
  };

  align();
  const observer = new ResizeObserver(align);
  observer.observe(block);
  return () => observer.disconnect();
}

/**
 * 置いた場所にカードが収まっているかを実測し、収まらなければ隠す。
 *
 * 幅が狭いときとズームを上げたとき、Google の Grid は列を減らす一方で #center_col は
 * 652px のまま自分の領域からはみ出す。すると span 7 / -2 の列は検索結果の上に重なる
 * （2026-09-04 に 1440px/125%・200% と 1000〜1100px で実測）。
 * #rhs も狭いと幅 0 に潰れる。どちらも「重ねるくらいなら出さない」で扱う
 */
const MIN_CARD_WIDTH = 240;

function checkFit(host: HTMLElement): boolean {
  const centerCol = document.querySelector("#center_col");
  if (!centerCol) return false;

  // 隠している間は箱を持たないので、測る間だけ必ず出す（カード内の実寸判定と同じやり方）
  const hidden = host.dataset.fit;
  delete host.dataset.fit;
  const box = host.getBoundingClientRect();
  const center = centerCol.getBoundingClientRect();
  if (hidden !== undefined) host.dataset.fit = hidden;

  // 検索結果より右にあり、読める幅があり、画面からはみ出さないこと。1px は端数の許容
  const fits =
    box.width >= MIN_CARD_WIDTH &&
    box.left >= center.right - 1 &&
    box.right <= document.documentElement.clientWidth + 1;
  if (fits) delete host.dataset.fit;
  else host.dataset.fit = "collides";
  return fits;
}

/** Google のテーマ設定は OS と独立なので、実際に塗られている背景色から判定する */
function currentTheme(): "light" | "dark" {
  // body が透明なら html の背景で決める
  for (const el of [document.body, document.documentElement]) {
    const bg = getComputedStyle(el).backgroundColor;
    if (!isTransparent(bg)) return detectTheme(bg);
  }
  return "light";
}

export default defineContentScript({
  matches: ["https://www.google.com/search*"],
  runAt: "document_idle",
  cssInjectionMode: "ui",
  async main(ctx) {
    let settings: Settings = await loadSettings();
    let root: Root | null = null;
    let unalign: (() => void) | null = null;
    /** mount 直前に決める差し込み先。WXT の anchor / append の両方から読む */
    let target: Slot | null = null;
    let block: Element | null = null;
    /** 最後に描いた内容。Google の DOM が動くたびに React を回さないための照合 */
    let drawn: { url: string; settings: Settings } | null = null;

    const render = () => {
      if (!root) return;
      const url = location.href;
      if (drawn && drawn.url === url && drawn.settings === settings) return;
      drawn = { url, settings };
      ui.shadowHost.dataset.theme = currentTheme();
      root.render(<Card url={url} settings={settings} />);
    };

    const ui = await createShadowRootUi(ctx, {
      name: "side-filters",
      position: "inline",
      // 除外欄のキー入力を Google 側へ漏らさない（Google は素の / などを拾う）
      isolateEvents: true,
      // 差し込み先は placement が決める。ここはその結果を渡すだけ
      anchor: () => target?.anchor,
      append: (_anchor, host) => {
        if (target) attachHost(host as HTMLElement, target);
      },
      onMount(container, _shadow, host) {
        if (block) unalign = alignToTopBlock(host, block);
        root = createRoot(container);
        render();
      },
      onRemove() {
        unalign?.();
        unalign = null;
        drawn = null;
        root?.unmount();
        root = null;
      },
    });

    const placement = createPlacement(document, window, {
      url: () => location.href,
      wantsWide: () => settings.placement === "wide",
      measureWide,
      mount: (next: Placement) => {
        target = { mode: next.mode, anchor: next.anchor };
        block = next.block;
        ui.mount();
      },
      remove: () => {
        if (root) ui.remove();
      },
      host: () => (root ? ui.shadowHost : null),
      checkFit: () => (root ? checkFit(ui.shadowHost) : false),
    });

    /** 位置と内容をまとめて合わせ直す。片方だけ古い状態を作らない */
    const update = () => {
      placement.update();
      render();
    };

    // Google はタブ切替を pushState で行うことがある
    ctx.addEventListener(window, "wxt:locationchange", update);
    // 設定画面での変更は開いている SERP にも即反映する（配置の変更も含む）
    ctx.onInvalidated(
      watchSettings((next) => {
        settings = next;
        update();
      }),
    );
    ctx.onInvalidated(placement.dispose);

    update();
  },
});
