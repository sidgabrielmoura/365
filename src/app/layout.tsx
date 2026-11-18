import type { Metadata } from "next";
import { cache, Suspense, type CSSProperties } from "react";
import { cookies } from "next/headers";
import { SiteProvider } from "@/lib/site-context";
import { readSession } from "@/lib/demo-store";
import { Shell } from "@/components/shell";
import "./globals.css";
import "./tenant-theme.css";
import { integrationMode } from "@/server/backoffice/config";
import { DEMO_RUNTIME } from "@/lib/backoffice/types";
import { EMPTY_SESSION } from "@/lib/demo-types";
import { resolveTenant } from "@/server/backoffice/tenant";
import { publicRuntime } from "@/server/backoffice/runtime";
import { headers } from "next/headers";
import { ORIGINAL_BRAND, ORIGINAL_ICON, themeProperties } from "@/lib/backoffice/branding";
const runtimeForPage = cache(async () => integrationMode() === "backoffice"
  ? publicRuntime(await resolveTenant((await headers()).get("host") || ""))
  : DEMO_RUNTIME);

const originalMetadata: Metadata = {
  title: {
    default: "BrasaBet | Esportes e Cassino",
    template: "%s | BrasaBet",
  },
  description:
    "Clone local da interface BrasaBet, com esportes e cassino demonstrativos.",
  robots: { index: false, follow: false },
  icons: { icon: ORIGINAL_ICON },
};

export async function generateMetadata(): Promise<Metadata> {
  const { branding } = await runtimeForPage();
  return branding ? {
    ...originalMetadata,
    title: { default: branding.name + " | Esportes e Cassino", template: "%s | " + branding.name },
    applicationName: branding.name,
    description: "Esportes e cassino de " + branding.name + ".",
    icons: { icon: branding.icon ?? branding.appIcon, apple: branding.appIcon },
  } : originalMetadata;
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const remote = integrationMode() === "backoffice";
  const session = remote ? EMPTY_SESSION : readSession((await cookies()).get("brasa_demo")?.value);
  const runtime = await runtimeForPage();
  const branding = runtime.branding;
  const theme = /^#(?:fff){1,2}$/i.test(branding?.theme.color_scheme ?? "") ? "auto" : "dark";
  const properties = branding ? themeProperties(branding.theme) as CSSProperties : undefined;
  return (
    <html lang="pt-BR" data-tenant-theme={branding ? theme : undefined} style={properties}>
      <head>
        <link rel="stylesheet" href="/reference.css" />
      </head>
      <body className="app-shell">
        <Suspense fallback={<div className="boot-screen">{branding?.name ?? ORIGINAL_BRAND.toLowerCase()}</div>}>
          <SiteProvider initialSession={session} initialRuntime={runtime}>
            <Shell>{children}</Shell>
          </SiteProvider>
        </Suspense>
      </body>
    </html>
  );
}
