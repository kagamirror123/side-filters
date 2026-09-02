// 検索結果 URL の tbs / lr を読み書きする純関数。他のパラメータには触らない
// （例外: 絞り込みを変えたら start（ページ番号）は落とす。Google 自身のチップも同じ挙動）

/** 期間コード。"h" | "d" | "w" | "m" | "y" に任意の倍数を後置できる（"d3", "m6", "y3"） */
export type Qdr = string;

const QDR_PATTERN = /^[hdwmy]\d*$/;

/** tbs の中で期間を表す部分。qdr と、カスタム期間の cdr / cd_min / cd_max は排他なのでまとめて扱う */
const PERIOD_KEYS = new Set(["qdr", "cdr", "cd_min", "cd_max"]);

export function isValidQdr(value: string): value is Qdr {
  return QDR_PATTERN.test(value);
}

/** 期間の単位。h=時間 d=日 w=週 m=月 y=年 */
export type QdrUnit = "h" | "d" | "w" | "m" | "y";

export const QDR_UNITS: readonly QdrUnit[] = ["h", "d", "w", "m", "y"];

export interface QdrParts {
  unit: QdrUnit;
  /** 単位の倍数。1 のときコードに数字は付かない（m6 = 6 か月、m = 1 か月） */
  count: number;
}

/** 設定画面で扱うために qdr を単位と倍数に分ける。読めなければ null */
export function parseQdr(qdr: string): QdrParts | null {
  const matched = /^([hdwmy])(\d*)$/.exec(qdr);
  if (!matched) return null;
  const count = matched[2] === "" ? 1 : Number(matched[2]);
  if (count < 1) return null;
  return { unit: matched[1] as QdrUnit, count };
}

/** 単位と倍数から qdr を組み立てる */
export function formatQdr({ unit, count }: QdrParts): Qdr {
  return count === 1 ? unit : `${unit}${count}`;
}

function splitTbs(tbs: string | null): string[] {
  if (!tbs) return [];
  return tbs.split(",").filter((part) => part !== "");
}

function keyOf(part: string): string {
  const colon = part.indexOf(":");
  return colon === -1 ? part : part.slice(0, colon);
}

/** 現在 URL の期間コード。指定なし・カスタム期間（cdr）なら null */
export function getQdr(url: string): Qdr | null {
  const tbs = new URL(url).searchParams.get("tbs");
  for (const part of splitTbs(tbs)) {
    if (part.startsWith("qdr:")) {
      const value = part.slice("qdr:".length);
      return value === "" ? null : value;
    }
  }
  return null;
}

/** 現在 URL の言語コード（lang_ja など）。指定なしなら null */
export function getLr(url: string): string | null {
  const lr = new URL(url).searchParams.get("lr");
  return lr ? lr : null;
}

function finish(u: URL): string {
  u.searchParams.delete("start");
  return u.toString();
}

/** tbs の期間部分だけを差し替える。null で解除。sbd（日付順）などの他の tbs 部分は維持する */
export function withQdr(url: string, qdr: Qdr | null): string {
  const u = new URL(url);
  const rest = splitTbs(u.searchParams.get("tbs")).filter((part) => !PERIOD_KEYS.has(keyOf(part)));
  const parts = qdr === null ? rest : [`qdr:${qdr}`, ...rest];
  if (parts.length === 0) u.searchParams.delete("tbs");
  else u.searchParams.set("tbs", parts.join(","));
  return finish(u);
}

/** 現在の検索語 */
export function getQuery(url: string): string {
  return new URL(url).searchParams.get("q") ?? "";
}

/** 検索語を差し替える */
export function withQuery(url: string, query: string): string {
  const u = new URL(url);
  u.searchParams.set("q", query);
  return finish(u);
}

/** tbs の中の単独フラグ（sbd:1 = 日付順、li:1 = 完全一致）が立っているか */
export function hasTbsFlag(url: string, key: string): boolean {
  const tbs = new URL(url).searchParams.get("tbs");
  return splitTbs(tbs).some((part) => part === `${key}:1`);
}

/** tbs の単独フラグを立てる / 下ろす。qdr など他の部分はそのまま */
export function withTbsFlag(url: string, key: string, on: boolean): string {
  const u = new URL(url);
  const rest = splitTbs(u.searchParams.get("tbs")).filter((part) => keyOf(part) !== key);
  const parts = on ? [...rest, `${key}:1`] : rest;
  if (parts.length === 0) u.searchParams.delete("tbs");
  else u.searchParams.set("tbs", parts.join(","));
  return finish(u);
}

/** lr を差し替える。null で解除 */
export function withLr(url: string, lr: string | null): string {
  const u = new URL(url);
  if (lr === null) u.searchParams.delete("lr");
  else u.searchParams.set("lr", lr);
  return finish(u);
}

/** 旧来の tbm と新しい udm の両方で「すべて / ニュース / 動画」だけを通す */
const FILTERABLE_TBM = new Set(["", "nws", "vid"]);
const FILTERABLE_UDM = new Set(["", "14", "12", "7"]); // 14: ウェブ, 12: ニュース, 7: 動画

/**
 * ニュースの画面か。日付順（tbs=sbd:1）はここでしか効かないことを 2026-09-03 に実測した
 * （ウェブ検索と動画では黙って無視される）
 */
export function isNewsPage(url: string): boolean {
  const u = new URL(url);
  return u.searchParams.get("tbm") === "nws" || u.searchParams.get("udm") === "12";
}

/** カードを出す画面か。画像・ショッピング・地図・AI モードには出さない */
export function isFilterablePage(url: string): boolean {
  const u = new URL(url);
  if (u.pathname !== "/search") return false;
  const tbm = u.searchParams.get("tbm") ?? "";
  const udm = u.searchParams.get("udm") ?? "";
  return FILTERABLE_TBM.has(tbm) && FILTERABLE_UDM.has(udm);
}
