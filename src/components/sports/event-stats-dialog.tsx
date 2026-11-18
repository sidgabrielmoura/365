"use client";

import Link from "next/link";
import { Dialog } from "@/components/dialog";
import { useSite } from "@/lib/site-context";
import type { SportsEvent } from "@/lib/sports-data";

export function EventStatsDialog({ event }: { event: SportsEvent }) {
  const { closeModal, runtime } = useSite();
  const title = `${event.home} × ${event.away}`;

  return (
    <Dialog title={title} className="event-stats-dialog" onClose={closeModal}>
      <div className="information-page">
        <h2 id="modal-title">{title}</h2>
        {event.status === "live" && (
          <p className="statistics-score">
            {event.scores?.home ?? "–"} – {event.scores?.away ?? "–"}
          </p>
        )}
        <p>Estatísticas detalhadas ainda não disponíveis para este jogo.</p>
        <Link
          href={(runtime.mode === "backoffice" && event.status === "live" ? "/ao-vivo/jogo/" : "/evento/") + event.id}
          className="button button-outline"
          onClick={closeModal}
        >
          Ver mercados
        </Link>
      </div>
    </Dialog>
  );
}
