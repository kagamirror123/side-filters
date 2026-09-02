import "./style.css";
import { createRoot, type Root } from "react-dom/client";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import { defineContentScript } from "wxt/utils/define-content-script";
import { attachHost, canUseWideSlot, findSlot } from "@/lib/placement";
import { loadSettings, watchSettings, type Settings } from "@/lib/settings";
import { detectTheme, isTransparent } from "@/lib/theme";
import { isFilterablePage } from "@/lib/url";
import { Card } from "./Card";

/**
 * 右上の空きが使えるかを実測する。
 * 1 行目を全幅で占める枠（AI による概要など）があると #center_col は 2 行目に落ち、
 * その枠の右側が空く。空き幅は Grid のいちばん右の列の幅にあたる
 */
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
 * 右上の空きが使えるかを実測する。
 * 全幅の枠があると #center_col は 2 行目に落ち、その枠の右側が空く。
 * 空き幅は Grid のいちばん右の列の幅にあたる
 */
function measureWideSlot() {
  const rcnt = document.querySelector("#rcnt");
  const columns = rcnt ? getComputedStyle(rcnt).gridTemplateColumns.split(" ") : [];
  return {
    hasFullWidthTopBlock: findFullWidthTopBlock() !== null,
    lastColumnWidth: Number.parseFloat(columns.at(-1) ?? "0") || 0,
  };
}

/**
 * 全幅の枠の上端にカードを揃える。
 * 枠の高さは「もっと見る」で変わるので、変わったら測り直す。戻り値で監視を解除する
 */
function alignToTopBlock(host: HTMLElement): () => void {
  const block = findFullWidthTopBlock();
  if (!block) return () => {};

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

    const render = () => {
      root?.render(<Card url={location.href} settings={settings} />);
    };

    const ui = await createShadowRootUi(ctx, {
      name: "side-filters",
      position: "inline",
      // 除外欄のキー入力を Google 側へ漏らさない（Google は素の / などを拾う）
      isolateEvents: true,
      // autoMount はセレクタ文字列を要求する。実際の差し込み先は append で決める
      anchor: "#center_col",
      append: (_anchor, host) => {
        const wide = settings.placement === "wide" && canUseWideSlot(measureWideSlot());
        const slot = findSlot(document, wide);
        if (!slot) return;
        attachHost(host as HTMLElement, slot);
        if (slot.mode === "wide") unalign = alignToTopBlock(host as HTMLElement);
      },
      onMount(container, _shadow, host) {
        if (!host.isConnected) return;
        host.dataset.theme = currentTheme();
        root = createRoot(container);
        render();
      },
      onRemove() {
        unalign?.();
        unalign = null;
        root?.unmount();
        root = null;
      },
    });

    const sync = () => {
      if (!isFilterablePage(location.href)) {
        ui.remove();
        return;
      }
      if (root) render();
      else ui.autoMount();
    };
    sync();
    // Google はタブ切替を pushState で行うことがある
    ctx.addEventListener(window, "wxt:locationchange", sync);
    // 設定画面での変更は開いている SERP にも即反映する
    ctx.onInvalidated(
      watchSettings((next) => {
        settings = next;
        render();
      }),
    );
  },
});
