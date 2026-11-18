import { ThemeEditor } from "@/components/backoffice/theme-editor";
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <ThemeEditor token={typeof token === "string" ? token : ""} />;
}
