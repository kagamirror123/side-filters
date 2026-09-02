import { browser } from "wxt/browser";
import type { Placement } from "@/lib/settings";

const t = browser.i18n.getMessage;

/**
 * カードがどこに出るかの見取り図。
 * 灰色が Google の中身、青がこのカード。上の帯は AI による概要のような全幅の枠。
 */
function Diagram({ placement }: { placement: Placement }) {
  const card =
    placement === "wide"
      ? { x: 121, y: 8, width: 36, height: 22 }
      : { x: 88, y: 36, width: 36, height: 30 };

  return (
    <svg
      className="diagram"
      viewBox="0 0 168 74"
      role="img"
      aria-label={t(placement === "wide" ? "placementWideAlt" : "placementResultsAlt")}
    >
      {/* 1 行目を全幅で占める枠。中身は左寄りで、右側が空く */}
      <rect className="d-block" x="8" y="8" width="149" height="22" rx="3" />
      <rect className="d-content" x="12" y="12" width="52" height="14" rx="2" />
      <rect className="d-content" x="68" y="12" width="45" height="14" rx="2" />
      {/* 2 行目: 検索結果 */}
      <rect className="d-content" x="8" y="36" width="72" height="30" rx="3" />
      {/* カード */}
      <rect
        className="d-card"
        x={card.x}
        y={card.y}
        width={card.width}
        height={card.height}
        rx="3"
      />
    </svg>
  );
}

interface Choice {
  value: Placement;
  title: string;
  detail: string;
}

const CHOICES: Choice[] = [
  { value: "results", title: t("placementResults"), detail: t("placementResultsDetail") },
  { value: "wide", title: t("placementWide"), detail: t("placementWideDetail") },
];

export function PlacementChoice({
  value,
  onChange,
}: {
  value: Placement;
  onChange: (next: Placement) => void;
}) {
  return (
    <fieldset className="choices">
      <legend className="sr-only">{t("optionsPlacementHeading")}</legend>
      {CHOICES.map((choice) => (
        <label className="choice" key={choice.value}>
          <input
            type="radio"
            name="placement"
            value={choice.value}
            checked={value === choice.value}
            onChange={() => onChange(choice.value)}
          />
          <Diagram placement={choice.value} />
          <span className="choice-text">
            <span className="choice-title">{choice.title}</span>
            <span className="choice-detail">{choice.detail}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
