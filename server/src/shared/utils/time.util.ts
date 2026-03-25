export function ms(ttl: string): number {
  const n = Number(ttl);
  if (!Number.isNaN(n)) return n * 1000;
  const unit = ttl.slice(-1);
  const val = Number(ttl.slice(0, -1));
  if (unit === "m") return val * 60 * 1000;
  if (unit === "h") return val * 60 * 60 * 1000;
  if (unit === "d") return val * 24 * 60 * 60 * 1000;
  return 0;
}
