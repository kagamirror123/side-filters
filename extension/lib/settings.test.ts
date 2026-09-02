import { fakeBrowser } from "wxt/testing/fake-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  defaultSettings,
  loadSettings,
  normalizeSettings,
  saveSettings,
  watchSettings,
  type Settings,
} from "./settings";

const t = (key: string) => `#${key}`;
const defaults = defaultSettings(t);

describe("defaultSettings", () => {
  it("期間 6 つ・言語 2 つ・言語セクション表示", () => {
    expect(defaults.terms.map((x) => x.qdr)).toEqual(["d", "w", "m", "m6", "y", "y3"]);
    expect(defaults.langs.map((x) => x.lr)).toEqual(["lang_ja", "lang_en"]);
    expect(defaults.showLangs).toBe(true);
    expect(defaults.showQuery).toBe(true);
    expect(defaults.placement).toBe("results");
    expect(defaults.theme).toBe("system");
    expect(defaults.terms[0]!.label).toBe("#termDay");
  });
});

describe("normalizeSettings", () => {
  it("オブジェクト以外は既定に戻す", () => {
    for (const raw of [undefined, null, "x", 1, []])
      expect(normalizeSettings(raw, defaults)).toEqual(defaults);
  });
  it("正しい値はそのまま通す", () => {
    const s: Settings = {
      terms: [{ label: "1週間", qdr: "w" }],
      langs: [{ label: "英語", lr: "lang_en" }],
      showLangs: false,
      showQuery: true,
      placement: "wide",
      theme: "light",
    };
    expect(normalizeSettings(s, defaults)).toEqual(s);
  });

  it("置き場所は 2 つの値だけ通し、それ以外は既定へ", () => {
    for (const placement of ["results", "wide"]) {
      expect(normalizeSettings({ placement }, defaults).placement).toBe(placement);
    }
    for (const placement of ["", "right", 1, null]) {
      expect(normalizeSettings({ placement }, defaults).placement).toBe("results");
    }
  });

  it("テーマは 3 つの値だけ通し、それ以外は既定へ", () => {
    for (const theme of ["system", "light", "dark"]) {
      expect(normalizeSettings({ theme }, defaults).theme).toBe(theme);
    }
    for (const theme of ["", "auto", 1, null, undefined]) {
      expect(normalizeSettings({ theme }, defaults).theme).toBe("system");
    }
  });
  it("壊れた項目だけ既定へ戻す", () => {
    const out = normalizeSettings(
      { terms: "oops", langs: [{ label: "英語", lr: "lang_en" }], showLangs: "yes" },
      defaults,
    );
    expect(out.terms).toEqual(defaults.terms);
    expect(out.langs).toEqual([{ label: "英語", lr: "lang_en" }]);
    expect(out.showLangs).toBe(true);
  });
  it("配列の中の不正な要素だけ捨てる。全部捨てたら既定へ", () => {
    const out = normalizeSettings(
      {
        terms: [
          { label: "ok", qdr: "w" },
          { label: "", qdr: "w" },
          { label: "bad", qdr: "3d" },
          null,
          "x",
        ],
        langs: [
          { label: "bad", lr: "ja" },
          { label: 1, lr: "lang_ja" },
        ],
      },
      defaults,
    );
    expect(out.terms).toEqual([{ label: "ok", qdr: "w" }]);
    expect(out.langs).toEqual(defaults.langs);
  });
  it("ラベルは前後の空白を落とし、長すぎれば切る", () => {
    const out = normalizeSettings(
      { terms: [{ label: `  ${"a".repeat(60)}  `, qdr: "d" }] },
      defaults,
    );
    expect(out.terms[0]!.label).toBe("a".repeat(40));
  });
  it("言語コードは lang_xx 形式だけ", () => {
    const out = normalizeSettings(
      {
        langs: [
          { label: "a", lr: "lang_zh-CN" },
          { label: "b", lr: "lang_en" },
          { label: "c", lr: "en" },
        ],
      },
      defaults,
    );
    expect(out.langs.map((x) => x.lr)).toEqual(["lang_zh-CN", "lang_en"]);
  });
});

describe("storage", () => {
  beforeEach(() => {
    fakeBrowser.reset();
    // 既定ラベルは i18n から引く。fake-browser では未実装なので差し替える
    vi.spyOn(fakeBrowser.i18n, "getMessage").mockImplementation((key: string) => `#${key}`);
  });

  it("未保存なら既定を返す", async () => {
    expect(await loadSettings()).toEqual(defaults);
  });

  it("保存して読み戻せる", async () => {
    const s: Settings = {
      terms: [{ label: "1日", qdr: "d" }],
      langs: [{ label: "日本語", lr: "lang_ja" }],
      showLangs: false,
      showQuery: false,
      placement: "results",
      theme: "dark",
    };
    await saveSettings(s);
    expect(await loadSettings()).toEqual(s);
  });

  it("壊れた保存値は整えて返す", async () => {
    await fakeBrowser.storage.sync.set({ settings: { terms: 1, langs: [], showLangs: false } });
    expect(await loadSettings()).toEqual({ ...defaults, showLangs: false });
  });

  it("変更を監視でき、解除できる", async () => {
    const seen: unknown[] = [];
    const unwatch = watchSettings((s) => seen.push(s.showLangs));
    await saveSettings({ ...defaults, showLangs: false });
    expect(seen).toEqual([false]);
    unwatch();
    await saveSettings({ ...defaults, showLangs: true });
    expect(seen).toEqual([false]);
  });
});
