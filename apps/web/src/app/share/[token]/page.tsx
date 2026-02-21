import { validateShareLink } from "@/lib/share";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await validateShareLink(token);

  if (!result.valid) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-semibold text-zinc-100">Link Expired</h1>
          <p className="text-sm text-zinc-500">
            {result.expiresAt
              ? `This link expired on ${new Date(result.expiresAt).toLocaleString()}`
              : "This share link is invalid or has expired."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-2 text-xl font-semibold text-zinc-100">Shared Resource</h1>
        <p className="text-sm text-zinc-500">
          {result.resourceType} — expires{" "}
          {result.expiresAt ? new Date(result.expiresAt).toLocaleString() : "soon"}
        </p>
      </div>
    </div>
  );
}
