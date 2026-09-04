import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
  // wxt/browser を偽のブラウザ API に差し替えてくれる
  plugins: [WxtVitest()],
  test: {
    include: ["extension/**/*.test.ts", "extension/**/*.test.tsx"],
    // 表示文言を差し替える。テストファイルの import より先に走る必要がある
    setupFiles: ["extension/testing/setup.ts"],
  },
});
