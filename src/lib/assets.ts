import manifest from "@/data/sports-assets.json";
const files = manifest as Record<string, string>;
const base =
  "https://brasabetbr.com/releases/20261117234105344-1f7bfdfb6fde/assets/";
export function asset(url: string | null | undefined) {
  if (!url) return undefined;
  if (/^https:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      if (!parsed.username && !parsed.password) return parsed.href;
    } catch {}
  }
  return (
    files[url] ||
    files[base + url] ||
    files[base + "images/" + url] ||
    files[url.split("/").at(-1) || ""] ||
    "/assets/images/1-5801621400.svg"
  );
}
