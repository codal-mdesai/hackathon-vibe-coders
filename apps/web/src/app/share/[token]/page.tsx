import { getShareLinkByToken } from '@/sanity/queries/share'
import { getWebhooks } from '@/sanity/queries/webhooks'
import { getJsonPayloads, getCurlCommands } from '@/sanity/queries/payloads'
import { isExpired } from '@/lib/share'
import { ShareReadOnlyView } from '@/components/ShareReadOnlyView'

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  let shareLink = null
  try {
    shareLink = await getShareLinkByToken(token)
  } catch {
    // Sanity not configured
  }

  if (!shareLink) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-zinc-300 text-sm font-medium">Link not found</p>
          <p className="text-zinc-600 text-xs">This share link does not exist.</p>
        </div>
      </div>
    )
  }

  if (isExpired(shareLink.expiresAt)) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-zinc-300 text-sm font-medium">Link expired</p>
          <p className="text-zinc-600 text-xs">
            This link expired on {new Date(shareLink.expiresAt).toLocaleString()}
          </p>
        </div>
      </div>
    )
  }

  // Fetch the resource
  let resourceData: unknown = null
  try {
    if (shareLink.resourceType === 'webhook') {
      const all = await getWebhooks(shareLink.createdBy ?? '')
      resourceData = all.find((w) => w._id === shareLink!.resourceId) ?? null
    } else if (shareLink.resourceType === 'jsonPayload') {
      const all = await getJsonPayloads(shareLink.createdBy ?? '')
      resourceData = all.find((j) => j._id === shareLink!.resourceId) ?? null
    } else if (shareLink.resourceType === 'curlCommand') {
      const all = await getCurlCommands(shareLink.createdBy ?? '')
      resourceData = all.find((c) => c._id === shareLink!.resourceId) ?? null
    }
  } catch {
    // Sanity not configured
  }

  return (
    <ShareReadOnlyView
      resourceType={shareLink.resourceType}
      resourceData={resourceData}
      expiresAt={shareLink.expiresAt}
    />
  )
}
