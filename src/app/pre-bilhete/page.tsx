import { SportsCheckout } from "@/components/backoffice/seller";
export default async function Page({ searchParams }: { searchParams: Promise<{ valor?: string }> }) {
  return <SportsCheckout stake={Number((await searchParams).valor) || 0} />;
}
