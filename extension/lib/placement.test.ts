// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { attachHost, canUseWideSlot, findSlot } from "./placement";

/** docs/DESIGN.md の実測構造を最小限に再現したフィクスチャ */
function serp(withRhs: boolean): Document {
  document.body.innerHTML = `
    <div id="rcnt">
      <div id="ai-overview"></div>
      <div id="center_col"><div id="rso">results</div></div>
      ${withRhs ? '<div id="rhs"><div id="kp">knowledge panel</div></div>' : ""}
    </div>`;
  return document;
}

describe("findSlot", () => {
  it("#rhs があればそこを使う", () => {
    const slot = findSlot(serp(true));
    expect(slot?.mode).toBe("rhs");
    expect(slot?.anchor.id).toBe("rhs");
  });
  it("#rhs が無ければ #center_col の後ろに Grid で足す", () => {
    const slot = findSlot(serp(false));
    expect(slot?.mode).toBe("grid");
    expect(slot?.anchor.id).toBe("center_col");
  });
  it("骨格が無ければ null", () => {
    document.body.innerHTML = "<div id='center_col'></div>";
    expect(findSlot(document)).toBeNull();
    document.body.innerHTML = "<div id='rcnt'></div>";
    expect(findSlot(document)).toBeNull();
    document.body.innerHTML = "";
    expect(findSlot(document)).toBeNull();
  });
});

describe("attachHost", () => {
  it("rhs: ナレッジパネルより前に入る", () => {
    const doc = serp(true);
    const host = doc.createElement("side-filters");
    attachHost(host, findSlot(doc)!);
    const rhs = doc.querySelector("#rhs")!;
    expect(rhs.firstElementChild).toBe(host);
    expect(host.nextElementSibling?.id).toBe("kp");
    expect(host.dataset.slot).toBe("rhs");
  });
  it("grid: #center_col の直後、#rcnt の直下に入る", () => {
    const doc = serp(false);
    const host = doc.createElement("side-filters");
    attachHost(host, findSlot(doc)!);
    expect(host.parentElement?.id).toBe("rcnt");
    expect(host.previousElementSibling?.id).toBe("center_col");
    expect(host.dataset.slot).toBe("grid");
  });
});

describe("canUseWideSlot", () => {
  it("全幅の枠があり、最後の列にカードが収まるときだけ使う", () => {
    expect(canUseWideSlot({ hasFullWidthTopBlock: true, lastColumnWidth: 1195 })).toBe(true);
    expect(canUseWideSlot({ hasFullWidthTopBlock: true, lastColumnWidth: 372 })).toBe(true);
  });
  it("全幅の枠が無ければ右上は空かない", () => {
    expect(canUseWideSlot({ hasFullWidthTopBlock: false, lastColumnWidth: 1195 })).toBe(false);
  });
  it("列が狭ければ使わない", () => {
    // ビューポート 1440px 相当（固定列 1350px を引いた残り）
    expect(canUseWideSlot({ hasFullWidthTopBlock: true, lastColumnWidth: 75 })).toBe(false);
    expect(canUseWideSlot({ hasFullWidthTopBlock: true, lastColumnWidth: 371 })).toBe(false);
  });
});

describe("findSlot（右上を使う設定のとき）", () => {
  it("wide を指定すると #rhs があっても右上に置く", () => {
    const slot = findSlot(serp(true), true);
    expect(slot?.mode).toBe("wide");
    expect(slot?.anchor.id).toBe("center_col");
  });
  it("骨格が無ければ wide でも null", () => {
    document.body.innerHTML = "";
    expect(findSlot(document, true)).toBeNull();
  });
});
