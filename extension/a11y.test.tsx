// @vitest-environment happy-dom
// カードと設定画面に axe をかける。決まった入力に対する回帰検査で、
// 実際の配色コントラストと focus の見え方は実 Chrome で確認する（docs/DESIGN.md）
import { cleanup, render } from "@testing-library/react";
import axe, { type Result } from "axe-core";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@/entrypoints/options/App";
import { Card } from "@/entrypoints/google.content/Card";
import { defaultSettings } from "@/lib/settings";

afterEach(cleanup);

beforeEach(() => {
  fakeBrowser.reset();
});

/** CSS を読み込まない環境では判定できない規則。実 Chrome の手動確認に回す */
const SKIPPED = new Set(["color-contrast"]);

async function violations(container: HTMLElement): Promise<Result[]> {
  const result = await axe.run(container, {
    resultTypes: ["violations"],
    rules: { "color-contrast": { enabled: false } },
  });
  return result.violations.filter((violation) => !SKIPPED.has(violation.id));
}

function describeViolations(found: Result[]): string {
  return found.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(" / ")}`).join("\n");
}

describe("カードのアクセシビリティ", () => {
  const cases: [string, string][] = [
    ["期間指定なし", "https://www.google.com/search?q=typescript"],
    ["プリセット選択中", "https://www.google.com/search?q=typescript&tbs=qdr:w"],
    [
      "カスタム期間",
      "https://www.google.com/search?q=typescript&tbs=cdr:1,cd_min:8/1/2026,cd_max:8/31/2026",
    ],
    ["ニュース", "https://www.google.com/search?q=typescript&tbm=nws&tbs=sbd:1"],
    ["除外あり", "https://www.google.com/search?q=typescript+-linkedin+-facebook"],
  ];

  for (const [name, url] of cases) {
    it(name, async () => {
      const { container } = render(<Card url={url} settings={defaultSettings()} />);
      const found = await violations(container);
      expect(describeViolations(found)).toBe("");
    });
  }
});

describe("設定画面のアクセシビリティ", () => {
  it("既定の設定", async () => {
    const { container } = render(<App initial={defaultSettings()} />);
    expect(describeViolations(await violations(container))).toBe("");
  });

  it("エラーのある行を含む設定", async () => {
    const { container } = render(
      <App
        initial={{
          ...defaultSettings(),
          terms: [
            { label: "", qdr: "w" },
            { label: "Duplicate", qdr: "w" },
          ],
          langs: [{ label: "Broken", lr: "ja" }],
        }}
      />,
    );
    expect(describeViolations(await violations(container))).toBe("");
  });
});
