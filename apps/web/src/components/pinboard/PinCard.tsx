'use client'

import { useRef, useState, useEffect, RefObject } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { PinDoc } from '@/types/sanity'

const GRID = 24

const COLOR_HEX: Record<string, string> = {
  zinc: '#71717a',
  violet: '#7c3aed',
  blue: '#3b82f6',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
}

const TAG_COLORS = ['#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#7c3aed', '#06b6d4']

function seedTilt(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return (((h % 600) + 600) % 600) / 100 - 3 // -3..+3 deg
}

type Props = {
  pin: PinDoc
  cardW: number
  cardH: number
  boardRef: RefObject<HTMLDivElement | null>
  wobbling: boolean
  onSoftDelete: (id: string) => void
  onDragEnd: (id: string, gx: number, gy: number) => void
}

export function PinCard({ pin, cardW, cardH, boardRef, wobbling, onSoftDelete, onDragEnd }: Props) {
  const gx = pin.gridX ?? 1
  const gy = pin.gridY ?? 1
  const tilt = seedTilt(pin._id)
  const colorHex = COLOR_HEX[pin.color] ?? '#71717a'

  const x = useMotionValue(gx * GRID)
  const y = useMotionValue(gy * GRID)
  const rotate = useMotionValue(tilt)

  const [isDragging, setIsDragging] = useState(false)
  const [showDeleteBadge, setShowDeleteBadge] = useState(false)
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Drop-in animation on mount
  useEffect(() => {
    y.set(gy * GRID - 24)
    const ctrl = animate(y, gy * GRID, { type: 'spring', stiffness: 400, damping: 25, delay: Math.random() * 0.1 })
    return () => ctrl.stop()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Neighbor wobble
  useEffect(() => {
    if (!wobbling) return
    const ctrl = animate(rotate, tilt + 1.5, { type: 'spring', stiffness: 500, damping: 20 })
    const t = setTimeout(() => {
      animate(rotate, tilt, { type: 'spring', stiffness: 300, damping: 15 })
    }, 250)
    return () => { ctrl.stop(); clearTimeout(t) }
  }, [wobbling, rotate, tilt])

  const handleDragStart = () => {
    setIsDragging(true)
    setShowDeleteBadge(false)
    animate(rotate, 0, { type: 'spring', stiffness: 300, damping: 20 })
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    const board = boardRef.current
    const maxX = board ? board.offsetWidth - cardW : 800
    const maxY = board ? board.offsetHeight - cardH : 600
    const snX = Math.max(0, Math.min(maxX, Math.round(x.get() / GRID) * GRID))
    const snY = Math.max(0, Math.min(maxY, Math.round(y.get() / GRID) * GRID))
    animate(x, snX, { type: 'spring', stiffness: 400, damping: 25 })
    animate(y, snY, { type: 'spring', stiffness: 400, damping: 25 })
    animate(rotate, tilt, { type: 'spring', stiffness: 300, damping: 18 })
    const newGX = Math.round(snX / GRID)
    const newGY = Math.round(snY / GRID)
    onDragEnd(pin._id, newGX, newGY)
  }

  const handlePressStart = () => {
    pressTimerRef.current = setTimeout(() => setShowDeleteBadge(true), 500)
  }

  const handlePressEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current)
  }

  let hostname = ''
  try { hostname = new URL(pin.url).hostname } catch { hostname = pin.url }

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.05}
      dragConstraints={boardRef}
      style={{
        x,
        y,
        rotate,
        position: 'absolute',
        left: 0,
        top: 0,
        width: cardW,
        height: cardH,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 50 : 1,
        touchAction: 'none',
      }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0, y: -40 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      whileDrag={{ scale: 1.05, zIndex: 50 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
    >
      {/* Push-pin */}
      <div
        style={{
          position: 'absolute',
          top: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${colorHex}ee, ${colorHex})`,
          boxShadow: `0 2px 4px rgba(0,0,0,0.7), 0 0 0 1px ${colorHex}60`,
          zIndex: 2,
        }}
      />

      {/* Card body */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#18181b',
          border: `1px solid ${colorHex}33`,
          borderRadius: 8,
          boxShadow: isDragging
            ? `0 8px 40px rgba(0,0,0,0.85), 0 0 20px ${colorHex}40`
            : `0 4px 24px rgba(0,0,0,0.6), 0 0 8px ${colorHex}20`,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 12px 10px',
          overflow: 'hidden',
          position: 'relative',
          transition: 'box-shadow 0.15s ease',
        }}
      >
        {/* Delete badge */}
        {showDeleteBadge && (
          <button
            onPointerDown={(e) => { e.stopPropagation() }}
            onClick={(e) => { e.stopPropagation(); onSoftDelete(pin._id) }}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#ef4444',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              zIndex: 3,
            }}
          >
            ✕
          </button>
        )}

        {/* Title */}
        <a
          href={pin.url}
          target="_blank"
          rel="noreferrer"
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#e4e4e7',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textDecoration: 'none',
            flex: '0 0 auto',
          }}
        >
          {pin.title}
        </a>

        {/* Hostname */}
        <p
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            color: '#52525b',
            marginTop: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: '0 0 auto',
          }}
        >
          {hostname}
        </p>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer: tags dots + external link */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {pin.tags.slice(0, 5).map((tag, i) => (
              <div
                key={tag}
                title={tag}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: TAG_COLORS[i % TAG_COLORS.length] ?? '#6366f1',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
          <a
            href={pin.url}
            target="_blank"
            rel="noreferrer"
            onPointerDown={(e) => e.stopPropagation()}
            style={{ color: '#3f3f46', flexShrink: 0 }}
          >
            <ExternalLink size={10} />
          </a>
        </div>

        {/* Tags as badges (hidden, used for tooltip feel via title on dots) */}
        {pin.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
            {pin.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[9px] h-3.5 px-1 bg-zinc-900 border-0 text-zinc-600"
              >
                {tag}
              </Badge>
            ))}
            {pin.tags.length > 3 && (
              <Badge variant="secondary" className="text-[9px] h-3.5 px-1 bg-zinc-900 border-0 text-zinc-600">
                +{pin.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
