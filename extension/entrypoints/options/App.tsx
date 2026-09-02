import { useRef, useState, type ReactNode } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Input } from "@cloudflare/kumo/components/input";
import { Select } from "@cloudflare/kumo/components/select";
import { Switch } from "@cloudflare/kumo/components/switch";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { browser } from "wxt/browser";
import {
  defaultSettings,
  saveSettings,
  type LangPreset,
  type Placement,
  type Settings,
  type TermPreset,
  type ThemePreference,
} from "@/lib/settings";
import { formatQdr, parseQdr, QDR_UNITS, type QdrUnit } from "@/lib/url";
import { PlacementChoice } from "./PlacementChoice";
import { applyTheme } from "./theme";

const t = browser.i18n.getMessage;

const LANG_CODE = /^lang_[a-zA-Z]{2,3}(?:-[a-zA-Z]{2,4})?$/;

const UNIT_LABELS: Record<QdrUnit, string> = {
  h: t("unitHour"),
  d: t("unitDay"),
  w: t("unitWeek"),
  m: t("unitMonth"),
  y: t("unitYear"),
};

const UNIT_ITEMS = QDR_UNITS.map((unit) => ({ label: UNIT_LABELS[unit], value: unit }));

const THEME_ITEMS: { label: string; value: ThemePreference }[] = [
  { label: t("themeSystem"), value: "system" },
  { label: t("themeLight"), value: "light" },
  { label: t("themeDark"), value: "dark" },
];

/** 言語コードの入力候補。ここに無いコードも手で入れられる */
const LANG_SUGGESTIONS = [
  "lang_ja",
  "lang_en",
  "lang_zh-CN",
  "lang_zh-TW",
  "lang_ko",
  "lang_fr",
  "lang_de",
  "lang_es",
  "lang_pt",
  "lang_ru",
];

/** 保存はまとめて行う。1 文字ごとに storage.sync へ書くと書き込み回数の上限に当たる */
function useDebouncedSave() {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (settings: Settings) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void saveSettings(settings), 400);
  };
}

function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

interface CellProps {
  name: string;
  span: string;
  /** 入っていれば赤枠とメッセージを出す */
  error?: string;
  children: ReactNode;
}

/**
 * 入力欄 1 つぶんの枠。幅はここで決める（kumo の className は内側の input に付くので、
 * 外側に自前の枠を置かないと列幅を揃えられない）。
 * 見出しは列見出しが受け持つので、狭いときだけ各欄の上に出す。
 */
function Cell({ name, span, error, children }: CellProps) {
  return (
    <div className={`cell cell-${span}`} data-invalid={error ? "" : undefined}>
      <span className="cell-name">{name}</span>
      {children}
      {error ? <span className="cell-error">{error}</span> : null}
    </div>
  );
}

interface RowProps {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  children: ReactNode;
}

function Row({ index, count, onMove, onRemove, children }: RowProps) {
  return (
    <li className="row">
      <div className="cells">{children}</div>
      <div className="row-actions">
        <Button
          shape="square"
          variant="ghost"
          size="sm"
          icon={<ArrowUpIcon />}
          aria-label={t("optionsMoveUp")}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
        />
        <Button
          shape="square"
          variant="ghost"
          size="sm"
          icon={<ArrowDownIcon />}
          aria-label={t("optionsMoveDown")}
          disabled={index === count - 1}
          onClick={() => onMove(index, index + 1)}
        />
        <Button
          shape="square"
          variant="ghost"
          size="sm"
          icon={<TrashIcon />}
          aria-label={t("optionsRemove")}
          onClick={() => onRemove(index)}
        />
      </div>
    </li>
  );
}

interface SectionProps {
  heading: string;
  /** 列見出し。[表示名, 幅の種類] の並び */
  columns: [string, string][];
  empty: string;
  addLabel: string;
  onAdd: () => void;
  isEmpty: boolean;
  children: ReactNode;
}

function Section({ heading, columns, empty, addLabel, onAdd, isEmpty, children }: SectionProps) {
  return (
    <section className="section">
      <h2 className="section-heading">{heading}</h2>
      {isEmpty ? (
        <p className="empty">{empty}</p>
      ) : (
        <div className="rows-wrap">
          <div className="rows-head" aria-hidden="true">
            {columns.map(([name, span]) => (
              <span key={name} className={`cell-${span}`}>
                {name}
              </span>
            ))}
          </div>
          <ul className="rows">{children}</ul>
        </div>
      )}
      <div>
        <Button variant="secondary" size="sm" icon={<PlusIcon />} onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
    </section>
  );
}

