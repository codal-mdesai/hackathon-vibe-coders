'use client'

import { PinBoard } from '@/components/pinboard/PinBoard'

type Props = { spaceSlug: string }

export function PinboardSection({ spaceSlug }: Props) {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <PinBoard spaceSlug={spaceSlug} isHero={false} />
    </div>
  )
}
