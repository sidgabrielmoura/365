"use client";
import { useEffect, useState } from "react";
import { useSite } from "@/lib/site-context";
import { useResource } from "./use-resource";
import { eventFromPanel, publicRows } from "./public-adapters";
import { record } from "./types";
import type { SportsEvent } from "@/lib/sports-data";
export function useSearchSource(query: string) {
  const { runtime } = useSite();
  const [value, setValue] = useState("");
  useEffect(() => { const timer = setTimeout(() => setValue(query.trim()), 300); return () => clearTimeout(timer); }, [query]);
  const resource = useResource<unknown>(runtime.mode === "backoffice" && runtime.features.search && value.length >= 3
    ? "/api/resources/search" : null, { method: "POST", body: { query: value } });
  let events: SportsEvent[] = [];
  try { if (resource.data !== undefined && value === query.trim()) events = publicRows(resource.data).map((item) => {
    const row = record(item);
    const logo = (value: unknown) => typeof value === "string" && /^[a-z0-9_.-]+$/i.test(value) && value !== "no-flag.png"
      ? "https://d1wdv02om1ylps.cloudfront.net/flags/medium/" + value : "";
    return eventFromPanel({ ...row, home_img: logo(row.home_img), away_img: logo(row.away_img),
      datetime_iso: typeof row.date === "string" ? row.date.replace(" ", "T") + "-03:00" : "" });
  }); } catch {}
  return { remote: runtime.mode === "backoffice", events, loading: value !== query.trim() || resource.loading, error: resource.error };
}
