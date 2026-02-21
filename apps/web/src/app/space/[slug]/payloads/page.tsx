import { PayloadsSection } from '@/components/sections/PayloadsSection'

export default async function PayloadsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <PayloadsSection spaceSlug={slug} />
}
