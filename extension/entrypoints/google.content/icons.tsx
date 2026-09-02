// Material Symbols（Apache 2.0）と、それに線の太さを合わせた自前のアイコン。
// Google のアイコンと同じ太さに見えるよう、24 のグリッドでは stroke 1.8 に揃えている。

export const GEAR = (
  <svg viewBox="0 -960 960 960" width="20" height="20" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"
    />
  </svg>
);

export const CLOCK = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 7.5V12l3 2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GLOBE = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <ellipse
      cx="12"
      cy="12"
      rx="3.6"
      ry="8.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path d="M3.5 12h17" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

/** 検索語のセクション。組版の T */
export const TEXT = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
    <path
      d="M5 7V5h14v2M12 5v14M9.5 19h5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** 除外チップを外す × */
export const X = (
  <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true" focusable="false">
    <path
      d="M6 6l12 12M18 6L6 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
  </svg>
);
