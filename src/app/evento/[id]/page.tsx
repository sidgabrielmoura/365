import { notFound } from "next/navigation";
import { eventById } from "@/lib/sports-data";
import { EventDetail } from "@/components/sports/event-detail";
import { integrationMode } from "@/server/backoffice/config";
import { pageContext } from "@/server/backoffice/page-context";
import { panelCall } from "@/server/backoffice/http";
import { BackofficeError } from "@/server/backoffice/errors";
import { eventFromPanel, marketsFromPanel } from "@/lib/backoffice/public-adapters";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (integrationMode() === "backoffice") {
    if (!/^\d+$/.test(id)) notFound();
    const context = await pageContext();
    try {
      const [header, odds] = await Promise.all([
      panelCall(context, "POST", "/api/bet/v3/event/" + id, { body: {} }),
      panelCall(context, "GET", "/api/v3/" + (context.session ? "user" : "app") + "/event-odds/" + id,
        { query: new URLSearchParams({ category: "all" }) }),
    ]);
      const remoteEvent = eventFromPanel(header.data);
      remoteEvent.markets = marketsFromPanel(odds.data, remoteEvent, "Popular").markets;
      return <EventDetail event={remoteEvent} />;
    } catch (error) {
      if (error instanceof BackofficeError && [403, 404].includes(error.status)) notFound();
      throw error;
    }
  }
  const event = eventById(id);
  if (!event) notFound();
  return <EventDetail event={event} />;
}
