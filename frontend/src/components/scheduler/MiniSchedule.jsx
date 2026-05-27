import { DAYS, buildSlots } from '../../lib/previewConfigs'
import styles from '../SchedulePreviewPanel.module.css'

const PREVIEW_START = 8
const PREVIEW_END = 20
const PREVIEW_TOTAL = PREVIEW_END - PREVIEW_START
export const PREVIEW_W = 148   // px
const PREVIEW_H = 168          // px
const HOUR_H = PREVIEW_H / PREVIEW_TOTAL
const COL_W = PREVIEW_W / DAYS.length

const FACULTY_BG = {
  cs:      'rgba(191,219,254,0.85)',
  math:    'rgba(221,214,254,0.85)',
  physics: 'rgba(253,230,138,0.85)',
  misc:    'rgba(231,229,228,0.85)',
}
const FACULTY_BORDER = {
  cs:      'rgba(147,197,253,1)',
  math:    'rgba(196,181,253,1)',
  physics: 'rgba(252,211,77,1)',
  misc:    'rgba(214,211,209,1)',
}

/** A miniature weekly grid preview of one schedule configuration. */
export default function MiniSchedule({ choices, collisions, blockers, courseMap }) {
  const slots = buildSlots(choices, courseMap)

  // Course-course collision zones
  const colZones = []
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (slots[i].courseId === slots[j].courseId) continue
      if (slots[i].dayIndex !== slots[j].dayIndex) continue
      const os = Math.max(slots[i].startHour, slots[j].startHour)
      const oe = Math.min(slots[i].endHour, slots[j].endHour)
      if (oe > os) colZones.push({ dayIndex: slots[i].dayIndex, startHour: os, endHour: oe })
    }
  }

  // Course-blocker collision zones
  const blockerColZones = []
  for (const slot of slots) {
    for (const blocker of blockers) {
      const blockerDayIndex = DAYS.indexOf(blocker.day)
      if (blockerDayIndex !== slot.dayIndex) continue
      const os = Math.max(slot.startHour, blocker.startHour)
      const oe = Math.min(slot.endHour, blocker.endHour)
      if (oe > os) blockerColZones.push({ dayIndex: blockerDayIndex, startHour: os, endHour: oe })
    }
  }

  return (
    <div className={styles.miniRoot} style={{ width: PREVIEW_W, height: PREVIEW_H, backgroundColor: '#fafaf9', borderRadius: 6, overflow: 'hidden' }}>
      {/* Grid lines */}
      {Array.from({ length: PREVIEW_TOTAL }, (_, i) => (
        <div key={i} className={styles.gridLine} style={{ top: i * HOUR_H }} />
      ))}
      {/* Column separators */}
      {DAYS.map((_, di) => di > 0 && (
        <div key={di} className={styles.colSeparator} style={{ left: di * COL_W }} />
      ))}

      {/* Blocker bands */}
      {blockers.map((blocker, i) => {
        const dayIndex = DAYS.indexOf(blocker.day)
        if (dayIndex < 0) return null
        const bStart = Math.max(blocker.startHour, PREVIEW_START)
        const bEnd = Math.min(blocker.endHour, PREVIEW_END)
        if (bEnd <= bStart) return null
        return (
          <div
            key={`blocker-${i}`}
            className={styles.blockerBand}
            style={{
              top: (bStart - PREVIEW_START) * HOUR_H,
              height: (bEnd - bStart) * HOUR_H,
              left: dayIndex * COL_W,
              width: COL_W,
              background: 'rgba(120,113,108,0.13)',
              borderTop: '1px solid rgba(80,70,60,0.18)',
              borderBottom: '1px solid rgba(80,70,60,0.18)',
            }}
          />
        )
      })}

      {/* Course slots */}
      {slots.map((slot, si) => (
        <div
          key={si}
          className={styles.courseSlot}
          style={{
            top: (slot.startHour - PREVIEW_START) * HOUR_H + 1,
            height: (slot.endHour - slot.startHour) * HOUR_H - 2,
            left: slot.dayIndex * COL_W + 1,
            width: COL_W - 2,
            backgroundColor: FACULTY_BG[slot.faculty],
            border: `1px solid ${FACULTY_BORDER[slot.faculty]}`,
          }}
        />
      ))}

      {/* Course-course collision zones */}
      {colZones.map((z, i) => (
        <div
          key={i}
          className={styles.collisionZone}
          style={{
            top: (z.startHour - PREVIEW_START) * HOUR_H,
            height: (z.endHour - z.startHour) * HOUR_H,
            left: z.dayIndex * COL_W,
            width: COL_W,
            backgroundImage: 'repeating-linear-gradient(-45deg, rgba(239,68,68,0.78) 0px, rgba(239,68,68,0.78) 3px, transparent 3px, transparent 8px)',
            border: '1px solid rgba(239,68,68,0.95)',
          }}
        />
      ))}

      {/* Course-blocker collision zones */}
      {blockerColZones.map((z, i) => (
        <div
          key={`bc-${i}`}
          className={styles.collisionZone}
          style={{
            top: (z.startHour - PREVIEW_START) * HOUR_H,
            height: (z.endHour - z.startHour) * HOUR_H,
            left: z.dayIndex * COL_W,
            width: COL_W,
            backgroundImage: 'repeating-linear-gradient(-45deg, rgba(239,68,68,0.78) 0px, rgba(239,68,68,0.78) 3px, transparent 3px, transparent 8px)',
            border: '1px solid rgba(239,68,68,0.95)',
          }}
        />
      ))}

      {/* Collision badge */}
      {collisions > 0 && (
        <div className={styles.collisionBadge}>
          {collisions} clash{collisions > 1 ? 'es' : ''}
        </div>
      )}
    </div>
  )
}
