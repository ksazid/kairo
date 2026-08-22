export function brandHue(brandId: string) {
  let hash = 2166136261;
  for (const char of brandId) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 360;
}
