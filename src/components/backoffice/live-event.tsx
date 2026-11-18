"use client";

import Link from "next/link";
import { useLiveEvent } from "@/lib/backoffice/live";
import { useSite } from "@/lib/site-context";
import { EventDetail } from "@/components/sports/event-detail";
import { ModulePage, Status } from "./module-ui";

export function LiveEventPage({ matchId }: { matchId: string }) {
  const { runtime } = useSite();
  const live = useLiveEvent(matchId);
  if (live.event) return <EventDetail event={live.event} />;
  return <ModulePage title="Jogo ao vivo">
    <Status error={live.error} text={live.loading || runtime.mode === "demo"
      ? "Carregando mercados…" : "O jogo está indisponível."} />
    <Link href="/ao-vivo">Voltar à lista</Link>
  </ModulePage>;
}
