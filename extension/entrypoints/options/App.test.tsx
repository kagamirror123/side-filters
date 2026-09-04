// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings, loadSettings, type Settings } from "@/lib/settings";
import { installI18n } from "@/testing/setup";
import { App } from "./App";

afterEach(cleanup);

beforeEach(() => {
  fakeBrowser.reset();
  vi.restoreAllMocks();
  installI18n();
});

function show(patch: Partial<Settings> = {}) {
  return render(<App initial={{ ...defaultSettings(), ...patch }} />);
}

/** storage への書き込み回数を数える */
function countWrites() {
  return vi.spyOn(fakeBrowser.storage.sync, "set");
}

/** ラベル欄。terms の 1 行目から順に並ぶ */
function labelInputs(): HTMLInputElement[] {
  return screen.getAllByLabelText("Label") as HTMLInputElement[];
}

const oneTerm: Partial<Settings> = {
  terms: [{ label: "Week", qdr: "w" }],
  langs: [{ label: "Japanese", lr: "lang_ja" }],
};

describe("自動保存", () => {
  it("入力のたびには書かず、まとめて 1 回だけ書く", async () => {
    const writes = countWrites();
    show(oneTerm);
    await userEvent.type(labelInputs()[0]!, "ly");

    // 打っている間はまだ書かない
    expect(writes).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe("Saving…");

    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Saved"));
    expect(writes).toHaveBeenCalledTimes(1);
    expect((await loadSettings()).terms[0]!.label).toBe("Weekly");
  });

  it("待っている間に閉じても、最後の変更を書いてから終わる", async () => {
    const writes = countWrites();
    const view = show(oneTerm);
    await userEvent.type(labelInputs()[0]!, "!");
    expect(writes).not.toHaveBeenCalled();

    view.unmount();
    await waitFor(() => expect(writes).toHaveBeenCalledTimes(1));
    expect((await loadSettings()).terms[0]!.label).toBe("Week!");
  });

  it("タブが隠れたときも、待っている変更をすぐ書く", async () => {
    const writes = countWrites();
    show(oneTerm);
    await userEvent.type(labelInputs()[0]!, "?");
    expect(writes).not.toHaveBeenCalled();

    window.dispatchEvent(new Event("pagehide"));
    await waitFor(() => expect(writes).toHaveBeenCalledTimes(1));
  });

  it("保存が失敗したら理由を出し、やり直せる", async () => {
    const writes = countWrites().mockRejectedValueOnce(new Error("QUOTA_BYTES_PER_ITEM"));
    show(oneTerm);
    await userEvent.type(labelInputs()[0]!, "x");

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Could not save");
    // 失敗したまま「保存しました」とは言わない
    expect(screen.getByRole("status").textContent).toBe("");

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Saved"));
    expect(writes).toHaveBeenCalledTimes(2);
    expect((await loadSettings()).terms[0]!.label).toBe("Weekx");
  });

  it("書き込みが終わるまで「保存しました」と言わない", async () => {
    let finish = () => {};
    const writes = countWrites().mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    show(oneTerm);
    await userEvent.type(labelInputs()[0]!, "x");

    // 書き込みは始まっているが、まだ終わっていない
    await waitFor(() => expect(writes).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("status").textContent).toBe("Saving…");

    finish();
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Saved"));
  });
});

describe("プリセットの編集", () => {
  it("最後の行を消すと空のまま保存され、既定は復活しない", async () => {
    show(oneTerm);
    await userEvent.click(screen.getByRole("button", { name: "Remove “Week”" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Saved"));
    expect((await loadSettings()).terms).toEqual([]);
    expect(screen.getByText(/No time presets/)).toBeTruthy();
  });

  it("削除ボタンの読み上げ名に、その行のラベルが入る", () => {
    show({
      terms: [
        { label: "Week", qdr: "w" },
        { label: "Month", qdr: "m" },
      ],
    });
    expect(screen.getByRole("button", { name: "Remove “Week”" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove “Month”" })).toBeTruthy();
  });

  it("ラベルが空の行は、入力欄とエラーを結び付けて示す", async () => {
    show(oneTerm);
    await userEvent.clear(labelInputs()[0]!);

    const input = labelInputs()[0]!;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const errorId = input.getAttribute("aria-describedby")!;
    expect(document.getElementById(errorId)?.textContent).toBe("Enter a label");

    // 落ちる行があるあいだは、ただ「保存しました」とは言わない
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Saved. Rows with errors were left out."),
    );
    expect((await loadSettings()).terms).toEqual([]);
  });

  it("同じ期間のプリセットは 2 つ持てないと示し、保存もしない", async () => {
    show({
      terms: [
        { label: "Week", qdr: "w" },
        { label: "Another week", qdr: "w" },
      ],
      langs: [],
    });
    const rows = screen.getAllByRole("listitem");
    const duplicate = within(rows[1]!).getByText("Another preset already uses this length");
    expect(duplicate).toBeTruthy();

    // 何か変えて保存させる
    await userEvent.type(labelInputs()[0]!, "!");
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Saved. Rows with errors were left out."),
    );
    expect((await loadSettings()).terms).toEqual([{ label: "Week!", qdr: "w" }]);
  });

  it("言語コードの形式違いと重複を分けて示す", async () => {
    show({
      terms: [],
      langs: [
        { label: "Japanese", lr: "lang_ja" },
        { label: "Duplicate", lr: "lang_ja" },
        { label: "Broken", lr: "ja" },
      ],
    });
    const rows = screen.getAllByRole("listitem");
    expect(within(rows[1]!).getByText("Another preset already uses this code")).toBeTruthy();
    expect(within(rows[2]!).getByText("Use a code like lang_ja")).toBeTruthy();
  });
});
