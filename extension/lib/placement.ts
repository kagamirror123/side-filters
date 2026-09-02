// カードをどこに挿すかを決める。依存する id は #rcnt / #center_col / #rhs の 3 つだけ（docs/DESIGN.md）

export type SlotMode = "rhs" | "grid" | "wide";

export interface Slot {
  mode: SlotMode;
  /** rhs: この要素の先頭に入れる。grid / wide: この要素（#center_col）の直後に入れる */
  anchor: Element;
}

/** カードの幅。#rhs の実測値（docs/DESIGN.md） */
export const CARD_WIDTH = 372;

export interface WideSlotMetrics {
  /**
   * 1 行目を全幅で占める枠（AI による概要など）があるか。
   * これがあるとカードは 2 行目に落ちるので、右上が空く
   */
  hasFullWidthTopBlock: boolean;
  /** Grid のいちばん右の列の幅。ウィンドウ幅から固定列と gap を引いた残り */
  lastColumnWidth: number;
}

/**
 * 右上の空きにカードを出せるか。
 * 全幅の枠がある場合にだけ空きが生まれ、かつその列にカードが収まる必要がある。
 * ウィンドウが狭いと最後の列は数十 px しかないので、そのときは通常の位置に戻す。
 */
export function canUseWideSlot({
  hasFullWidthTopBlock,
  lastColumnWidth,
}: WideSlotMetrics): boolean {
  return hasFullWidthTopBlock && lastColumnWidth >= CARD_WIDTH;
}

/**
 * カードの置き場所。SERP の骨格が見つからなければ null（壊れた表示を出すより出さない）。
 * wide が真なら、条件が揃っているときだけ右上の空きを使う
 */
export function findSlot(doc: Document, wide = false): Slot | null {
  const rcnt = doc.querySelector("#rcnt");
  const centerCol = doc.querySelector("#center_col");
  if (!rcnt || !centerCol || !rcnt.contains(centerCol)) return null;
  if (wide) return { mode: "wide", anchor: centerCol };
  const rhs = doc.querySelector("#rhs");
  if (rhs && rcnt.contains(rhs)) return { mode: "rhs", anchor: rhs };
  return { mode: "grid", anchor: centerCol };
}

/** host を slot に差し込み、CSS が拾えるように data-slot を付ける（grid のとき grid-column を当てる） */
export function attachHost(host: HTMLElement, slot: Slot): void {
  host.dataset.slot = slot.mode;
  if (slot.mode === "rhs") slot.anchor.prepend(host);
  else slot.anchor.after(host);
}
