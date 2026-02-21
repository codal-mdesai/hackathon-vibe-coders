import { Suspense } from 'react'
import { getDashboardData } from '@/sanity/queries/dashboard'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let data = null
  try {
    data = await getDashboardData(slug)
  } catch {
    // Sanity not configured — render empty state
  }

  return (
    <Suspense fallback={<DashboardContent slug={slug} data={null} loading />}>
      <DashboardContent slug={slug} data={data} loading={false} />
    </Suspense>
  )
}
