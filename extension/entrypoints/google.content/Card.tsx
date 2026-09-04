import { useId, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { browser } from "wxt/browser";
import { OPEN_OPTIONS } from "@/lib/messages";
import {
  addExclusion,
  checkExclusion,
  getExclusions,
  isPhrase,
  phraseAvailability,
  removeExclusion,
  setPhrase,
  type ExclusionProblem,
} from "@/lib/query";
import type { Settings } from "@/lib/settings";
import {
  getLr,
  getPeriod,
  getQuery,
  hasTbsFlag,
  isNewsPage,
  withLr,
  withQdr,
  withQuery,
  withTbsFlag,
} from "@/lib/url";
import { CLOCK, GEAR, GLOBE, TEXT, X } from "./icons";

interface CardProps {
  /** 現在の検索結果ページの URL。すべての控えの状態とリンク先はここから決まる */
  url: string;
  settings: Settings;
}

interface Item {
  /** React の key に使う。期間は qdr、言語は lr。設定の正規化が重複を落とすので一意になる */
  id: string;
  label: string;
  href: string;
  selected: boolean;
}

const t = browser.i18n.getMessage;

function go(href: string) {
  location.href = href;
}

/* ------------------------------------------------------------------ 部品 */

function Section({
  icon,
  title,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="section">
      <div className="section-head">
        <h2 className="section-title">
          {icon}
          {title}
        </h2>
        {action ? <div className="head-actions">{action}</div> : null}
      </div>
      {children}
    </div>
  );
}

/**
 * オンとオフだけの控え。押すと URL が変わってページが読み込み直される。
 * リンクなので aria-pressed（button 用）は使わず、いまの状態は aria-current で示す。
 * 説明と「使えない理由」は title だけに置かず、必ず aria-describedby でも結び付ける
 */
function Toggle({
  label,
  href,
  on,
  help,
}: {
  label: string;
  href?: string;
  on: boolean;
  help: string;
}) {
  const helpId = `${useId()}-help`;
  const shared = { className: "toggle", title: help, "aria-describedby": helpId };
  return (
    <>
      {href ? (
        <a {...shared} href={href} aria-current={on ? "true" : undefined}>
          {label}
        </a>
      ) : (
        <span {...shared} aria-disabled="true">
          {label}
        </span>
      )}
      <span className="sr-only" id={helpId}>
        {help}
      </span>
    </>
  );
}

/**
 * 連結ピルが 1 行に収まるかを実寸で見る。収まらなければ格子に落とす。
 * ラベルの長さもフォントも UI 言語と設定で変わるので、個数では判定できない。
 */
function useInlineFit(signature: string) {
  const ref = useRef<HTMLUListElement>(null);
  const [fits, setFits] = useState(true);

  useLayoutEffect(() => {
    const list = ref.current;
    const container = list?.parentElement;
    if (!list || !container) return;

    const check = () => {
      // 実寸は連結ピルの姿でしか意味を持たないので、測る間だけその姿に戻す
      list.dataset.measuring = "";
      const measured = list.scrollWidth <= list.clientWidth;
      delete list.dataset.measuring;
      setFits(measured);
    };

    check();
    // 列幅が変わったら測り直す。姿が変わるたびに再発火しないよう、list 自身ではなく親を見る
    const observer = new ResizeObserver(check);
    observer.observe(container);
    return () => observer.disconnect();
  }, [signature]);

  return { ref, fits };
}

/** 「全期間」「全言語」を先頭に置いた、どれか 1 つを選ぶ並び */
function OptionList({ all, items }: { all: Item; items: Item[] }) {
  const { ref, fits } = useInlineFit(items.map((item) => item.label).join(" "));
  const options = [all, ...items];

  return (
    <ul className="options" data-layout={fits ? "track" : "grid"} ref={ref}>
      {options.map((item, index) => (
        <li key={item.id}>
          <a
            className="option"
            href={item.href}
            aria-current={item.selected ? "true" : undefined}
            data-all={index === 0 ? "" : undefined}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** 除外リスト。チップは q の -語 トークンをそのまま映したもの */
function ExclusionField({ url }: { url: string }) {
  const [draft, setDraft] = useState("");
  const [problem, setProblem] = useState<ExclusionProblem | null>(null);
  const id = useId();
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const query = getQuery(url);
  const words = getExclusions(query);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const issue = checkExclusion(query, draft);
    if (issue === "empty") {
      setDraft("");
      setProblem(null);
      return;
    }
    if (issue !== null) {
      setProblem(issue);
      return;
    }
    go(withQuery(url, addExclusion(query, draft)));
  };

  const message = problem === "quote" ? t("exclusionErrorQuote") : t("exclusionErrorDuplicate");

  return (
    <form className="exclusions" onSubmit={submit}>
      <div className="field">
        {words.map((word) => (
          <span className="token" key={word}>
            {word}
            <a
              className="token-remove"
              href={withQuery(url, removeExclusion(query, word))}
              title={t("exclusionRemove", word)}
            >
              {X}
              <span className="sr-only">{t("exclusionRemove", word)}</span>
            </a>
          </span>
        ))}
        <input
          className="field-input"
          type="text"
          // 除外語は個人情報ではないので候補も綴り確認も出さない
          autoComplete="off"
          spellCheck={false}
          value={draft}
          placeholder={words.length === 0 ? t("exclusionPlaceholder") : ""}
          aria-label={t("exclusionPlaceholder")}
          aria-describedby={problem === null ? helpId : `${errorId} ${helpId}`}
          aria-invalid={problem === null ? undefined : true}
          title={t("exclusionHelp")}
          onChange={(event) => {
            setDraft(event.target.value);
            setProblem(null);
          }}
        />
      </div>
      <span className="sr-only" id={helpId}>
        {t("exclusionHelp")}
      </span>
      {problem === null ? null : (
        <p className="field-error" id={errorId} role="alert">
          {message}
        </p>
      )}
    </form>
  );
}

function openSettings() {
  void browser.runtime.sendMessage(OPEN_OPTIONS);
}

/* ------------------------------------------------------------------ カード */

export function Card({ url, settings }: CardProps) {
  const period = getPeriod(url);
  const lr = getLr(url);
  const query = getQuery(url);

  // 日付順はニュースでしか効かないので、そこでしか出さない（docs/DESIGN.md）
  const news = isNewsPage(url);
  const byDate = hasTbsFlag(url, "sbd");
  const verbatim = hasTbsFlag(url, "li");
  const phrase = isPhrase(query);
  const phraseState = phraseAvailability(query);
  const phraseHelp =
    phraseState === "ok"
      ? t("togglePhraseHelp")
      : phraseState === "single"
        ? t("togglePhraseSingleWord")
        : t("togglePhraseUnavailable");

  return (
    <section className="card" aria-label={t("cardLabel")}>
      <Section
        icon={CLOCK}
        title={t("sectionTerms")}
        action={
          <>
            {news ? (
              <Toggle
                label={t("toggleSortByDate")}
                href={withTbsFlag(url, "sbd", !byDate)}
                on={byDate}
                help={t("toggleSortByDateHelp")}
              />
            ) : null}
            <button type="button" className="gear" onClick={openSettings} title={t("openSettings")}>
              {GEAR}
              <span className="sr-only">{t("openSettings")}</span>
            </button>
          </>
        }
      >
        <OptionList
          all={{
            id: "all",
            label: t("termAll"),
            href: withQdr(url, null),
            // Google 側で期間を指定しているときは、どの控えも選択中にしない（「全期間」も含む）
            selected: period.kind === "none",
          }}
          items={settings.terms.map((term) => ({
            id: term.qdr,
            label: term.label,
            href: withQdr(url, term.qdr),
            selected: period.kind === "preset" && period.qdr === term.qdr,
          }))}
        />
        {period.kind === "custom" ? <CustomPeriodNote min={period.min} max={period.max} /> : null}
      </Section>

      {settings.showLangs ? (
        <Section icon={GLOBE} title={t("sectionLangs")}>
          <OptionList
            all={{ id: "all", label: t("langAll"), href: withLr(url, null), selected: lr === null }}
            items={settings.langs.map((lang) => ({
              id: lang.lr,
              label: lang.label,
              href: withLr(url, lang.lr),
              selected: lr === lang.lr,
            }))}
          />
        </Section>
      ) : null}

      {settings.showQuery ? (
        <Section
          icon={TEXT}
          title={t("sectionQuery")}
          action={
            <>
              <Toggle
                label={t("toggleVerbatim")}
                href={withTbsFlag(url, "li", !verbatim)}
                on={verbatim}
                help={t("toggleVerbatimHelp")}
              />
              <Toggle
                label={t("togglePhrase")}
                href={phraseState === "ok" ? withQuery(url, setPhrase(query, !phrase)) : undefined}
                on={phrase}
                help={phraseHelp}
              />
            </>
          }
        >
          <ExclusionField url={url} />
        </Section>
      ) : null}
    </section>
  );
}

/**
 * Google の「期間を指定」が効いているときの表示。
 * 独自の日付 picker は持たないので、いまの絞り込みを言葉で示すだけにする。解除は「全期間」でできる
 */
function CustomPeriodNote({ min, max }: { min: string | null; max: string | null }) {
  const dates = [min, max].filter((value) => value !== null).join(" – ");
  return <p className="note">{dates === "" ? t("termCustom") : t("termCustomDates", dates)}</p>;
}
