"use client";
import { useMemo } from "react";
import { useSite } from "@/lib/site-context";
import { useResource } from "./use-resource";
import { eventFromPanel, gridFromPanel, publicRows } from "./public-adapters";
import { panelLeagueGroups, panelLeagues, sportsLeagueHref } from "./sports-leagues";
import type { SportsEvent } from "@/lib/sports-data";
export function useSportsSource(sport = "football", segment: string | null = "100001") {
  const { runtime, session } = useSite();
  const remote = runtime.mode === "backoffice";
  const sportId = runtime.sportIds[sport];
  const resource = useResource<unknown>(remote && sportId && segment
    ? "/api/backoffice/api/v3/" + (session.user ? "user" : "app") + "/grid-events/" +
      encodeURIComponent(segment) + "/" + encodeURIComponent(sportId) : null, { keepDataOnRetry: true });
  return useMemo(() => {
    let events: SportsEvent[] = [], error = resource.error;
    try { if (resource.data !== undefined) events = gridFromPanel(resource.data, sport); }
    catch (issue) { error = (issue as Error).message; }
    return { remote, events, error, loading: resource.loading, retry: resource.retry };
  }, [remote, resource.data, resource.error, resource.loading, resource.retry, sport]);
}
export function useFeaturedLeagues(sport = "football", enabled = true) {
  const { runtime } = useSite();
  const sportId = runtime.sportIds[sport];
  const resource = useResource<unknown>(runtime.mode === "backoffice" && sportId && enabled
    ? "/api/backoffice/api/main-leagues?sport_id=" + encodeURIComponent(sportId) : null);
  const leagues = useMemo(() => {
    try {
      return resource.data === undefined ? [] : panelLeagues(resource.data).map((league) =>
        ({ ...league, slug: league.id, href: sportsLeagueHref(sport, league.id) }));
    } catch { return []; }
  }, [resource.data, sport]);
  return { leagues, loading: resource.loading, error: resource.error };
}

export function useLeagueGroups(sport: string, enabled = true) {
  const { runtime } = useSite();
  const sportId = runtime.sportIds[sport];
  const resource = useResource<unknown>(runtime.mode === "backoffice" && sportId && enabled
    ? "/api/backoffice/api/leagues-default-grouped?sport_id=" + encodeURIComponent(sportId) : null);
  return useMemo(() => {
    let groups: ReturnType<typeof panelLeagueGroups> = [], error = resource.error;
    try { if (resource.data !== undefined) groups = panelLeagueGroups(resource.data); }
    catch (issue) { error = (issue as Error).message; }
    return { groups, error, loading: resource.loading };
  }, [resource.data, resource.error, resource.loading]);
}

export function useFeaturedEvents(kind: "events" | "boosted-events", enabled = true) {
  const { runtime, session } = useSite();
  const resource = useResource<unknown>(runtime.mode === "backoffice" && runtime.features.search && enabled
    ? "/api/backoffice/api/v1/featured/" + (session.user ? "user/" : "") + kind : null, { refreshMs: 60_000 });
  return useMemo(() => {
    let events: SportsEvent[] = [], error = resource.error;
    try { if (resource.data !== undefined) events = publicRows(resource.data).map((item) => eventFromPanel(item)); }
    catch (issue) { error = (issue as Error).message; }
    return { events, loading: resource.loading, error };
  }, [resource.data, resource.loading, resource.error]);
}
