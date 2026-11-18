import { Scratchcards } from "@/components/backoffice/scratchcards";
import { notFound } from "next/navigation";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9_-]+$/i.test(id)) notFound();
  return <Scratchcards id={id} />;
}
