import type { ThemePreference } from "@/lib/settings";

// kumo の配色は body の data-mode で切り替わる（html の data-theme="kumo" が入口）
const media = matchMedia("(prefers-color-scheme: dark)");

let preference: ThemePreference = "system";

function paint() {
  const dark = preference === "system" ? media.matches : preference === "dark";
  document.body.dataset.mode = dark ? "dark" : "light";
  // スクロールバーなどブラウザ側が描く部分も合わせる
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

// system のときだけ効くが、購読しっぱなしで害はない
media.addEventListener("change", paint);

export function applyTheme(next: ThemePreference) {
  preference = next;
  paint();
}
