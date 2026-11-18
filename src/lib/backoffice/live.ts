"use client";
import { io, type Socket } from "socket.io-client";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { record, type SiteRuntime } from "./types";
import { useSite } from "@/lib/site-context";
import { useResource } from "./use-resource";
import { liveEventFromPanel, liveEventsFromPanel } from "./live-markets";
import type { SportsEvent } from "@/lib/sports-data";

const DISCONNECTED = "A conexão ao vivo está indisponível.";
const SETTINGS_PATH = "/api/backoffice/api/live-settings";
let shared: { socket: Socket; key: string; refs: number } | undefined;
const eventRooms = new WeakMap<Socket, Map<string, { refs: number; data?: unknown; at?: number }>>();

function acquire(runtime: SiteRuntime) {
  const key = runtime.tenant?.site_id + "|" + runtime.live.url + "|" + runtime.live.path;
  if (!shared || shared.key !== key) {
    shared?.socket.close();
    shared = { socket: io(runtime.live.url, { path: runtime.live.path, autoConnect: false }), key, refs: 0 };
  }
  shared.refs++;
  const instance = shared;
  return { socket: instance.socket, release: () => {
    instance.refs--;
    if (instance.refs === 0) {
      instance.socket.close();
      if (shared === instance) shared = undefined;
    }
  } };
}

function watchEvent(socket: Socket, matchId: string, update: (value: unknown) => void, waiting: () => void) {
  let rooms = eventRooms.get(socket);
  if (!rooms) {
    rooms = new Map();
    eventRooms.set(socket, rooms);
    const joinedRooms = rooms;
    socket.on("connect", () => {
      for (const id of joinedRooms.keys()) socket.emit("join:event", { matchId: Number(id), locale: "pt-BR" });
    });
    socket.on("disconnect", () => {
      for (const room of joinedRooms.values()) { room.data = undefined; room.at = undefined; }
    });
  }
  const activeRooms = rooms;
  const room = { matchId: Number(matchId), locale: "pt-BR" };
  const entry = activeRooms.get(matchId) ?? { refs: 0 };
  const receive = (value: unknown) => {
    if (String(record(value).match_id) !== matchId) return;
    entry.data = value;
    entry.at = Date.now();
    update(value);
  };
  socket.on("event:update", receive);
  socket.on("connect", waiting);
  activeRooms.set(matchId, entry);
  if (socket.connected) {
    if (!entry.refs) socket.emit("join:event", room);
    else if (entry.at !== undefined && Date.now() - entry.at < 6000) update(entry.data);
  }
  entry.refs++;
  return () => {
    socket.off("event:update", receive);
    socket.off("connect", waiting);
    entry.refs--;
    if (entry.refs === 0) {
      activeRooms.delete(matchId);
      if (socket.connected) socket.emit("leave:event", room);
    }
  };
}

export function useLiveGrid() {
  const { runtime } = useSite();
  const enabled = runtime.mode === "backoffice" && runtime.live.enabled;
  const settings = useResource<unknown>(enabled ? SETTINGS_PATH : null);
  const [state, setState] = useState<{ data?: unknown; count?: number; error: string }>({ error: "" });
  useEffect(() => {
    if (!enabled) return;
    const { socket, release } = acquire(runtime);
    setState({ error: "" });
    const join = () => {
      setState({ error: "" });
      socket.emit("join:grid", { locale: "pt-BR" });
    };
    const update = (data: unknown) => setState((old) => ({ ...old, data, error: "" }));
    const count = (data: unknown) => {
      const value = Number(record(data).count ?? record(data).total ?? data);
      if (Number.isSafeInteger(value) && value >= 0) setState((old) => ({ ...old, count: value }));
    };
    const disconnect = () => setState({ error: DISCONNECTED });
    socket.on("connect", join);
    socket.on("grid:update", update);
    socket.on("grid:count:update", count);
    socket.on("disconnect", disconnect);
    socket.on("connect_error", disconnect);
    if (socket.connected) join(); else socket.connect();
    return () => {
      if (socket.connected) socket.emit("leave:grid");
      socket.off("connect", join);
      socket.off("grid:update", update);
      socket.off("grid:count:update", count);
      socket.off("disconnect", disconnect);
      socket.off("connect_error", disconnect);
      release();
    };
  }, [runtime.live.url, runtime.live.path, enabled, runtime.tenant?.site_id]);

  const grid = useMemo(() => {
    let events: SportsEvent[] = [], parseError = "";
    try {
      if (enabled && state.data && settings.data) events = liveEventsFromPanel(state.data, settings.data);
    } catch (error) { parseError = (error as Error).message; }
    return { events, parseError };
  }, [enabled, state.data, settings.data]);
  const error = state.error || settings.error || grid.parseError;
  return { events: grid.events, settings, loading: enabled && !error && (!state.data || settings.loading),
    error, count: state.count ?? grid.events.length };
}

