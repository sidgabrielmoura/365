"use client";
import { useEffect, useState } from "react";
import { useSite } from "@/lib/site-context";
import { useResource } from "./use-resource";
import { searchEventsFromPanel } from "./public-adapters";
import type { SportsEvent } from "@/lib/sports-data";
export function useSearchSource(query: string) {
  const { runtime } = useSite();
  const trimmed = query.trim();
  const [value, setValue] = useState("");
  useEffect(() => { const timer = setTimeout(() => setValue(trimmed), 300); return () => clearTimeout(timer); }, [trimmed]);
  const remote = runtime.mode === "backoffice";
  const eligible = remote && runtime.features.search && trimmed.length >= 3;
  const ready = eligible && value === trimmed;
  const resource = useResource<unknown>(ready ? "/api/resources/search" : null,
    { method: "POST", body: ready ? { query: trimmed } : undefined });
  let events: SportsEvent[] = [];
  let error = resource.error;
  try { if (resource.data !== undefined) events = searchEventsFromPanel(resource.data); }
  catch (issue) { error = (issue as Error).message; }
  return { remote, events, loading: eligible && (value !== trimmed || resource.loading), error };
}
