// 設定は chrome.storage.sync に 1 項目で置く。読み出し時に形を整え、不正な値は項目単位で既定へ戻す
import { browser } from "wxt/browser";
import { storage } from "wxt/utils/storage";
import { isValidLangCode, isValidQdr, type Qdr } from "./url";

export interface TermPreset {
  label: string;
  qdr: Qdr;
}

export interface LangPreset {
  label: string;
  /** lang_ja のような Google の言語コード */
  lr: string;
}

/**
 * カードの置き場所。
 * - results: 検索結果の右（既定）
 * - wide: AI による概要などで 1 行目が全幅に埋まり、かつ画面が広いときは右上の空きに出す
 */
export type Placement = "results" | "wide";

const PLACEMENTS = new Set<string>(["results", "wide"]);

/** 設定画面の配色。system は OS の設定に従う */
export type ThemePreference = "system" | "light" | "dark";

const THEMES = new Set<string>(["system", "light", "dark"]);

export interface Settings {
  terms: TermPreset[];
  langs: LangPreset[];
  showLangs: boolean;
  /** 検索語セクション（完全一致・フレーズ・除外）をカードに出すか */
  showQuery: boolean;
  /** カードの置き場所 */
  placement: Placement;
  /** 設定画面だけに効く。SERP のカードは Google の配色に合わせる（docs/DESIGN.md） */
  theme: ThemePreference;
}

/** _locales のメッセージキー。WXT が既定ロケールから型を生成する */
type MessageKey = Parameters<typeof browser.i18n.getMessage>[0];
type Translate = (key: MessageKey) => string;

const MAX_LABEL_LENGTH = 40;

function i18n(key: MessageKey): string {
  const message = browser.i18n.getMessage(key);
  return message === "" ? key : message;
}

/** 既定の設定。ラベルは UI 言語に合わせて _locales から引く */
export function defaultSettings(t: Translate = i18n): Settings {
  return {
    terms: [
      { label: t("termDay"), qdr: "d" },
      { label: t("termWeek"), qdr: "w" },
      { label: t("termMonth"), qdr: "m" },
      { label: t("termHalfYear"), qdr: "m6" },
      { label: t("termYear"), qdr: "y" },
      { label: t("termThreeYears"), qdr: "y3" },
    ],
    langs: [
      { label: t("langJapanese"), lr: "lang_ja" },
      { label: t("langEnglish"), lr: "lang_en" },
    ],
    showLangs: true,
    showQuery: true,
    placement: "results",
    theme: "system",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const label = value.trim().slice(0, MAX_LABEL_LENGTH);
  return label === "" ? null : label;
}

/**
 * プリセットの配列を整える。空配列は「利用者が全部消した」という有効な設定なので、そのまま通す。
 * 既定へ戻すのは配列ですらないとき（未設定・壊れたデータ）だけ。
 * 同じ絞り込み値（qdr / lr）の行は先に出てきた 1 つだけ残す。同じ選択肢が同時に選択中になるのを防ぐ
 */
function normalizeList<T>(
  value: unknown,
  read: (item: Record<string, unknown>) => T | null,
  keyOf: (item: T) => string,
): T[] | null {
  if (!Array.isArray(value)) return null;
  const items: T[] = [];
  const seen = new Set<string>();
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const item = read(raw);
    if (item === null) continue;
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
  }
  return items;
}

function normalizeTerms(value: unknown): TermPreset[] | null {
  return normalizeList<TermPreset>(
    value,
    (item) => {
      const label = cleanLabel(item.label);
      if (label === null || typeof item.qdr !== "string" || !isValidQdr(item.qdr)) return null;
      return { label, qdr: item.qdr };
    },
    (term) => term.qdr,
  );
}

function normalizeLangs(value: unknown): LangPreset[] | null {
  return normalizeList<LangPreset>(
    value,
    (item) => {
      const label = cleanLabel(item.label);
      if (label === null || typeof item.lr !== "string" || !isValidLangCode(item.lr)) return null;
      return { label, lr: item.lr };
    },
    (lang) => lang.lr,
  );
}

/**
 * storage から読んだ値を Settings に整える。壊れている項目だけ既定へ戻す。
 * プリセットは空配列も有効な設定として通す（`normalizeList` を参照）
 */
export function normalizeSettings(raw: unknown, defaults: Settings = defaultSettings()): Settings {
  if (!isRecord(raw)) return defaults;
  return {
    terms: normalizeTerms(raw.terms) ?? defaults.terms,
    langs: normalizeLangs(raw.langs) ?? defaults.langs,
    showLangs: typeof raw.showLangs === "boolean" ? raw.showLangs : defaults.showLangs,
    showQuery: typeof raw.showQuery === "boolean" ? raw.showQuery : defaults.showQuery,
    placement:
      typeof raw.placement === "string" && PLACEMENTS.has(raw.placement)
        ? (raw.placement as Placement)
        : defaults.placement,
    theme:
      typeof raw.theme === "string" && THEMES.has(raw.theme)
        ? (raw.theme as ThemePreference)
        : defaults.theme,
  };
}

const settingsItem = storage.defineItem<unknown>("sync:settings");

export async function loadSettings(): Promise<Settings> {
  return normalizeSettings(await settingsItem.getValue());
}

export async function saveSettings(settings: Settings): Promise<void> {
  await settingsItem.setValue(normalizeSettings(settings));
}

/** 設定が変わるたびに呼ぶ。戻り値で監視を解除する */
export function watchSettings(callback: (settings: Settings) => void): () => void {
  return settingsItem.watch((value) => callback(normalizeSettings(value)));
}
