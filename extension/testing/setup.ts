// テストでも表示文言は _locales の実物を引く。読み上げ名やエラー文の検証を本番と同じ結果で行うため
import { fakeBrowser } from "wxt/testing/fake-browser";
import { vi } from "vitest";
import locale from "../public/_locales/en/messages.json";

interface Message {
  message: string;
  placeholders?: Record<string, { content: string }>;
}

const messages = locale as Record<string, Message>;

/** browser.i18n.getMessage の最小実装。$1 を受ける placeholder だけ差し込む */
function getMessage(key: string, substitutions?: string | string[]): string {
  const entry = messages[key];
  if (!entry) return "";
  const args =
    substitutions === undefined
      ? []
      : Array.isArray(substitutions)
        ? substitutions
        : [substitutions];
  let text = entry.message;
  for (const [name, placeholder] of Object.entries(entry.placeholders ?? {})) {
    const index = Number(placeholder.content.slice(1)) - 1;
    text = text.replaceAll(`$${name.toUpperCase()}$`, args[index] ?? "");
  }
  return text;
}

/** 差し替えを入れ直す。restoreAllMocks を呼ぶテストから使う */
export function installI18n(): void {
  vi.spyOn(fakeBrowser.i18n, "getMessage").mockImplementation(
    getMessage as typeof fakeBrowser.i18n.getMessage,
  );
}

installI18n();
