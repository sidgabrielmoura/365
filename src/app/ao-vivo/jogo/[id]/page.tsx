import { notFound } from "next/navigation";
import { LiveEventPage } from "@/components/backoffice/live-event";
import { integrationMode } from "@/server/backoffice/config";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (integrationMode() !== "backoffice" || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  return <LiveEventPage matchId={id} />;
}
