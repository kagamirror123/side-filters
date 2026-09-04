// 検索語（q）の読み書き。チップの状態は保存せず、毎回ここで q から導出する。
// そうすれば「拡張が足したのか本人が打ったのか」を覚える必要がない（docs/DESIGN.md）。

export interface Token {
  /** 元の文字列そのまま。組み立て直しに使う */
  raw: string;
  /** 先頭の - を除いた本体。引用符は付いたまま */
  value: string;
  /** -word や -"a b" の形か */
  negated: boolean;
}

function toToken(raw: string): Token {
  const negated = raw.length > 1 && raw.startsWith("-");
  return { raw, value: negated ? raw.slice(1) : raw, negated };
}

/** 引用符の中の空白では区切らずに、検索語をトークンへ分ける */
export function tokenize(query: string): Token[] {
  const tokens: Token[] = [];
  let current = "";
  let quoted = false;

  for (const char of query) {
    if (char === '"') {
      quoted = !quoted;
      current += char;
      continue;
    }
    if (!quoted && /\s/.test(char)) {
      if (current !== "") {
        tokens.push(toToken(current));
        current = "";
      }
      continue;
    }
    current += char;
  }
  if (current !== "") tokens.push(toToken(current));
  return tokens;
}

/** 引用符が閉じているか。閉じていない検索語には触らない */
export function isBalanced(query: string): boolean {
  let count = 0;
  for (const char of query) if (char === '"') count += 1;
  return count % 2 === 0;
}

function build(tokens: Token[]): string {
  return tokens.map((token) => token.raw).join(" ");
}

function isQuoted(value: string): boolean {
  return value.length >= 2 && value.startsWith('"') && value.endsWith('"');
}

/**
 * 打たれた語を除外トークンの本体に整える。空白を含めば引用符で囲む。
 * 引用符そのものを含む入力は受け付けない。`foo "bar"` を素直に囲むと `-"foo "bar""` という
 * 壊れた query になるため。空白入りの語は自分で囲むので、利用者が引用符を打つ必要はない
 */
function normalizeWord(word: string): string | null {
  const text = stripLeadingMinus(word);
  if (text === "" || text.includes('"')) return null;
  return /\s/.test(text) ? `"${text}"` : text;
}

function stripLeadingMinus(word: string): string {
  let text = word.trim();
  while (text.startsWith("-")) text = text.slice(1).trim();
  return text;
}

/** 除外語として受け付けられない理由。受け付けられるなら null */
export type ExclusionProblem = "empty" | "quote" | "duplicate";

export function checkExclusion(query: string, word: string): ExclusionProblem | null {
  const text = stripLeadingMinus(word);
  if (text === "") return "empty";
  if (text.includes('"')) return "quote";
  const value = normalizeWord(word);
  if (value === null) return "empty";
  return getExclusions(query).includes(value) ? "duplicate" : null;
}

/** いま除外されている語。本人が手で打った -foo もここに出る */
export function getExclusions(query: string): string[] {
  return tokenize(query)
    .filter((token) => token.negated)
    .map((token) => token.value);
}

/** 末尾に -語 を足す。すでに同じものがあれば何もしない */
export function addExclusion(query: string, word: string): string {
  const value = normalizeWord(word);
  if (value === null) return query;
  if (getExclusions(query).includes(value)) return query;
  const tokens = tokenize(query);
  tokens.push(toToken(`-${value}`));
  return build(tokens);
}

/** その除外トークンだけを消す */
export function removeExclusion(query: string, value: string): string {
  return build(tokenize(query).filter((token) => !(token.negated && token.value === value)));
}

/**
 * フレーズを使えるか、使えないならなぜか。
 * - single: 1 語だけ。囲んでも「完全一致」とほぼ同じことしかせず、控えが重複する
 * - unsupported: 演算子・グループ化・既存の引用符があり、囲み方が一通りに決まらない
 */
export type PhraseAvailability = "ok" | "single" | "unsupported";

export function phraseAvailability(query: string): PhraseAvailability {
  if (!isBalanced(query)) return "unsupported";
  const positives = tokenize(query).filter((token) => !token.negated);
  if (positives.length === 0) return "unsupported";
  // すでに囲まれていれば、外すために触れる必要がある
  if (positives.length === 1 && isQuoted(positives[0]!.value)) return "ok";
  const clean = positives.every(
    (token) =>
      !token.value.includes('"') &&
      !token.value.includes(":") &&
      !/[()]/.test(token.value) &&
      token.value !== "OR" &&
      token.value !== "|",
  );
  if (!clean) return "unsupported";
  return positives.length === 1 ? "single" : "ok";
}

export function canPhrase(query: string): boolean {
  return phraseAvailability(query) === "ok";
}

/** 除外を除いた部分がひとつの引用句になっているか */
export function isPhrase(query: string): boolean {
  const positives = tokenize(query).filter((token) => !token.negated);
  return positives.length === 1 && isQuoted(positives[0]!.value);
}

/**
 * 検索語の「除外でない部分」だけを引用符で囲む / 外す。
 * 除外は囲みの外に残すので、除外とフレーズは同時に使える。
 */
export function setPhrase(query: string, on: boolean): string {
  if (!canPhrase(query)) return query;
  const tokens = tokenize(query);
  const positives = tokens.filter((token) => !token.negated);
  const negatives = tokens.filter((token) => token.negated);
  if (on === isPhrase(query)) return query;

  const phrase = on
    ? `"${positives.map((token) => token.value).join(" ")}"`
    : positives[0]!.value.slice(1, -1);

  return build([toToken(phrase), ...negatives]);
}
