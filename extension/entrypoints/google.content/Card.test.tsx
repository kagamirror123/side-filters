// @vitest-environment happy-dom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { defaultSettings, type Settings } from "@/lib/settings";
import { Card } from "./Card";

afterEach(cleanup);

const BASE = "https://www.google.com/search?q=typescript&hl=ja";

function show(url: string, patch: Partial<Settings> = {}) {
  return render(<Card url={url} settings={{ ...defaultSettings(), ...patch }} />);
}

function option(name: string): HTMLAnchorElement {
  return screen.getByRole("link", { name }) as HTMLAnchorElement;
}

/** 見出しで区切られたセクション */
function section(title: string): HTMLElement {
  return screen.getByRole("heading", { name: title }).closest(".section") as HTMLElement;
}

/** そのセクションで aria-current が付いている選択肢のラベル */
function selected(title = "Time"): string[] {
  return within(section(title))
    .getAllByRole("link")
    .filter((link) => link.getAttribute("aria-current") === "true")
    .map((link) => link.textContent ?? "");
}

/** location への代入を横取りする。控えを押すとページが読み込み直されるため */
function captureNavigation() {
  const original = Object.getOwnPropertyDescriptor(window, "location");
  const stub = { href: "" };
  Object.defineProperty(window, "location", { configurable: true, value: stub });
  return {
    get href() {
      return stub.href;
    },
    restore() {
      if (original) Object.defineProperty(window, "location", original);
    },
  };
}

