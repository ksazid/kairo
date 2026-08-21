import { redirect } from "next/navigation";
import {
  completeInstagramConnection,
  selectInstagramCandidate,
  type InstagramCandidateView,
  type InstagramCompleteResult,
} from "../../../../src/lib/instagram-api";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function InstagramCallbackPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const providerError = first(params.error_description) ?? first(params.error);
  if (providerError) return <ConnectionMessage title="Instagram connection cancelled" detail={providerError} />;

  const code = first(params.code);
  const state = first(params.state);
  if (!code || !state) {
    return <ConnectionMessage title="Instagram connection could not continue" detail="Meta did not return the required authorization response." />;
  }

  let result: InstagramCompleteResult;
  try {
    result = await completeInstagramConnection(code, state);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Instagram connection failed.";
    return <ConnectionMessage title="Instagram connection failed" detail={detail} />;
  }

  if (result.status === "connected") {
    redirect(`/brands/${encodeURIComponent(result.brandId)}/brain?instagram=connected`);
  }
  if (result.status === "no-eligible-account") {
    return <ConnectionMessage title="No eligible Instagram account found" detail="Meta did not return an Instagram professional account connected to a Facebook Page with the required permissions." />;
  }
  return <CandidateSelection brandId={result.brandId} intentId={result.intentId} candidates={result.candidates} />;
}

function CandidateSelection({ brandId, intentId, candidates }: { brandId: string; intentId: string; candidates: InstagramCandidateView[] }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-12">
      <div>
        <p className="text-sm font-medium text-neutral-500">Instagram</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Choose the account to connect</h1>
        <p className="mt-3 text-neutral-600">Meta returned more than one eligible Instagram professional account.</p>
      </div>
      <div className="grid gap-3">
        {candidates.map((candidate) => (
          <form key={candidate.id} action={selectCandidateAction} className="rounded-2xl border border-neutral-200 p-4">
            <input type="hidden" name="brandId" value={brandId} />
            <input type="hidden" name="intentId" value={intentId} />
            <input type="hidden" name="candidateId" value={candidate.id} />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{candidate.username ? `@${candidate.username}` : candidate.displayName}</p>
                <p className="text-sm text-neutral-500">Facebook Page: {candidate.pageName}</p>
              </div>
              <button type="submit" className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white">Connect</button>
            </div>
          </form>
        ))}
      </div>
    </main>
  );
}

async function selectCandidateAction(formData: FormData) {
  "use server";
  const brandId = requiredField(formData, "brandId");
  const intentId = requiredField(formData, "intentId");
  const candidateId = requiredField(formData, "candidateId");
  await selectInstagramCandidate(brandId, intentId, candidateId);
  redirect(`/brands/${encodeURIComponent(brandId)}/brain?instagram=connected`);
}

function ConnectionMessage({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <p className="text-sm font-medium text-neutral-500">Instagram</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-neutral-600">{detail}</p>
    </main>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function requiredField(formData: FormData, name: string): string {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}
