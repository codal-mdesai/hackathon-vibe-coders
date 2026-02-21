import { ApiKeysSection } from '@/components/sections/ApiKeysSection'

export default async function ApiKeysPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <ApiKeysSection spaceSlug={slug} />
}
