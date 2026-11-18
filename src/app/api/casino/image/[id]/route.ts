import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { casinoGameById } from "@/lib/casino-data";

export const runtime = "nodejs";
const pending = new Map<string, Promise<Uint8Array>>();
function imageType(bytes: Uint8Array) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return "image/gif";
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45
  )
    return "image/webp";
  return null;
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const game = casinoGameById((await params).id);
  if (!game) return new Response(null, { status: 404 });
  const url = new URL(game.image);
  if (url.protocol !== "https:" || url.hostname !== "imagensfivers.com")
    return new Response(null, { status: 404 });
  const key = createHash("sha256").update(url.href).digest("hex");
  let job = pending.get(key);
  if (!job) {
    job = (async () => {
      const dir = path.join(process.cwd(), ".local", "casino-images"),
        file = path.join(dir, key);
      try {
        return new Uint8Array(await readFile(file));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      const response = await fetch(url, {
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Imagem indisponível");
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length > 4_000_000) throw new Error("Imagem excede o limite");
      if (!imageType(bytes)) throw new Error("Formato de imagem indisponível");
      await mkdir(dir, { recursive: true });
      const temporary = file + ".tmp";
      await writeFile(temporary, bytes);
      await rename(temporary, file);
      return bytes;
    })();
    pending.set(key, job);
  }
  try {
    const bytes = await job;
    return new Response(Uint8Array.from(bytes).buffer, {
      headers: {
        "Content-Type": imageType(bytes) || "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/assets/game-unavailable.svg",
        "Cache-Control": "no-store",
      },
    });
  } finally {
    pending.delete(key);
  }
}
