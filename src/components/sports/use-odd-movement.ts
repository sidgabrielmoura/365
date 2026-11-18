import { useEffect, useRef, useState } from "react";

const HIGHLIGHT_MS = 2400;
type Movement = "up" | "down";
type Quote = { key: string; cents: number };

export function useOddMovement(key: string | null, price: number | null) {
  const previous = useRef<Quote | null>(null);
  const [change, setChange] = useState<(Quote & { direction: Movement }) | null>(null);
  const cents = price == null ? null : Math.round(price * 100);

  useEffect(() => {
    const last = previous.current;
    previous.current = key !== null && cents !== null ? { key, cents } : null;
    if (key === null || cents === null || last?.key !== key) {
      setChange(null);
      return;
    }
    if (last.cents === cents) return;
    setChange({ key, cents, direction: cents > last.cents ? "up" : "down" });
    const timer = setTimeout(() => setChange(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [key, cents]);

  return change && change.key === key && change.cents === cents ? change.direction : undefined;
}
