export function calcScore(distanceKm) {
  const base = Math.max(0, Math.round(1000 * Math.exp(-distanceKm / 750)));
  if (distanceKm <= 10) return 1000;
  if (distanceKm <= 25) return Math.max(950, base);
  if (distanceKm <= 50) return Math.max(900, base);
  return base;
}
