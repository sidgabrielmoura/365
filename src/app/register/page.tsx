import { redirect } from "next/navigation";
export default async function Page({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const query = new URLSearchParams({ cadastro: "1" });
  if (typeof ref === "string" && ref.length <= 80) query.set("ref", ref);
  redirect("/?" + query.toString());
}
