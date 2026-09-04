import { describe, expect, it } from "vitest";
import {
  addExclusion,
  checkExclusion,
  canPhrase,
  phraseAvailability,
  getExclusions,
  isBalanced,
  isPhrase,
  removeExclusion,
  setPhrase,
  tokenize,
} from "./query";

describe("tokenize", () => {
  it("空白で区切る", () => {
    expect(tokenize("java tutorial").map((t) => t.raw)).toEqual(["java", "tutorial"]);
  });
  it("引用符の中の空白では区切らない", () => {
    expect(tokenize('java "machine learning" x').map((t) => t.raw)).toEqual([
      "java",
      '"machine learning"',
      "x",
    ]);
  });
  it("先頭の - を除外として読む", () => {
    const tokens = tokenize('java -js -"machine learning"');
    expect(tokens.map((t) => t.negated)).toEqual([false, true, true]);
    expect(tokens.map((t) => t.value)).toEqual(["java", "js", '"machine learning"']);
  });
  it("- だけのトークンは除外にしない", () => {
    expect(tokenize("a - b").map((t) => t.negated)).toEqual([false, false, false]);
  });
  it("連続した空白や前後の空白を落とす", () => {
    expect(tokenize("  a   b  ").map((t) => t.raw)).toEqual(["a", "b"]);
  });
  it("空文字はトークンなし", () => {
    expect(tokenize("")).toEqual([]);
  });
});

describe("isBalanced", () => {
  it("引用符が偶数なら true", () => {
    expect(isBalanced('a "b c" d')).toBe(true);
    expect(isBalanced("a b")).toBe(true);
  });
  it("閉じていなければ false", () => {
    expect(isBalanced('a "b c')).toBe(false);
  });
});

describe("getExclusions", () => {
  it("除外トークンの本体を返す", () => {
    expect(getExclusions('java -js -"machine learning"')).toEqual(["js", '"machine learning"']);
  });
  it("除外が無ければ空", () => {
    expect(getExclusions("java tutorial")).toEqual([]);
  });
  it("本人が打った -foo も同じように拾う", () => {
    expect(getExclusions("-foo")).toEqual(["foo"]);
  });
});

describe("addExclusion", () => {
  it("末尾に足す", () => {
    expect(addExclusion("java tutorial", "js")).toBe("java tutorial -js");
  });
  it("空白を含む語は引用符で囲む", () => {
    expect(addExclusion("java", "machine learning")).toBe('java -"machine learning"');
  });
  it("引用符を含む入力は受け付けない（壊れた query を作らない）", () => {
    expect(addExclusion("java", '"machine learning"')).toBe("java");
    expect(addExclusion("java", 'foo "bar"')).toBe("java");
  });
  it("打たれた - は落とす", () => {
    expect(addExclusion("java", "-js")).toBe("java -js");
  });
  it("同じものは二重に足さない", () => {
    expect(addExclusion("java -js", "js")).toBe("java -js");
  });
  it("空白だけ・- だけなら何もしない", () => {
    expect(addExclusion("java", "   ")).toBe("java");
    expect(addExclusion("java", "-")).toBe("java");
  });
});

describe("checkExclusion", () => {
  it("受け付けられるなら null", () => {
    expect(checkExclusion("java", "js")).toBeNull();
    expect(checkExclusion("java", "machine learning")).toBeNull();
    expect(checkExclusion("java", "-js")).toBeNull();
  });
  it("空は empty", () => {
    expect(checkExclusion("java", "")).toBe("empty");
    expect(checkExclusion("java", "   ")).toBe("empty");
    expect(checkExclusion("java", "-")).toBe("empty");
  });
  it("引用符は quote", () => {
    expect(checkExclusion("java", '"machine learning"')).toBe("quote");
    expect(checkExclusion("java", 'foo "bar"')).toBe("quote");
  });
  it("すでに除外していれば duplicate", () => {
    expect(checkExclusion("java -js", "js")).toBe("duplicate");
    expect(checkExclusion('java -"machine learning"', "machine learning")).toBe("duplicate");
  });
});