export function useLiveEvent(matchId?: string, gridSettings?: ReturnType<typeof useLiveGrid>["settings"]) {
  const { runtime } = useSite();
  const enabled = runtime.mode === "backoffice" && runtime.live.enabled && !!matchId;
  const ownSettings = useResource<unknown>(enabled && !gridSettings ? SETTINGS_PATH : null);
  const settings = gridSettings ?? ownSettings;
  const [state, setState] = useState<{ id: string; data?: unknown; error: string }>();
  useEffect(() => {
    if (!enabled || !matchId) return;
    const { socket, release } = acquire(runtime);
    let timeout: ReturnType<typeof setTimeout>;
    const join = () => {
      clearTimeout(timeout);
      setState({ id: matchId, error: "" });
      timeout = setTimeout(() => setState({ id: matchId, error: "O jogo ao vivo está indisponível." }), 10000);
    };
    const update = (data: unknown) => {
      clearTimeout(timeout);
      setState({ id: matchId, data, error: "" });
    };
    const disconnect = () => {
      clearTimeout(timeout);
      setState({ id: matchId, error: DISCONNECTED });
    };
    join();
    const unwatch = watchEvent(socket, matchId, update, join);
    socket.on("disconnect", disconnect);
    socket.on("connect_error", disconnect);
    if (!socket.connected) socket.connect();
    return () => {
      clearTimeout(timeout);
      unwatch();
      socket.off("disconnect", disconnect);
      socket.off("connect_error", disconnect);
      release();
    };
  }, [runtime.live.url, runtime.live.path, enabled, runtime.tenant?.site_id, matchId]);

  const data = enabled && state?.id === matchId ? state?.data : undefined;
  const error = (state?.id === matchId ? state?.error : "") || settings.error;
  return {
    event: data && settings.data ? liveEventFromPanel(data, settings.data) : undefined,
    stats: record(record(data).stats), timeline: record(data).timeline,
    loading: enabled && !error && (!data || settings.loading), error,
  };
}

export function useLiveSlipPrices() {
  const { runtime, picks, updateLivePicks } = useSite();
  const matchIds = [...new Set(picks.filter((pick) => pick.betType === "live").map((pick) => pick.eventId))].sort().join(",");
  const enabled = runtime.mode === "backoffice" && runtime.live.enabled && !!matchIds;
  const rules = useResource<unknown>(enabled ? SETTINGS_PATH : null);
  const ruleData = rules.data;
  const apply = useEffectEvent((id: string, event?: SportsEvent) => updateLivePicks(id, event));
  useEffect(() => {
    if (!matchIds || runtime.mode !== "backoffice") return;
    const ids = matchIds.split(",");
    if (!enabled || !ruleData) {
      ids.forEach((id) => apply(id));
      return;
    }
    const { socket, release } = acquire(runtime);
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const clear = (id: string) => clearTimeout(timers.get(id));
    const waitForNext = (id: string, event?: SportsEvent) => {
      clear(id);
      apply(id, event);
      timers.set(id, setTimeout(() => apply(id), 15_000));
    };
    const unwatch = ids.map((id) => {
      apply(id);
      return watchEvent(socket, id, (value) => waitForNext(id, liveEventFromPanel(value, ruleData)),
        () => waitForNext(id));
    });
    const disconnect = () => ids.forEach((id) => { clear(id); apply(id); });
    socket.on("disconnect", disconnect);
    socket.on("connect_error", disconnect);
    if (!socket.connected) socket.connect();
    return () => {
      ids.forEach(clear);
      unwatch.forEach((close) => close());
      socket.off("disconnect", disconnect);
      socket.off("connect_error", disconnect);
      release();
    };
  }, [enabled, matchIds, ruleData, runtime.mode, runtime.live.url, runtime.live.path, runtime.tenant?.site_id]);
}
