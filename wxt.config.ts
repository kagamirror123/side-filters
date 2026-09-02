import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "extension",
  // publicDir は root 基準で解決されるので、srcDir に合わせて明示する
  publicDir: "extension/public",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    // ストア公開で英語を既定にするため、名前と説明は _locales から引く
    name: "__MSG_extName__",
    description: "__MSG_extDescription__",
    default_locale: "en",
    // 設定は chrome.storage.sync。ホスト権限は content script の matches (google.com) だけで足りる
    permissions: ["storage"],
  },
});
