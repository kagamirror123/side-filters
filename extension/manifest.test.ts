// production build が出す manifest を固定する。権限や対象ページが黙って増えていないかを見る。
// 読むのは `npm run build` の出力なので、`task check` と CI は test の前に build する
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const OUTPUT = ".output/chrome-mv3";

function manifest(): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(`${OUTPUT}/manifest.json`, "utf8"));
  } catch {
    throw new Error(`${OUTPUT}/manifest.json がない。先に \`npm run build\` を実行する`);
  }
}

describe("packaged manifest", () => {
  it("MV3 で、権限は storage だけ", () => {
    const m = manifest();
    expect(m.manifest_version).toBe(3);
    expect(m.permissions).toEqual(["storage"]);
    // ホスト権限は content script の matches だけで足りる
    expect(m.host_permissions).toBeUndefined();
    expect(m.optional_permissions).toBeUndefined();
    expect(m.optional_host_permissions).toBeUndefined();
  });

  it("content script は Google の検索結果ページだけに入る", () => {
    const scripts = manifest().content_scripts as { matches: string[]; js: string[] }[];
    expect(scripts).toHaveLength(1);
    expect(scripts[0]!.matches).toEqual(["https://www.google.com/search*"]);
  });

  it("設定画面はタブで開く", () => {
    const options = manifest().options_ui as { page: string; open_in_tab: boolean };
    expect(options.page).toBe("options.html");
    expect(options.open_in_tab).toBe(true);
  });

  it("名前と説明は _locales から引く", () => {
    const m = manifest();
    expect(m.default_locale).toBe("en");
    expect(m.name).toBe("__MSG_extName__");
    expect(m.description).toBe("__MSG_extDescription__");
  });

  it("background は設定画面を開く service worker 1 つだけ", () => {
    // content script の chrome.runtime に openOptionsPage は無い（2026-09-04 に実 Chrome で再確認、docs/DESIGN.md）
    expect(manifest().background).toEqual({ service_worker: "background.js" });
  });

  it("外部と繋がる入口を持たない", () => {
    const m = manifest();
    expect(m.externally_connectable).toBeUndefined();
    expect(m.content_security_policy).toBeUndefined();
    // 公開するのはカードの CSS だけ。Shadow DOM へ流し込むために content script が fetch する
    expect(m.web_accessible_resources).toEqual([
      {
        matches: ["https://www.google.com/*"],
        resources: ["content-scripts/google.css"],
        use_dynamic_url: true,
      },
    ]);
  });

  it("配布物に秘密ファイルや取りこぼしが混ざらない", () => {
    const entries = readdirSync(OUTPUT);
    expect(entries.toSorted()).toEqual([
      "_locales",
      "assets",
      "background.js",
      "chunks",
      "content-scripts",
      "icon",
      "manifest.json",
      "options.html",
    ]);
  });
});
