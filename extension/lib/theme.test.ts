import { describe, expect, it } from "vitest";
import { detectTheme, isTransparent } from "./theme";

describe("detectTheme", () => {
  it("実測したダークテーマの背景は dark", () => {
    expect(detectTheme("rgb(34, 36, 42)")).toBe("dark");
    expect(detectTheme("rgb(34 36 42)")).toBe("dark");
  });
  it("白系はライト", () => {
    expect(detectTheme("rgb(255, 255, 255)")).toBe("light");
    expect(detectTheme("#fff")).toBe("light");
    expect(detectTheme("#ffffff")).toBe("light");
  });
  it("hex の暗色は dark", () => {
    expect(detectTheme("#1f1f1f")).toBe("dark");
    expect(detectTheme("#202124ff")).toBe("dark");
  });
  it("透明・不明はライトに寄せる", () => {
    expect(detectTheme("rgba(0, 0, 0, 0)")).toBe("light");
    expect(detectTheme("transparent")).toBe("light");
    expect(detectTheme("")).toBe("light");
  });
  it("不透明な rgba は色で判定する", () => {
    expect(detectTheme("rgba(34, 36, 42, 1)")).toBe("dark");
    expect(detectTheme("rgb(34 36 42 / 100%)")).toBe("dark");
  });
});

describe("isTransparent", () => {
  it("アルファ 0 と読めない色は透明", () => {
    expect(isTransparent("rgba(0, 0, 0, 0)")).toBe(true);
    expect(isTransparent("transparent")).toBe(true);
    expect(isTransparent("")).toBe(true);
    expect(isTransparent("#0000")).toBe(true);
  });
  it("不透明な色は透明でない", () => {
    expect(isTransparent("rgb(34, 36, 42)")).toBe(false);
    expect(isTransparent("#fff")).toBe(false);
    expect(isTransparent("rgba(255, 255, 255, 0.5)")).toBe(false);
  });
});
