"use client";
import { useEffect, useState } from "react";
import type { Realtime, RealtimeChannel, Message } from "ably";
import { useSite } from "@/lib/site-context";
import { backoffice } from "./client";
import { record } from "./types";
import type { DemoTicket } from "@/lib/demo-types";

let shared: { key: string; client: Promise<Realtime>; refs: number } | undefined;

function acquire(key: string) {
  if (!shared || shared.key !== key) {
    if (shared) void shared.client.then((client) => client.close()).catch(() => {});
    shared = {
      key, refs: 0,
      client: import("ably").then(({ Realtime }) => new Realtime({
        authUrl: "/api/backoffice/api/online/cashout/ably-token", authMethod: "GET",
      })),
    };
  }
  const entry = shared;
  entry.refs++;
  return { client: entry.client, release() {
    entry.refs--;
    if (!entry.refs) {
      void entry.client.then((client) => client.close()).catch(() => {});
      if (shared === entry) shared = undefined;
    }
  } };
}

export function useCashout(ticketId: string, opened: boolean, revision: number) {
  const { runtime, session, refresh } = useSite();
  const [offer, setOffer] = useState<DemoTicket["cashoutOffer"]>();
  const userId = session.user?.id;
  const siteId = runtime.tenant?.site_id;
  useEffect(() => {
    setOffer(undefined);
    if (runtime.mode !== "backoffice" || !opened || !runtime.features.cashout
      || session.user?.level !== "online" || !siteId || !userId) return;
    const controller = new AbortController();
    const connection = acquire(siteId + ":" + userId);
    let channel: RealtimeChannel | undefined;
    let heartbeat: ReturnType<typeof setTimeout>;
    let expiry: ReturnType<typeof setTimeout>;
    let stopped = false;
    function update(value: unknown, status: unknown) {
      clearTimeout(expiry);
      const amount = Number(value);
      if (status !== "available" || !Number.isFinite(amount) || amount <= 0) {
        setOffer(undefined);
        return;
      }
      setOffer({ amount, payload: { cashout_value: amount } });
      expiry = setTimeout(() => setOffer(undefined), 25000);
    }
    const receive = (message: Message) => {
      if (stopped) return;
      const data = record(message.data);
      if (String(data.ticket_id) !== ticketId) return;
      if (message.name === "cashout.confirmed") {
        stop();
        window.dispatchEvent(new Event("backoffice:bets-updated"));
        void refresh().catch(() => {});
      } else update(data.cashout_value, data.status);
    };
    function stop() {
      if (stopped) return;
      stopped = true;
      controller.abort();
      clearTimeout(heartbeat);
      clearTimeout(expiry);
      channel?.unsubscribe(receive);
      setOffer(undefined);
      connection.release();
    }
    async function renew() {
      try {
        const data = record(await backoffice("/api/online/cashout/keep-alive/" + encodeURIComponent(ticketId), {
          method: "POST", signal: controller.signal,
        }));
        if (stopped) return;
        if (data.renewed !== true) { stop(); return; }
        heartbeat = setTimeout(() => void renew(), 25000);
      } catch { stop(); }
    }
    void (async () => {
      const client = await connection.client;
      if (stopped) return;
      channel = client.channels.get("cashout:" + siteId + ":" + userId + ":" + ticketId);
      await channel.subscribe(["cashout.updated", "cashout.confirmed"], receive);
      if (stopped) { channel.unsubscribe(receive); return; }
      const data = record(await backoffice("/api/shared-ticket/" + encodeURIComponent(ticketId), {
        signal: controller.signal,
      }));
      if (stopped) return;
      if (data.cashout !== true) { stop(); return; }
      update(data.cashout_value, data.cashout_status);
      heartbeat = setTimeout(() => void renew(), 25000);
    })().catch(stop);
    return stop;
  }, [ticketId, opened, revision, runtime.mode, runtime.features.cashout, siteId, userId, session.user?.level]);
  return offer;
}
