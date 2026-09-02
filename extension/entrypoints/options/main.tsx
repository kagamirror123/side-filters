import "@cloudflare/kumo/styles/standalone";
import "./style.css";
import { createRoot } from "react-dom/client";
import { browser } from "wxt/browser";
import { loadSettings } from "@/lib/settings";
import { App } from "./App";
import { applyTheme } from "./theme";

document.title = browser.i18n.getMessage("extName");
document.documentElement.lang = browser.i18n.getUILanguage();

// 設定は描画の前に読む。読み込み中の空表示を出さずに済み、App は Effect を持たなくてよい
const settings = await loadSettings();
applyTheme(settings.theme);

const root = document.getElementById("root");
if (root) createRoot(root).render(<App initial={settings} />);
