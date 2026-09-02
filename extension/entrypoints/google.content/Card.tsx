import { useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { browser } from "wxt/browser";
import { OPEN_OPTIONS } from "@/lib/messages";
import {
  addExclusion,
  getExclusions,
  isPhrase,
  phraseAvailability,
  removeExclusion,
  setPhrase,
} from "@/lib/query";
import type { Settings } from "@/lib/settings";
import {
  getLr,
  getQdr,
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
  /** React の key に使う。期間は qdr、言語は lr */
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

/** オンとオフだけの控え。押すと URL が変わってページが読み込み直される */
function Toggle({
  label,
  href,
  on,
  title,
}: {
  label: string;
  href?: string;
  on: boolean;
  title?: string;
}) {
  if (!href) {
    return (
      <span className="toggle" aria-disabled="true" title={title}>
        {label}
      </span>
    );
  }
  return (
    <a className="toggle" href={href} aria-pressed={on} title={title}>
      {label}
    </a>
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
  const query = getQuery(url);
  const words = getExclusions(query);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = addExclusion(query, draft);
    if (next === query) {
      setDraft("");
      return;
    }
    go(withQuery(url, next));
  };

  return (
    <form className="field" onSubmit={submit} title={t("exclusionHelp")}>
      {words.map((word) => (
        <span className="token" key={word}>
          {word}
          <a
            className="token-remove"
            href={withQuery(url, removeExclusion(query, word))}
            title={t("exclusionRemove")}
          >
            {X}
            <span className="sr-only">{t("exclusionRemove")}</span>
          </a>
        </span>
      ))}
      <input
        className="field-input"
        type="text"
        value={draft}
        placeholder={words.length === 0 ? t("exclusionPlaceholder") : ""}
        aria-label={t("exclusionPlaceholder")}
        onChange={(event) => setDraft(event.target.value)}
      />
    </form>
  );
}

function openSettings() {
  void browser.runtime.sendMessage(OPEN_OPTIONS);
}

/* ------------------------------------------------------------------ カード */

export function Card({ url, settings }: CardProps) {
  const qdr = getQdr(url);
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
                title={t("toggleSortByDateHelp")}
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
          all={{ id: "all", label: t("termAll"), href: withQdr(url, null), selected: qdr === null }}
          items={settings.terms.map((term) => ({
            id: term.qdr,
            label: term.label,
            href: withQdr(url, term.qdr),
            selected: qdr === term.qdr,
          }))}
        />
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
                title={t("toggleVerbatimHelp")}
              />
              <Toggle
                label={t("togglePhrase")}
                href={phraseState === "ok" ? withQuery(url, setPhrase(query, !phrase)) : undefined}
                on={phrase}
                title={phraseHelp}
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