export function App({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState(initial);
  const save = useDebouncedSave();

  const update = (next: Settings) => {
    setSettings(next);
    save(next);
  };

  const setTerms = (terms: TermPreset[]) => update({ ...settings, terms });
  const setLangs = (langs: LangPreset[]) => update({ ...settings, langs });

  const editTerm = (index: number, patch: Partial<TermPreset>) =>
    setTerms(settings.terms.map((term, i) => (i === index ? { ...term, ...patch } : term)));

  const editLang = (index: number, patch: Partial<LangPreset>) =>
    setLangs(settings.langs.map((lang, i) => (i === index ? { ...lang, ...patch } : lang)));

  return (
    <main className="page">
      <header className="page-head">
        <h1 className="page-title">{t("optionsHeading")}</h1>
        <p className="page-lede">{t("optionsLede")}</p>
      </header>

      <Section
        heading={t("optionsTermsHeading")}
        columns={[
          [t("optionsFieldLabel"), "label"],
          [t("optionsFieldCount"), "count"],
          [t("optionsFieldUnit"), "unit"],
        ]}
        empty={t("optionsEmptyTerms")}
        addLabel={t("optionsAddTerm")}
        isEmpty={settings.terms.length === 0}
        onAdd={() => setTerms([...settings.terms, { label: "", qdr: "d" }])}
      >
        {settings.terms.map((term, index) => {
          // 壊れた値が storage にあっても編集できるよう、読めない qdr は 1 日として扱う
          const parts = parseQdr(term.qdr) ?? { unit: "d" as QdrUnit, count: 1 };
          return (
            <Row
              key={index}
              index={index}
              count={settings.terms.length}
              onMove={(from, to) => setTerms(move(settings.terms, from, to))}
              onRemove={(i) => setTerms(settings.terms.filter((_, j) => j !== i))}
            >
              <Cell
                name={t("optionsFieldLabel")}
                span="label"
                error={term.label.trim() === "" ? t("optionsErrorLabel") : undefined}
              >
                <Input
                  aria-label={t("optionsFieldLabel")}
                  value={term.label}
                  onChange={(event) => editTerm(index, { label: event.target.value })}
                />
              </Cell>
              <Cell name={t("optionsFieldCount")} span="count">
                <Input
                  type="number"
                  min={1}
                  aria-label={t("optionsFieldCount")}
                  value={String(parts.count)}
                  onChange={(event) => {
                    const count = Math.max(1, Math.floor(Number(event.target.value) || 1));
                    editTerm(index, { qdr: formatQdr({ ...parts, count }) });
                  }}
                />
              </Cell>
              <Cell name={t("optionsFieldUnit")} span="unit">
                <Select
                  aria-label={t("optionsFieldUnit")}
                  items={UNIT_ITEMS}
                  value={parts.unit}
                  onValueChange={(unit: QdrUnit | null) => {
                    if (unit) editTerm(index, { qdr: formatQdr({ ...parts, unit }) });
                  }}
                />
              </Cell>
            </Row>
          );
        })}
      </Section>

      <Section
        heading={t("optionsLangsHeading")}
        columns={[
          [t("optionsFieldLabel"), "label"],
          [t("optionsFieldCode"), "code"],
        ]}
        empty={t("optionsEmptyLangs")}
        addLabel={t("optionsAddLang")}
        isEmpty={settings.langs.length === 0}
        onAdd={() => setLangs([...settings.langs, { label: "", lr: "lang_en" }])}
      >
        {settings.langs.map((lang, index) => (
          <Row
            key={index}
            index={index}
            count={settings.langs.length}
            onMove={(from, to) => setLangs(move(settings.langs, from, to))}
            onRemove={(i) => setLangs(settings.langs.filter((_, j) => j !== i))}
          >
            <Cell
              name={t("optionsFieldLabel")}
              span="label"
              error={lang.label.trim() === "" ? t("optionsErrorLabel") : undefined}
            >
              <Input
                aria-label={t("optionsFieldLabel")}
                value={lang.label}
                onChange={(event) => editLang(index, { label: event.target.value })}
              />
            </Cell>
            <Cell
              name={t("optionsFieldCode")}
              span="code"
              error={LANG_CODE.test(lang.lr) ? undefined : t("optionsErrorCode")}
            >
              <Input
                aria-label={t("optionsFieldCode")}
                list="lang-codes"
                value={lang.lr}
                onChange={(event) => editLang(index, { lr: event.target.value.trim() })}
              />
            </Cell>
          </Row>
        ))}
      </Section>

      <datalist id="lang-codes">
        {LANG_SUGGESTIONS.map((code) => (
          <option key={code} value={code} />
        ))}
      </datalist>

      <section className="section">
        <h2 className="section-heading">{t("optionsCardHeading")}</h2>
        <Switch
          label={t("optionsShowLangs")}
          checked={settings.showLangs}
          onCheckedChange={(showLangs) => update({ ...settings, showLangs })}
        />
        <Switch
          label={t("optionsShowQuery")}
          checked={settings.showQuery}
          onCheckedChange={(showQuery) => update({ ...settings, showQuery })}
        />
      </section>

      <section className="section">
        <h2 className="section-heading">{t("optionsPlacementHeading")}</h2>
        <PlacementChoice
          value={settings.placement}
          onChange={(placement: Placement) => update({ ...settings, placement })}
        />
      </section>

      <section className="section">
        <h2 className="section-heading">{t("optionsAppearanceHeading")}</h2>
        <div className="cell-theme">
          <Select
            label={t("optionsThemeLabel")}
            description={t("optionsThemeDescription")}
            items={THEME_ITEMS}
            value={settings.theme}
            onValueChange={(theme: ThemePreference | null) => {
              if (!theme) return;
              // 保存を待たずに見た目を切り替える
              applyTheme(theme);
              update({ ...settings, theme });
            }}
          />
        </div>
      </section>

      <footer className="page-foot">
        <Button variant="secondary" size="sm" onClick={() => update(defaultSettings())}>
          {t("optionsReset")}
        </Button>
      </footer>
    </main>
  );
}
