/**
 * Pure layout/geometry/collision helpers for WeeklySchedule.
 * No JSX, no hooks — relocated verbatim from WeeklySchedule.jsx.
 */

export const DAYS = [
  { key: 'sun', label: 'Sun' },
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
]
export const DAY_LABEL = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu' }
export const DAY_OF_WEEK = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
export const START_HOUR = 8
export const END_HOUR = 20
export const TOTAL_HOURS = END_HOUR - START_HOUR
export const HOUR_HEIGHT = 52

export function formatHour(h) {
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}
export function formatTime(h) {
  const hour = Math.floor(h)
  const min = h % 1 === 0.5 ? '30' : '00'
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${min}${suffix}`
}

export function blockStyle(startHour, endHour, dayIndex) {
  return {
    top: `calc(${((startHour - START_HOUR) / TOTAL_HOURS) * 100}% + 1px)`,
    height: `calc(${((endHour - startHour) / TOTAL_HOURS) * 100}% - 2px)`,
    left: `calc(56px + ${dayIndex} * (100% - 56px) / 5 + 3px)`,
    width: `calc((100% - 56px) / 5 - 6px)`,
  }
}

// Build all course blocks (lectures + recitations) for the placed courses
export function buildCourseBlocks(semPlaced, courseMap) {
  const allCourseBlocks = []
  for (const p of semPlaced) {
    const course = courseMap.get(p.courseId)
    if (!course) continue

    const lectOpt = course.lectureOptions.find(o => o.id === p.lectureOptionId)
    if (lectOpt) {
      for (const slot of lectOpt.slots) {
        const dayIndex = DAYS.findIndex(d => d.key === slot.day)
        if (dayIndex < 0) continue
        allCourseBlocks.push({
          key: `lect-${p.courseId}-${slot.day}-${slot.startHour}`,
          dayIndex, startHour: slot.startHour, endHour: slot.endHour,
          label: course.name, code: course.code, faculty: course.faculty,
          locked: p.locked, courseId: p.courseId, isRecitation: false,
        })
      }
    }

    if (course.recitationOptions && p.recitationOptionId) {
      const recOpt = course.recitationOptions.find(o => o.id === p.recitationOptionId)
      if (recOpt) {
        for (const slot of recOpt.slots) {
          const dayIndex = DAYS.findIndex(d => d.key === slot.day)
          if (dayIndex < 0) continue
          allCourseBlocks.push({
            key: `rec-${p.courseId}-${slot.day}-${slot.startHour}`,
            dayIndex, startHour: slot.startHour, endHour: slot.endHour,
            label: course.name, code: course.code, faculty: course.faculty,
            locked: p.locked, courseId: p.courseId, isRecitation: true,
          })
        }
      }
    }
  }
  return allCourseBlocks
}

// Collision zones between different courses
export function computeCollisionZones(allCourseBlocks) {
  const collisionZones = []
  for (let i = 0; i < allCourseBlocks.length; i++) {
    for (let j = i + 1; j < allCourseBlocks.length; j++) {
      const a = allCourseBlocks[i], b = allCourseBlocks[j]
      if (a.courseId === b.courseId) continue
      if (a.dayIndex !== b.dayIndex) continue
      const os = Math.max(a.startHour, b.startHour)
      const oe = Math.min(a.endHour, b.endHour)
      if (oe > os) collisionZones.push({ dayIndex: a.dayIndex, startHour: os, endHour: oe })
    }
  }
  return collisionZones
}

// Collision zones between course blocks and blockers
export function computeBlockerCollisionZones(allCourseBlocks, semBlockers, getBlockerDisplay) {
  const blockerCollisionZones = []
  for (const block of allCourseBlocks) {
    for (const blocker of semBlockers) {
      const bDisp = getBlockerDisplay(blocker)
      const blockerDayIndex = DAYS.findIndex(d => d.key === bDisp.day)
      if (blockerDayIndex !== block.dayIndex) continue
      const os = Math.max(block.startHour, bDisp.startHour)
      const oe = Math.min(block.endHour, bDisp.endHour)
      if (oe > os) blockerCollisionZones.push({ dayIndex: block.dayIndex, startHour: os, endHour: oe })
    }
  }
  return blockerCollisionZones
}

export const COLLISION_STRIPE = {
  backgroundImage: 'repeating-linear-gradient(-45deg, rgba(239,68,68,0.78) 0px, rgba(239,68,68,0.78) 4px, transparent 4px, transparent 12px)',
  border: '1px solid rgba(239,68,68,0.95)',
}
