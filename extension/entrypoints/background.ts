import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { OPEN_OPTIONS } from "@/lib/messages";

// content script からは runtime.openOptionsPage を呼べないので、ここで肩代わりする
export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown) => {
    if (message === OPEN_OPTIONS) void browser.runtime.openOptionsPage();
  });
});
