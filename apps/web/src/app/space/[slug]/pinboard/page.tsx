import { PinboardSection } from '@/components/sections/PinboardSection'

export default async function PinboardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <PinboardSection spaceSlug={slug} />
}
