import { redirect } from "next/navigation";

type Params = Promise<{ brandId: string }>;

export default async function BrandBrainControlCompatibilityPage({ params }: { params: Params }) {
  const { brandId } = await params;
  redirect(`/brands/${encodeURIComponent(brandId)}/brain`);
}
