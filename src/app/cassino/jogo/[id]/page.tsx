import { notFound } from "next/navigation";
import { CasinoGameView } from "@/components/casino/casino";
import { casinoGameById } from "@/lib/casino-data";
import { integrationMode } from "@/server/backoffice/config";
import { pageContext } from "@/server/backoffice/page-context";
import { panelCall } from "@/server/backoffice/http";
import { casinoFromPanel } from "@/lib/backoffice/public-adapters";
import { record } from "@/lib/backoffice/types";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (integrationMode() === "backoffice") {
    const result = await panelCall(await pageContext(), "GET", "/api/casino/game/" + id);
    return <CasinoGameView game={casinoFromPanel(record(result.data).game)} />;
  }
  const game = casinoGameById(id);
  if (!game) notFound();
  return <CasinoGameView game={game} />;
}
