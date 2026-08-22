export const CONNECTION_OPTIONS = ["instagram", "facebook-instagram", "facebook"] as const;

export type BrandConnectionOption = (typeof CONNECTION_OPTIONS)[number];

const startPaths: Record<BrandConnectionOption, string> = {
  instagram: "instagram",
  "facebook-instagram": "facebook-instagram",
  facebook: "facebook",
};

export function connectionStartPath(brandId: string, option: BrandConnectionOption, returnTo?: string): string {
  const start = `/brands/${encodeURIComponent(brandId)}/connect/${startPaths[option]}/start`;
  return returnTo ? `${start}?returnTo=${encodeURIComponent(returnTo)}` : start;
}

export function selectedBrandConnections(formData: FormData): BrandConnectionOption[] {
  return CONNECTION_OPTIONS.filter((option) => formData.get(`connect-${option}`) === "yes");
}

export function brandBrainDestination(brandId: string): string {
  return `/brands/${encodeURIComponent(brandId)}/brain?setup=open`;
}

export function connectionPlanDestination(brandId: string, selected: readonly BrandConnectionOption[]): string {
  return selected.reduceRight((returnTo, option) => {
    return connectionStartPath(brandId, option, returnTo);
  }, brandBrainDestination(brandId));
}
