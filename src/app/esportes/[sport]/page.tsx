import { notFound } from "next/navigation";
import { SportsList } from "@/components/sports/workspace";
import { catalogSportName } from "@/lib/sports-catalog";

export default async function Page({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  if (!catalogSportName(sport)) notFound();
  return <SportsList sport={sport} />;
}
