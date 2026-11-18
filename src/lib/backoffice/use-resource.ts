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
  const [generation, setGeneration] = useState(0);
  const [state, setState] = useState<{ data?: T; loading: boolean; error: string }>({ loading: Boolean(url), error: "" });
  const latest = useRef(url);
  latest.current = url;
  useEffect(() => {
    if (!url) { setState({ loading: false, error: "" }); return; }
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
        if (active && latest.current === url) setState({ data, loading: false, error: "" });
      } catch (error) {
        if (active && !controller.signal.aborted)
          setState({ loading: false, error: (error as Error).message });
      }
      if (active && options.refreshMs) timer = setTimeout(load, options.refreshMs);
    };
    setState({ loading: true, error: "" });
    void load();
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [url, method, body, generation, options.refreshMs]);
  return { ...state, retry: useCallback(() => setGeneration((old) => old + 1), []) };
}