describe("Card 期間の選択状態", () => {
  it("期間指定なしなら「全期間」だけが選択中", () => {
    show(BASE);
    expect(option("Any time").getAttribute("aria-current")).toBe("true");
    expect(option("Week").getAttribute("aria-current")).toBeNull();
  });

  it("プリセットの qdr はその控えが選択中", () => {
    show(`${BASE}&tbs=qdr:w`);
    expect(selected()).toEqual(["Week"]);
  });

  it("倍数付きの qdr も一致する", () => {
    show(`${BASE}&tbs=qdr:m6`);
    expect(selected()).toEqual(["6 months"]);
  });

  it("カスタム期間では「全期間」を選択中にせず、指定中だと示す", () => {
    show(`${BASE}&tbs=cdr:1,cd_min:8/1/2026,cd_max:8/31/2026`);
    expect(selected()).toEqual([]);
    expect(screen.getByText("Custom range set in Google: 8/1/2026 – 8/31/2026")).toBeTruthy();
  });

  it("未知の qdr ではどの控えも選択中にしない", () => {
    show(`${BASE}&tbs=qdr:zz9`);
    expect(selected()).toEqual([]);
    expect(screen.queryByText(/Custom range/)).toBeNull();
  });

  it("プリセットが空でも「全期間」だけは出る", () => {
    show(BASE, { terms: [], langs: [] });
    expect(option("Any time")).toBeTruthy();
    expect(option("Any language")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Week" })).toBeNull();
  });
});

describe("Card 言語の選択状態", () => {
  it("lr が一致する控えが選択中", () => {
    show(`${BASE}&lr=lang_ja`);
    expect(selected("Language")).toEqual(["Japanese"]);
    expect(selected("Time")).toEqual(["Any time"]);
  });

  it("言語セクションは設定で消せる", () => {
    show(BASE, { showLangs: false });
    expect(screen.queryByRole("link", { name: "Any language" })).toBeNull();
  });
});

describe("Card のリンク先", () => {
  it("期間だけ差し替え、他のパラメータは残す", () => {
    show(`${BASE}&tbs=qdr:d,sbd:1&start=20`);
    const url = new URL(option("Week").href);
    expect(url.searchParams.get("tbs")).toBe("qdr:w,sbd:1");
    expect(url.searchParams.get("q")).toBe("typescript");
    expect(url.searchParams.get("hl")).toBe("ja");
    // 絞り込みを変えたらページ番号は落とす
    expect(url.searchParams.get("start")).toBeNull();
  });

  it("「全期間」はカスタム期間も解除する", () => {
    show(`${BASE}&tbs=cdr:1,cd_min:8/1/2026,cd_max:8/31/2026`);
    expect(new URL(option("Any time").href).searchParams.get("tbs")).toBeNull();
  });

  it("言語のリンクは lr だけ差し替える", () => {
    show(`${BASE}&lr=lang_en`);
    expect(new URL(option("Japanese").href).searchParams.get("lr")).toBe("lang_ja");
    expect(new URL(option("Any language").href).searchParams.get("lr")).toBeNull();
  });
});

describe("Card の控え", () => {
  it("日付順はニュースのときだけ出す", () => {
    show(`${BASE}&tbm=nws`);
    expect(option("By date")).toBeTruthy();
    cleanup();
    show(BASE);
    expect(screen.queryByRole("link", { name: "By date" })).toBeNull();
  });

  it("ニュースで日付順が効いていれば aria-current で示す（aria-pressed は使わない）", () => {
    show(`${BASE}&tbm=nws&tbs=sbd:1`);
    const toggle = option("By date");
    expect(toggle.getAttribute("aria-current")).toBe("true");
    expect(toggle.getAttribute("aria-pressed")).toBeNull();
  });

  it("フレーズが使えないときは理由を title だけでなく説明として結び付ける", () => {
    show(BASE); // 1 語だけの検索語
    const phrase = screen.getByText("Phrase");
    expect(phrase.getAttribute("aria-disabled")).toBe("true");
    const describedBy = phrase.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toContain("quoting one word");
  });
});

describe("除外欄", () => {
  it("キーボードで送信すると、その語を足した URL へ移動する", async () => {
    const nav = captureNavigation();
    try {
      show(BASE);
      await userEvent.type(screen.getByRole("textbox"), "linkedin{Enter}");
      expect(new URL(nav.href).searchParams.get("q")).toBe("typescript -linkedin");
    } finally {
      nav.restore();
    }
  });

  it("空白を含む語は引用符で囲む", async () => {
    const nav = captureNavigation();
    try {
      show(BASE);
      await userEvent.type(screen.getByRole("textbox"), "machine learning{Enter}");
      expect(new URL(nav.href).searchParams.get("q")).toBe('typescript -"machine learning"');
    } finally {
      nav.restore();
    }
  });

  it("引用符を含む入力は理由を出して受け付けない", async () => {
    const nav = captureNavigation();
    try {
      show(BASE);
      const input = screen.getByRole("textbox");
      await userEvent.type(input, 'foo "bar"{Enter}');
      expect(nav.href).toBe("");
      const error = screen.getByRole("alert");
      expect(error.textContent).toContain("Quotation marks");
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(input.getAttribute("aria-describedby")).toContain(error.id);
    } finally {
      nav.restore();
    }
  });

  it("すでに除外している語は理由を出して受け付けない", async () => {
    const nav = captureNavigation();
    try {
      show(`${BASE.replace("q=typescript", "q=typescript+-linkedin")}`);
      await userEvent.type(screen.getByRole("textbox"), "linkedin{Enter}");
      expect(nav.href).toBe("");
      expect(screen.getByRole("alert").textContent).toContain("already excluded");
    } finally {
      nav.restore();
    }
  });

  it("削除の読み上げ名に対象の語が入る", () => {
    show(BASE.replace("q=typescript", "q=typescript+-linkedin+-facebook"));
    const linkedin = option("Remove “linkedin” from the exclusions");
    const facebook = option("Remove “facebook” from the exclusions");
    expect(new URL(linkedin.href).searchParams.get("q")).toBe("typescript -facebook");
    expect(new URL(facebook.href).searchParams.get("q")).toBe("typescript -linkedin");
  });

  it("検索語セクションは設定で消せる", () => {
    show(BASE, { showQuery: false });
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
