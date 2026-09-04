// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { createPlacement, type Placement, type PlacementController } from "./lifecycle";
import { attachHost } from "./placement";

const SEARCH = "https://www.google.com/search?q=typescript";
const IMAGES = "https://www.google.com/search?q=typescript&udm=2";

/** docs/DESIGN.md の実測構造を最小限に再現したフィクスチャ */
function serp(withRhs: boolean) {
  document.body.innerHTML = `
    <div id="rcnt">
      <div id="top"></div>
      <div id="center_col"><div id="rso">results</div></div>
      ${withRhs ? '<div id="rhs"><div id="kp">knowledge panel</div></div>' : ""}
    </div>`;
}

/** MutationObserver（microtask）→ schedule の rAF、の順で落ち着くまで待つ */
function settle(): Promise<void> {
  return new Promise((resolve) => {
    queueMicrotask(() => requestAnimationFrame(() => queueMicrotask(() => resolve())));
  });
}

interface Options {
  url?: string;
  wide?: boolean;
  lastColumnWidth?: number;
  /** 実測は happy-dom では意味を持たないので、収まるかどうかは差し替える */
  fits?: boolean;
}

interface Harness {
  controller: PlacementController;
  host: HTMLElement;
  /** mount / remove / checkFit が呼ばれた回数 */
  counts: { mount: number; remove: number; checkFit: number };
  set: (patch: Options) => void;
}

function start(options: Options = {}): Harness {
  const state = {
    url: options.url ?? SEARCH,
    wide: options.wide ?? false,
    lastColumnWidth: options.lastColumnWidth ?? 1195,
    fits: options.fits ?? true,
  };
  const host = document.createElement("side-filters");
  const counts = { mount: 0, remove: 0, checkFit: 0 };
  let placed = false;

  const controller = createPlacement(document, window, {
    url: () => state.url,
    wantsWide: () => state.wide,
    measureWide: () => ({
      block: document.querySelector("#top"),
      lastColumnWidth: state.lastColumnWidth,
    }),
    mount: (placement: Placement) => {
      counts.mount += 1;
      placed = true;
      attachHost(host, { mode: placement.mode, anchor: placement.anchor });
    },
    remove: () => {
      counts.remove += 1;
      placed = false;
      host.remove();
    },
    host: () => (placed ? host : null),
    checkFit: () => {
      counts.checkFit += 1;
      if (!placed) return false;
      if (state.fits) delete host.dataset.fit;
      else host.dataset.fit = "collides";
      return state.fits;
    },
  });

  return {
    controller,
    host,
    counts,
    set: (patch) => Object.assign(state, patch),
  };
}

let running: PlacementController | null = null;

afterEach(() => {
  running?.dispose();
  running = null;
  document.body.innerHTML = "";
});

function begin(options?: Parameters<typeof start>[0]): Harness {
  const harness = start(options);
  running = harness.controller;
  harness.controller.update();
  return harness;
}

describe("初回の配置", () => {
  it("#rhs があればその先頭に入る", () => {
    serp(true);
    const { host, controller } = begin();
    expect(controller.current()?.mode).toBe("rhs");
    expect(document.querySelector("#rhs")!.firstElementChild).toBe(host);
  });

  it("#rhs が無ければ #center_col の直後に入る", () => {
    serp(false);
    const { host, controller } = begin();
    expect(controller.current()?.mode).toBe("grid");
    expect(host.previousElementSibling?.id).toBe("center_col");
  });

  it("骨格が無ければ何も出さない", () => {
    document.body.innerHTML = "<div id='center_col'></div>";
    const { host, controller } = begin();
    expect(controller.current()).toBeNull();
    expect(host.isConnected).toBe(false);
  });

  it("カードを出さない画面では何も出さず、監視もしない", () => {
    serp(true);
    const { host, controller, counts } = begin({ url: IMAGES });
    expect(controller.current()).toBeNull();
    expect(host.isConnected).toBe(false);
    expect(counts.mount).toBe(0);
  });
});

describe("同じ状態なら差し直さない", () => {
  it("update を繰り返しても mount は 1 回", () => {
    serp(true);
    const { controller, counts } = begin();
    controller.update();
    controller.update();
    expect(counts.mount).toBe(1);
    expect(counts.remove).toBe(1); // 初回 mount 前の掃除 1 回だけ
  });

  it("自分の差し込みで監視が発火しても往復しない", async () => {
    serp(true);
    const { counts } = begin();
    await settle();
    await settle();
    expect(counts.mount).toBe(1);
  });
});

