// カードの「いつ・どこに出すか」をここ 1 か所で決める。
// 描画と配置を別々に更新すると、内容だけ新しくて位置が古い、という食い違いが出る（docs/DESIGN.md）

import { canUseWideSlot, findSlot, type SlotMode } from "./placement";
import { isFilterablePage } from "./url";

/** いまカードを置いている場所。同じ場所なら差し直さないための照合に使う */
export interface Placement {
  mode: SlotMode;
  anchor: Element;
  /** wide のときだけ、高さを揃える相手の枠 */
  block: Element | null;
}

export interface PlacementDeps {
  /** いまの URL。カードを出す画面かの判定に使う */
  url: () => string;
  /** 設定で「空きがあれば右上」を選んでいるか */
  wantsWide: () => boolean;
  /** 右上の空きの実測。wantsWide が真のときだけ呼ばれる */
  measureWide: () => { block: Element | null; lastColumnWidth: number };
  /** host を差し込んで中身を作る */
  mount: (placement: Placement) => void;
  /** host を外して中身を片付ける */
  remove: () => void;
  /** 差し込み済みの host。まだ差し込んでいなければ null */
  host: () => HTMLElement | null;
  /**
   * 実際に置いてみて、検索結果と重ならず読める幅で収まっているかを実測し、
   * 収まらなければ隠す。狭い幅とズームでは Google の Grid が列を減らし、
   * #center_col が自分の領域からはみ出すので、置き場所の計算だけでは判定できない
   */
  checkFit: () => boolean;
}

export interface PlacementController {
  /** 置き場所を求め直し、変わっていれば差し直す。何度呼んでも同じ状態に収束する */
  update: () => void;
  /** いま置いている場所。出していなければ null */
  current: () => Placement | null;
  /** 置いた場所に収まっているか。収まらないときは隠している */
  fitted: () => boolean;
  /** 監視・タイマーをすべて止める */
  dispose: () => void;
}

/** resize と zoom はまとめて 1 回だけ評価する */
const RESIZE_DELAY = 150;

function same(a: Placement, b: Placement): boolean {
  return a.mode === b.mode && a.anchor === b.anchor && a.block === b.block;
}

export function createPlacement(
  doc: Document,
  win: Pick<
    Window,
    "addEventListener" | "removeEventListener" | "requestAnimationFrame" | "cancelAnimationFrame"
  >,
  deps: PlacementDeps,
): PlacementController {
  let placed: Placement | null = null;
  let fits = false;
  let frame = 0;
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  /** wide を使える条件が揃っていれば、高さを揃える相手の枠。使えなければ null */
  function wideBlock(): Element | null {
    if (!deps.wantsWide()) return null;
    const { block, lastColumnWidth } = deps.measureWide();
    return canUseWideSlot({ hasFullWidthTopBlock: block !== null, lastColumnWidth }) ? block : null;
  }

  function desired(): Placement | null {
    if (!isFilterablePage(deps.url())) return null;
    const block = wideBlock();
    const slot = findSlot(doc, block !== null);
    return slot ? { mode: slot.mode, anchor: slot.anchor, block } : null;
  }

  /** host がまだ狙った場所に付いているか。Google が差し替えた・外した場合はここで落ちる */
  function stillAttached(want: Placement): boolean {
    const host = deps.host();
    if (host === null || !host.isConnected || !want.anchor.isConnected) return false;
    return want.mode === "rhs"
      ? host.parentElement === want.anchor
      : host.previousElementSibling === want.anchor;
  }

  function reconcile() {
    const want = desired();
    if (!want) {
      if (deps.host() !== null) deps.remove();
      placed = null;
      fits = false;
      return;
    }
    if (!(placed && same(placed, want) && stillAttached(want))) {
      deps.remove();
      placed = want;
      deps.mount(want);
    }
    // 幅・ズーム・列数は置き場所が同じままでも変わる。収まるかは毎回見直す
    fits = deps.checkFit();
  }

  /*
   * 監視は必要な範囲だけに絞る。
   * #rcnt の子（#center_col / #rhs / 全幅の枠 / 自分の host）と、#rhs があればその子だけを見る。
   * 骨格がまだ無い間に限り、現れるまで document を広く見る。対象外の画面では何も見ない。
   * 自分の差し込みでも発火するが、reconcile は「同じ場所なら何もしない」ので往復しない
   */
  const observer = new MutationObserver(() => schedule());

  function watch() {
    observer.disconnect();
    if (!isFilterablePage(deps.url())) return;
    const rcnt = doc.querySelector("#rcnt");
    if (!rcnt) {
      if (doc.documentElement)
        observer.observe(doc.documentElement, { childList: true, subtree: true });
      return;
    }
    observer.observe(rcnt, { childList: true });
    const rhs = doc.querySelector("#rhs");
    if (rhs) observer.observe(rhs, { childList: true });
  }

  function update() {
    if (disposed) return;
    watch();
    reconcile();
  }

  function schedule() {
    if (disposed || frame !== 0) return;
    // 実測が要るので、レイアウトが落ち着くフレームの頭でまとめて評価する
    frame = win.requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  }

  const onResize = () => {
    // 幅とズームで wide の可否が変わる。連続する resize はまとめる
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(schedule, RESIZE_DELAY);
  };
  win.addEventListener("resize", onResize);

  return {
    update,
    current: () => placed,
    fitted: () => fits,
    dispose() {
      disposed = true;
      observer.disconnect();
      win.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      if (frame !== 0) win.cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}
