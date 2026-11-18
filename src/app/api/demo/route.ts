import { NextRequest, NextResponse } from "next/server";
import { authenticate, mutate, readSession } from "@/lib/demo-store";
import { integrationMode } from "@/server/backoffice/config";
export const runtime = "nodejs";
export function GET(request: NextRequest) {
  if (integrationMode() !== "demo") return NextResponse.json({ error: "Demonstração desativada." }, { status: 404 });
  return NextResponse.json(
    { session: readSession(request.cookies.get("brasa_demo")?.value) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: NextRequest) {
  if (integrationMode() !== "demo") return NextResponse.json({ error: "Demonstração desativada." }, { status: 404 });
  const origin = request.headers.get("origin");
  if (
    origin &&
    origin !== `${request.nextUrl.protocol}//${request.headers.get("host")}`
  )
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  try {
    const input = await request.json();
    if (["login", "register", "demo"].includes(input.action)) {
      const result = authenticate(input.action, input),
        response = NextResponse.json({ session: result.session });
      response.cookies.set("brasa_demo", result.token, {
        httpOnly: true,
        sameSite: "strict",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: 86400 * 7,
      });
      return response;
    }
    const response = NextResponse.json(
      mutate(request.cookies.get("brasa_demo")?.value, input),
    );
    if (input.action === "logout") response.cookies.delete("brasa_demo");
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Não foi possível concluir.",
      },
      { status: 400 },
    );
  }
}
