// Google のテーマは OS 設定と独立しているので、body の背景色の輝度で判定する

export type Theme = "light" | "dark";

/** rgb() / rgba() / #hex を [r, g, b, a] に。読めなければ null */
function parseColor(color: string): [number, number, number, number] | null {
  const s = color.trim();
  const fn = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(
    s,
  );
  if (fn) {
    const alpha =
      fn[4] === undefined
        ? 1
        : fn[4].endsWith("%")
          ? Number(fn[4].slice(0, -1)) / 100
          : Number(fn[4]);
    return [Number(fn[1]), Number(fn[2]), Number(fn[3]), alpha];
  }
  const hex = /^#([0-9a-f]{3,8})$/i.exec(s)?.[1];
  if (hex) {
    if (hex.length === 3 || hex.length === 4) {
      const [r, g, b, a] = [...hex].map((c) => parseInt(c + c, 16));
      return [r!, g!, b!, a === undefined ? 1 : a / 255];
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return [r, g, b, a];
    }
  }
  return null;
}

/** 完全に透明か（読めない色も透明扱い）。body が透明なら html の背景を見る、という判断に使う */
export function isTransparent(color: string): boolean {
  const rgba = parseColor(color);
  return rgba === null || rgba[3] === 0;
}

/**
 * 背景色から light / dark を判定する。
 * 透明・不明な色はライト扱い（Google の既定がライトなので、外しても被害が小さい）
 */
export function detectTheme(background: string): Theme {
  const rgba = parseColor(background);
  if (!rgba || rgba[3] === 0) return "light";
  const [r, g, b] = rgba;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 128 ? "dark" : "light";
}
