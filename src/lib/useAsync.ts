import { useCallback, useEffect, useState, type DependencyList } from "react";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error" };

/** Runs `load` when `deps` change; `reload` runs it again (e.g. from a "Try again" button). */
export const useAsync = <T,>(load: () => Promise<T>, deps: DependencyList) => {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setState({ status: "loading" });
    load().then(
      (data) => live && setState({ status: "ready", data }),
      () => live && setState({ status: "error" }),
    );
    return () => {
      live = false;
    };
    // `load` is recreated each render; `deps` decide when to re-run.
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);
  return { state, reload };
};