describe("removeExclusion", () => {
  it("その除外だけ消す", () => {
    expect(removeExclusion('java -js -"machine learning"', "js")).toBe('java -"machine learning"');
  });
  it("引用句の除外も消せる", () => {
    expect(removeExclusion('java -js -"machine learning"', '"machine learning"')).toBe("java -js");
  });
  it("普通の語は消さない", () => {
    expect(removeExclusion("java -js", "java")).toBe("java -js");
  });
});

describe("canPhrase", () => {
  it("2 語以上なら囲める", () => {
    expect(canPhrase("java tutorial")).toBe(true);
  });
  it("1 語だけなら使えない（完全一致とほぼ同じになるため）", () => {
    expect(canPhrase("java")).toBe(false);
    expect(phraseAvailability("java")).toBe("single");
    expect(phraseAvailability("java -js")).toBe("single");
  });
  it("使えない理由を返す", () => {
    expect(phraseAvailability("java tutorial")).toBe("ok");
    expect(phraseAvailability('"java tutorial"')).toBe("ok");
    expect(phraseAvailability("java site:example.com")).toBe("unsupported");
    expect(phraseAvailability('java "x')).toBe("unsupported");
    expect(phraseAvailability("-js")).toBe("unsupported");
  });
  it("除外があっても、囲むのは残りなので囲める", () => {
    expect(canPhrase("java tutorial -js")).toBe(true);
  });
  it("すでに囲まれていれば（外すために）触れる", () => {
    expect(canPhrase('"java tutorial"')).toBe(true);
    expect(canPhrase('"java tutorial" -js')).toBe(true);
  });
  it("演算子・グループ化・引用符の混在には触らない", () => {
    expect(canPhrase("java site:example.com")).toBe(false);
    expect(canPhrase("java OR python")).toBe(false);
    expect(canPhrase("java | python")).toBe(false);
    expect(canPhrase("(java OR python) web")).toBe(false);
    expect(canPhrase('java "machine learning"')).toBe(false);
  });
  it("引用符が閉じていなければ触らない", () => {
    expect(canPhrase('java "tutorial')).toBe(false);
  });
  it("除外しかない検索語には触らない", () => {
    expect(canPhrase("-js")).toBe(false);
  });
});

describe("isPhrase / setPhrase", () => {
  it("囲む", () => {
    expect(setPhrase("java tutorial", true)).toBe('"java tutorial"');
    expect(isPhrase('"java tutorial"')).toBe(true);
  });
  it("1 語のときは囲まない", () => {
    expect(setPhrase("java", true)).toBe("java");
  });
  it("外す", () => {
    expect(setPhrase('"java tutorial"', false)).toBe("java tutorial");
    expect(isPhrase("java tutorial")).toBe(false);
  });
  it("除外は囲みの外に残る", () => {
    expect(setPhrase('java tutorial -js -"a b"', true)).toBe('"java tutorial" -js -"a b"');
    expect(setPhrase('"java tutorial" -js', false)).toBe("java tutorial -js");
    expect(isPhrase('"java tutorial" -js')).toBe(true);
  });
  it("往復して元に戻る", () => {
    for (const q of ["java tutorial", "java tutorial -js"]) {
      expect(setPhrase(setPhrase(q, true), false)).toBe(q);
    }
  });
  it("すでにその状態なら何もしない", () => {
    expect(setPhrase('"java tutorial"', true)).toBe('"java tutorial"');
    expect(setPhrase("java tutorial", false)).toBe("java tutorial");
  });
  it("1 語を囲んだ状態からは外せる", () => {
    expect(setPhrase('"java"', false)).toBe("java");
  });
  it("触れない検索語は変えない", () => {
    for (const q of ["java site:example.com", 'java "machine learning"', 'java "x']) {
      expect(setPhrase(q, true)).toBe(q);
    }
  });
});
