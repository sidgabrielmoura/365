"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { siteFetch } from "./client";

/** Per-view request state only; no persistent response cache. */
export function useResource<T>(
  url: string | null,
  options: { method?: string; body?: unknown; refreshMs?: number } = {},
) {
  const body = options.body === undefined ? undefined : JSON.stringify(options.body);
  const method = options.method || "GET";
  const requestKey = JSON.stringify([url, method, body]);
  const [generation, setGeneration] = useState(0);
  const [state, setState] = useState<{ key: string; data?: T; loading: boolean; error: string }>({
    key: requestKey, loading: Boolean(url), error: "",
  });
  const latest = useRef(requestKey);
  latest.current = requestKey;
  useEffect(() => {
    setState({ key: requestKey, loading: Boolean(url), error: "" });
    if (!url) return;
    let active = true;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      if (!active) return;
      setState((old) => ({ ...old, loading: old.data === undefined, error: "" }));
      try {
        const data = await siteFetch<T>(url, {
          method, body: body === undefined ? undefined : JSON.parse(body), signal: controller.signal,
        });
        if (active && latest.current === requestKey)
          setState({ key: requestKey, data, loading: false, error: "" });
      } catch (error) {
        if (active && latest.current === requestKey && !controller.signal.aborted)
          setState({ key: requestKey, loading: false, error: (error as Error).message });
      }
      if (active && options.refreshMs) timer = setTimeout(load, options.refreshMs);
    };
    void load();
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [url, method, body, requestKey, generation, options.refreshMs]);
  const current = state.key === requestKey ? state : { data: undefined, loading: Boolean(url), error: "" };
  return { data: current.data, loading: current.loading, error: current.error,
    retry: useCallback(() => setGeneration((old) => old + 1), []) };
}
