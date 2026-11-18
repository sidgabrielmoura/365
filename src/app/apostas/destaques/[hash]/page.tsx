import { notFound } from "next/navigation";
import { Featured } from "@/components/backoffice/featured";
export default async function Page({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  if (!/^[A-Z0-9]{12}$/.test(hash)) notFound();
  return <Featured hash={hash} />;
}
