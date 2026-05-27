import { useState, useRef, useLayoutEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'
import styles from './Tooltip.module.css'

interface Props {
  text: string
  children: ReactNode
  side?: 'top' | 'bottom'
  className?: string
}

interface Pos { anchorCX: number; anchorY: number }

const GAP = 8    // gap between element edge and tooltip
const EDGE = 8   // min distance from viewport edge

export default function Tooltip({ text, children, side = 'top', className }: Props) {
  const [pos, setPos] = useState<Pos | null>(null)
  const [tipCX, setTipCX] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  // After portal renders, measure tooltip width and clamp horizontally
  useLayoutEffect(() => {
    if (!pos || !tipRef.current) { setTipCX(null); return }
    const half = tipRef.current.getBoundingClientRect().width / 2
    setTipCX(Math.min(Math.max(pos.anchorCX, EDGE + half), window.innerWidth - EDGE - half))
  }, [pos])

  if (!text) return <>{children}</>

  function show() {
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({ anchorCX: r.left + r.width / 2, anchorY: side === 'top' ? r.top - GAP : r.bottom + GAP })
  }

  function hide() { setPos(null); setTipCX(null) }

  const cx = tipCX ?? pos?.anchorCX ?? 0
  const arrowShift = pos ? pos.anchorCX - cx : 0

  return (
    <div ref={wrapRef} className={cn(styles.wrap, className)} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {pos && createPortal(
        <div
          ref={tipRef}
          className={styles.portal}
          style={{
            zIndex: 9999,
            left: cx,
            top: pos.anchorY,
            transform: side === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          }}
        >
          <div className={styles.bubble}>
            {text}
            <span
              className={cn(
                styles.arrow,
                side === 'top' ? styles.arrowTop : styles.arrowBottom
              )}
              style={{ left: `calc(50% + ${arrowShift}px)` }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
