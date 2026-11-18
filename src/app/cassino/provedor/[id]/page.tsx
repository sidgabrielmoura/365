import { notFound } from "next/navigation";
import { Casino } from "@/components/casino/casino";
import { games, decodeCasinoParam } from "@/lib/casino-data";
import { integrationMode } from "@/server/backoffice/config";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const provider = decodeCasinoParam(id);
  if (integrationMode() === "demo" && !games.some((game) => game.provider === provider)) notFound();
  return <Casino provider={provider} category="todos" />;
}
