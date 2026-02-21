import { WebhooksSection } from '@/components/sections/WebhooksSection'

export default async function WebhooksPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <WebhooksSection spaceSlug={slug} />
}
