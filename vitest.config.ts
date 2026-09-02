import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
  // wxt/browser を偽のブラウザ API に差し替えてくれる
  plugins: [WxtVitest()],
  test: {
    include: ["extension/**/*.test.ts"],
  },
});
