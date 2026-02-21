import { EnvVarsSection } from '@/components/sections/EnvVarsSection'

export default async function EnvVarsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <EnvVarsSection spaceSlug={slug} />
}
