"use client";
import { useEffect, useState } from "react";
import { useSite } from "@/lib/site-context";
import { useResource } from "./use-resource";
import { searchEventsFromPanel } from "./public-adapters";
import { searchLeagueGroups } from "./sports-leagues";
import { useFeaturedLeagues, useLeagueGroups } from "./sports-source";
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

export function useLeagueSearch(query: string) {
  const { runtime } = useSite();
  const enabled = runtime.mode === "backoffice" && runtime.features.search && query.trim().length >= 3;
  const featured = useFeaturedLeagues("football", enabled);
  const directory = useLeagueGroups("football", enabled);
  const groups = [{ key: "featured", location: "", icon: "", leagues: featured.leagues }, ...directory.groups];
  return {
    leagues: searchLeagueGroups(query, groups).slice(0, 20),
    loading: featured.loading || directory.loading,
    error: featured.error && directory.error ? directory.error : "",
  };
}
