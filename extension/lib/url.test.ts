import { describe, expect, it } from "vitest";
import {
  formatQdr,
  getLr,
  getQdr,
  getQuery,
  hasTbsFlag,
  isFilterablePage,
  isNewsPage,
  isValidQdr,
  parseQdr,
  withLr,
  withQdr,
  withQuery,
  withTbsFlag,
} from "./url";

const BASE = "https://www.google.com/search?q=typescript&hl=ja&sca_esv=abc";

function params(url: string): Record<string, string> {
  return Object.fromEntries(new URL(url).searchParams);
}

describe("isValidQdr", () => {
  it("単位と任意の倍数を許す", () => {
    for (const v of ["h", "d", "w", "m", "y", "d3", "m6", "y3", "h12"])
      expect(isValidQdr(v)).toBe(true);
  });
  it("それ以外は弾く", () => {
    for (const v of ["", "x", "3d", "d-1", "dd", "d 3", "cdr:1"]) expect(isValidQdr(v)).toBe(false);
  });
});

describe("getQdr", () => {
  it("tbs が無ければ null", () => {
    expect(getQdr(BASE)).toBeNull();
  });
  it("qdr を取り出す", () => {
    expect(getQdr(`${BASE}&tbs=qdr:w`)).toBe("w");
    expect(getQdr(`${BASE}&tbs=qdr:m6`)).toBe("m6");
  });
  it("他の tbs 部分に混ざっていても取り出す", () => {
    expect(getQdr(`${BASE}&tbs=sbd:1,qdr:d`)).toBe("d");
    expect(getQdr(`${BASE}&tbs=qdr:y,li:1`)).toBe("y");
  });
  it("カスタム期間（cdr）は null", () => {
    expect(getQdr(`${BASE}&tbs=cdr:1,cd_min:1/1/2024,cd_max:12/31/2024`)).toBeNull();
  });
});

describe("getLr", () => {
  it("無ければ null、空文字も null", () => {
    expect(getLr(BASE)).toBeNull();
    expect(getLr(`${BASE}&lr=`)).toBeNull();
  });
  it("値を返す", () => {
    expect(getLr(`${BASE}&lr=lang_ja`)).toBe("lang_ja");
  });
});

describe("withQdr", () => {
  it("tbs が無ければ足す。他のパラメータは維持する", () => {
    const out = withQdr(BASE, "w");
    expect(params(out)).toEqual({ q: "typescript", hl: "ja", sca_esv: "abc", tbs: "qdr:w" });
  });
  it("既存の qdr を差し替える", () => {
    expect(params(withQdr(`${BASE}&tbs=qdr:d`, "y")).tbs).toBe("qdr:y");
  });
  it("sbd などの他の tbs 部分は維持する", () => {
    expect(params(withQdr(`${BASE}&tbs=sbd:1,qdr:d`, "m")).tbs).toBe("qdr:m,sbd:1");
    expect(params(withQdr(`${BASE}&tbs=li:1`, "h")).tbs).toBe("qdr:h,li:1");
  });
  it("カスタム期間（cdr）は qdr と排他なので消す", () => {
    const out = withQdr(`${BASE}&tbs=cdr:1,cd_min:1/1/2024,cd_max:12/31/2024,sbd:1`, "w");
    expect(params(out).tbs).toBe("qdr:w,sbd:1");
  });
  it("null で解除。tbs が空になれば param ごと消す", () => {
    expect(params(withQdr(`${BASE}&tbs=qdr:w`, null))).not.toHaveProperty("tbs");
    expect(params(withQdr(`${BASE}&tbs=qdr:w,sbd:1`, null)).tbs).toBe("sbd:1");
    expect(params(withQdr(BASE, null))).toEqual(params(BASE));
  });
  it("start（ページ番号）は落とす", () => {
    expect(params(withQdr(`${BASE}&start=20`, "w"))).not.toHaveProperty("start");
    expect(params(withQdr(`${BASE}&start=20&tbs=qdr:w`, null))).not.toHaveProperty("start");
  });
  it("パス・ホスト・ハッシュは変えない", () => {
    const out = new URL(withQdr(`${BASE}#top`, "w"));
    expect(out.origin + out.pathname).toBe("https://www.google.com/search");
    expect(out.hash).toBe("#top");
  });
});

describe("withLr", () => {
  it("足す・差し替える・消す", () => {
    expect(params(withLr(BASE, "lang_ja")).lr).toBe("lang_ja");
    expect(params(withLr(`${BASE}&lr=lang_ja`, "lang_en")).lr).toBe("lang_en");
    expect(params(withLr(`${BASE}&lr=lang_ja`, null))).not.toHaveProperty("lr");
  });
  it("tbs と start 以外は維持し、start は落とす", () => {
    const out = params(withLr(`${BASE}&tbs=qdr:w&start=10`, "lang_en"));
    expect(out).toEqual({ q: "typescript", hl: "ja", sca_esv: "abc", tbs: "qdr:w", lr: "lang_en" });
  });
});

