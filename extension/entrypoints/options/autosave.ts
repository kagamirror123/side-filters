import { useCallback, useEffect, useRef, useState } from "react";
import type { Settings } from "@/lib/settings";

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface AutoSave {
  state: SaveState;
  /** 変更を積む。続けて変わったぶんはまとめて 1 回書く */
  push: (settings: Settings) => void;
  /** 失敗した保存をやり直す */
  retry: () => void;
}

/**
 * 変更をまとめて storage へ書く。1 文字ごとに storage.sync へ書くと書き込み回数の上限に当たる。
 * ただし「まとめている間に閉じられて最後の変更が消える」ことは許容しない:
 * unmount・pagehide・タブが隠れたときに、待っている保存を即時に流す。
 * 書き込みは失敗しうるので Promise の reject も握りつぶさず、成功するまで「保存しました」とは言わない
 */
export function useAutoSave(save: (settings: Settings) => Promise<void>, delay = 400): AutoSave {
  const [state, setState] = useState<SaveState>("idle");
  /** まだ書いていない最新の値 */
  const latest = useRef<Settings | null>(null);
  const unsaved = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  /** 変更の通し番号。書き終えた時点で新しい変更が来ていたら「保存しました」にしない */
  const revision = useRef(0);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    const settings = latest.current;
    if (!unsaved.current || settings === null) return;
    unsaved.current = false;
    const at = revision.current;
    setState("saving");
    void saveRef.current(settings).then(
      () => {
        if (at === revision.current) setState("saved");
      },
      () => {
        // 失敗した変更は捨てない。retry か次の flush で書き直す
        unsaved.current = true;
        if (at === revision.current) setState("error");
      },
    );
  }, []);

  const push = useCallback(
    (settings: Settings) => {
      latest.current = settings;
      unsaved.current = true;
      revision.current += 1;
      setState("saving");
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [delay, flush],
  );

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      flush();
    };
  }, [flush]);

  return { state, push, retry: flush };
}