describe("配置の変わり目", () => {
  it("設定を wide に変えると右上へ差し直す", () => {
    serp(true);
    const harness = begin();
    expect(harness.controller.current()?.mode).toBe("rhs");

    harness.set({ wide: true });
    harness.controller.update();
    expect(harness.controller.current()?.mode).toBe("wide");
    expect(harness.host.previousElementSibling?.id).toBe("center_col");
    expect(harness.counts.mount).toBe(2);
  });

  it("画面が狭くて右上に収まらないなら通常の位置に戻す", () => {
    serp(true);
    const harness = begin({ wide: true, lastColumnWidth: 1195 });
    expect(harness.controller.current()?.mode).toBe("wide");

    // ビューポート 1440px 相当
    harness.set({ lastColumnWidth: 75 });
    harness.controller.update();
    expect(harness.controller.current()?.mode).toBe("rhs");
  });

  it("全幅の枠が消えたら右上は使わない", () => {
    serp(false);
    const harness = begin({ wide: true });
    expect(harness.controller.current()?.mode).toBe("wide");

    document.querySelector("#top")!.remove();
    harness.controller.update();
    expect(harness.controller.current()?.mode).toBe("grid");
  });

  it("対象外の画面へ移ったら消す", () => {
    serp(true);
    const harness = begin();
    harness.set({ url: IMAGES });
    harness.controller.update();
    expect(harness.controller.current()).toBeNull();
    expect(harness.host.isConnected).toBe(false);
  });
});

describe("Google 側の DOM が動いたとき", () => {
  it("#rhs が後から現れたら、そちらへ移る", async () => {
    serp(false);
    const harness = begin();
    expect(harness.controller.current()?.mode).toBe("grid");

    const rhs = document.createElement("div");
    rhs.id = "rhs";
    document.querySelector("#rcnt")!.append(rhs);
    await settle();

    expect(harness.controller.current()?.mode).toBe("rhs");
    expect(rhs.firstElementChild).toBe(harness.host);
  });

  it("#rhs が差し替わったら差し直す", async () => {
    serp(true);
    const harness = begin();
    const rcnt = document.querySelector("#rcnt")!;
    document.querySelector("#rhs")!.remove();
    const fresh = document.createElement("div");
    fresh.id = "rhs";
    rcnt.append(fresh);
    await settle();

    expect(harness.host.parentElement).toBe(fresh);
    expect(harness.counts.mount).toBe(2);
  });

  it("host だけ外されたら差し直す", async () => {
    serp(true);
    const harness = begin();
    harness.host.remove();
    await settle();

    expect(harness.host.isConnected).toBe(true);
    expect(harness.counts.mount).toBe(2);
  });

  it("骨格ごと消えたら何も出さない", async () => {
    serp(true);
    const harness = begin();
    document.body.innerHTML = "";
    await settle();

    expect(harness.controller.current()).toBeNull();
    expect(harness.host.isConnected).toBe(false);
  });

  it("骨格が後から現れたら出す", async () => {
    document.body.innerHTML = "";
    const harness = begin();
    expect(harness.controller.current()).toBeNull();

    serp(true);
    await settle();
    expect(harness.controller.current()?.mode).toBe("rhs");
  });
});

describe("収まらないときは隠す", () => {
  it("重なるくらいなら出さない（host は残すが隠す）", () => {
    serp(false);
    const harness = begin({ fits: false });
    expect(harness.controller.fitted()).toBe(false);
    expect(harness.host.dataset.fit).toBe("collides");
  });

  it("幅が戻れば出し直す。差し直しはしない", () => {
    serp(false);
    const harness = begin({ fits: false });
    harness.set({ fits: true });
    harness.controller.update();
    expect(harness.controller.fitted()).toBe(true);
    expect(harness.host.dataset.fit).toBeUndefined();
    expect(harness.counts.mount).toBe(1);
  });

  it("置き場所が同じでも、update のたびに収まるかを見直す", () => {
    serp(true);
    const harness = begin();
    harness.controller.update();
    harness.controller.update();
    expect(harness.counts.checkFit).toBe(3);
    expect(harness.counts.mount).toBe(1);
  });
});

describe("resize", () => {
  it("幅が変わったら右上を使えるか評価し直す", async () => {
    serp(false);
    const harness = begin({ wide: true, lastColumnWidth: 75 });
    expect(harness.controller.current()?.mode).toBe("grid");

    harness.set({ lastColumnWidth: 1195 });
    window.dispatchEvent(new Event("resize"));
    await new Promise((resolve) => setTimeout(resolve, 200));
    await settle();

    expect(harness.controller.current()?.mode).toBe("wide");
  });
});

describe("後片付け", () => {
  it("dispose の後は DOM が動いても何もしない", async () => {
    serp(true);
    const harness = begin();
    harness.controller.dispose();
    running = null;

    harness.host.remove();
    document.querySelector("#rhs")!.remove();
    await settle();

    expect(harness.counts.mount).toBe(1);
    expect(harness.host.isConnected).toBe(false);
  });

  it("dispose の後は resize にも反応しない", async () => {
    serp(false);
    const harness = begin({ wide: true, lastColumnWidth: 75 });
    harness.controller.dispose();
    running = null;

    harness.set({ lastColumnWidth: 1195 });
    window.dispatchEvent(new Event("resize"));
    await new Promise((resolve) => setTimeout(resolve, 200));
    await settle();

    expect(harness.controller.current()?.mode).toBe("grid");
  });
});