describe("isFilterablePage", () => {
  it("すべて・ニュース・動画には出す", () => {
    expect(isFilterablePage(BASE)).toBe(true);
    expect(isFilterablePage(`${BASE}&tbm=nws`)).toBe(true);
    expect(isFilterablePage(`${BASE}&tbm=vid`)).toBe(true);
    expect(isFilterablePage(`${BASE}&udm=14`)).toBe(true);
    expect(isFilterablePage(`${BASE}&udm=12`)).toBe(true);
    expect(isFilterablePage(`${BASE}&udm=7`)).toBe(true);
  });
  it("画像・ショッピング・地図・AI モードには出さない", () => {
    expect(isFilterablePage(`${BASE}&tbm=isch`)).toBe(false);
    expect(isFilterablePage(`${BASE}&tbm=shop`)).toBe(false);
    expect(isFilterablePage(`${BASE}&udm=2`)).toBe(false);
    expect(isFilterablePage(`${BASE}&udm=50`)).toBe(false);
  });
  it("/search 以外には出さない", () => {
    expect(isFilterablePage("https://www.google.com/maps?q=tokyo")).toBe(false);
    expect(isFilterablePage("https://www.google.com/")).toBe(false);
  });
});

describe("parseQdr / formatQdr", () => {
  it("倍数なしは count=1", () => {
    expect(parseQdr("d")).toEqual({ unit: "d", count: 1 });
    expect(parseQdr("y")).toEqual({ unit: "y", count: 1 });
  });
  it("倍数つきを分ける", () => {
    expect(parseQdr("m6")).toEqual({ unit: "m", count: 6 });
    expect(parseQdr("h12")).toEqual({ unit: "h", count: 12 });
  });
  it("読めない値は null", () => {
    for (const v of ["", "x", "3d", "d0", "dd", "m-1"]) expect(parseQdr(v)).toBeNull();
  });
  it("組み立てと往復する", () => {
    for (const qdr of ["h", "d", "w", "m", "y", "d3", "m6", "y3", "h12"]) {
      expect(formatQdr(parseQdr(qdr)!)).toBe(qdr);
    }
  });
  it("count=1 のとき数字を付けない", () => {
    expect(formatQdr({ unit: "m", count: 1 })).toBe("m");
    expect(formatQdr({ unit: "m", count: 6 })).toBe("m6");
  });
});

describe("getQuery / withQuery", () => {
  it("検索語を読み書きする", () => {
    expect(getQuery(BASE)).toBe("typescript");
    expect(params(withQuery(BASE, "java -js")).q).toBe("java -js");
  });
  it("q が無ければ空文字", () => {
    expect(getQuery("https://www.google.com/search")).toBe("");
  });
  it("他のパラメータは維持し、start は落とす", () => {
    const out = params(withQuery(`${BASE}&tbs=qdr:w&start=10`, "java"));
    expect(out).toEqual({ q: "java", hl: "ja", sca_esv: "abc", tbs: "qdr:w" });
  });
});

describe("hasTbsFlag / withTbsFlag", () => {
  it("立っているかを見る", () => {
    expect(hasTbsFlag(BASE, "sbd")).toBe(false);
    expect(hasTbsFlag(`${BASE}&tbs=sbd:1`, "sbd")).toBe(true);
    expect(hasTbsFlag(`${BASE}&tbs=qdr:w,sbd:1`, "sbd")).toBe(true);
    expect(hasTbsFlag(`${BASE}&tbs=qdr:w`, "sbd")).toBe(false);
  });
  it("立てる・下ろす。qdr は残す", () => {
    expect(params(withTbsFlag(`${BASE}&tbs=qdr:w`, "sbd", true)).tbs).toBe("qdr:w,sbd:1");
    expect(params(withTbsFlag(`${BASE}&tbs=qdr:w,sbd:1`, "sbd", false)).tbs).toBe("qdr:w");
    expect(params(withTbsFlag(`${BASE}&tbs=qdr:w,sbd:1`, "li", true)).tbs).toBe("qdr:w,sbd:1,li:1");
  });
  it("空になれば tbs ごと消す", () => {
    expect(params(withTbsFlag(`${BASE}&tbs=sbd:1`, "sbd", false))).not.toHaveProperty("tbs");
  });
  it("二重に立てない", () => {
    expect(params(withTbsFlag(`${BASE}&tbs=sbd:1`, "sbd", true)).tbs).toBe("sbd:1");
  });
  it("qdr の差し替えはフラグを壊さない", () => {
    expect(params(withQdr(`${BASE}&tbs=sbd:1,li:1`, "m")).tbs).toBe("qdr:m,sbd:1,li:1");
  });
});

describe("isNewsPage", () => {
  it("ニュースなら true", () => {
    expect(isNewsPage(`${BASE}&tbm=nws`)).toBe(true);
    expect(isNewsPage(`${BASE}&udm=12`)).toBe(true);
  });
  it("それ以外は false", () => {
    expect(isNewsPage(BASE)).toBe(false);
    expect(isNewsPage(`${BASE}&tbm=vid`)).toBe(false);
    expect(isNewsPage(`${BASE}&udm=7`)).toBe(false);
    expect(isNewsPage(`${BASE}&udm=14`)).toBe(false);
  });
});
