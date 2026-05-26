import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { cn } from '../lib/utils'
import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import type { Course, PlacedCourse, SemesterId, Faculty, DayKey, Blocker } from '../types'

type CourseMap = Map<string, Course>

const DAYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu']
const PREVIEW_START = 8
const PREVIEW_END = 20
const PREVIEW_TOTAL = PREVIEW_END - PREVIEW_START
const PREVIEW_W = 148   // px
const PREVIEW_H = 168   // px
const HOUR_H = PREVIEW_H / PREVIEW_TOTAL
const COL_W = PREVIEW_W / DAYS.length

const FACULTY_BG: Record<Faculty, string> = {
  cs:      'rgba(191,219,254,0.85)',
  math:    'rgba(221,214,254,0.85)',
  physics: 'rgba(253,230,138,0.85)',
  misc:    'rgba(231,229,228,0.85)',
}
const FACULTY_BORDER: Record<Faculty, string> = {
  cs:      'rgba(147,197,253,1)',
  math:    'rgba(196,181,253,1)',
  physics: 'rgba(252,211,77,1)',
  misc:    'rgba(214,211,209,1)',
}

interface CourseSlot {
  courseId: string; optionId: string; faculty: Faculty
  day: DayKey; startHour: number; endHour: number; dayIndex: number
}

interface ChoiceEntry { courseId: string; optionId: string; recitationOptionId?: string; faculty: Faculty }

interface Config {
  choices: ChoiceEntry[]
  collisions: number
}

function buildSlots(choices: ChoiceEntry[], courseMap: CourseMap): CourseSlot[] {
  const slots: CourseSlot[] = []
  for (const { courseId, optionId, recitationOptionId, faculty } of choices) {
    const course = courseMap.get(courseId)
    if (!course) continue
    const opt = course.lectureOptions.find(o => o.id === optionId)
    if (opt) {
      for (const slot of opt.slots) {
        const dayIndex = DAYS.indexOf(slot.day)
        if (dayIndex < 0) continue
        slots.push({ courseId, optionId, faculty, day: slot.day, startHour: slot.startHour, endHour: slot.endHour, dayIndex })
      }
    }
    if (recitationOptionId && course.recitationOptions) {
      const recOpt = course.recitationOptions.find(o => o.id === recitationOptionId)
      if (recOpt) {
        for (const slot of recOpt.slots) {
          const dayIndex = DAYS.indexOf(slot.day)
          if (dayIndex < 0) continue
          slots.push({ courseId, optionId: recitationOptionId, faculty, day: slot.day, startHour: slot.startHour, endHour: slot.endHour, dayIndex })
        }
      }
    }
  }
  return slots
}

function countCollisions(choices: ChoiceEntry[], blockers: Blocker[], courseMap: CourseMap): number {
  const slots = buildSlots(choices, courseMap)
  let count = 0
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (slots[i].courseId === slots[j].courseId) continue
      if (slots[i].dayIndex !== slots[j].dayIndex) continue
      if (Math.max(slots[i].startHour, slots[j].startHour) < Math.min(slots[i].endHour, slots[j].endHour)) count++
    }
  }
  for (const slot of slots) {
    for (const blocker of blockers) {
      const blockerDayIndex = DAYS.indexOf(blocker.day)
      if (blockerDayIndex !== slot.dayIndex) continue
      if (Math.max(slot.startHour, blocker.startHour) < Math.min(slot.endHour, blocker.endHour)) count++
    }
  }
  return count
}

function getAllConfigs(placed: PlacedCourse[], blockers: Blocker[], courseMap: CourseMap): Config[] {
  let combos: ChoiceEntry[][] = [[]]

  for (const p of placed) {
    const course = courseMap.get(p.courseId)
    if (!course) continue

    const lectIds = course.lectureOptions.length > 0
      ? course.lectureOptions.map(o => o.id)
      : ['']
    const recitIds: (string | undefined)[] = (course.recitationOptions?.length ?? 0) > 0
      ? course.recitationOptions!.map(o => o.id)
      : [undefined]

    const next: ChoiceEntry[][] = []
    for (const existing of combos) {
      for (const lId of lectIds) {
        for (const rId of recitIds) {
          next.push([...existing, { courseId: p.courseId, optionId: lId, recitationOptionId: rId, faculty: course.faculty }])
        }
      }
    }
    combos = next
  }

  return combos
    .map(choices => ({ choices, collisions: countCollisions(choices, blockers, courseMap) }))
    .sort((a, b) => a.collisions - b.collisions)
}

function MiniSchedule({ choices, collisions, blockers, courseMap }: { choices: Config['choices']; collisions: number; blockers: Blocker[]; courseMap: CourseMap }) {
  const slots = buildSlots(choices, courseMap)

  // Course-course collision zones
  const colZones: { dayIndex: number; startHour: number; endHour: number }[] = []
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
  const blockerColZones: { dayIndex: number; startHour: number; endHour: number }[] = []
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
    <div className="relative" style={{ width: PREVIEW_W, height: PREVIEW_H, backgroundColor: '#fafaf9', borderRadius: 6, overflow: 'hidden' }}>
      {/* Grid lines */}
      {Array.from({ length: PREVIEW_TOTAL }, (_, i) => (
        <div
          key={i}
          className="absolute inset-x-0 border-t border-stone-100"
          style={{ top: i * HOUR_H }}
        />
      ))}
      {/* Column separators */}
      {DAYS.map((_, di) => di > 0 && (
        <div
          key={di}
          className="absolute top-0 bottom-0 border-l border-stone-100"
          style={{ left: di * COL_W }}
        />
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
            className="absolute pointer-events-none"
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
          className="absolute rounded-sm"
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
          className="absolute pointer-events-none"
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
          className="absolute pointer-events-none"
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
        <div className="absolute top-1 right-1 bg-red-600 text-white text-[8px] font-bold px-1 py-0.5 rounded-full leading-none">
          {collisions} clash{collisions > 1 ? 'es' : ''}
        </div>
      )}
    </div>
  )
}

interface Props {
  semesterId: SemesterId
  placed: PlacedCourse[]
  onClose: () => void
}

export default function SchedulePreviewPanel({ semesterId, placed, onClose }: Props) {
  const { state, dispatch } = useDegree()
  const { courseMap } = useCoursesStore()
  const [page, setPage] = useState(0)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const semBlockers = state.blockers.filter(b => b.semesterId === semesterId)
  const configs = getAllConfigs(placed, semBlockers, courseMap)
  const perPage = 3
  const totalPages = Math.ceil(configs.length / perPage)
  const visible = configs.slice(page * perPage, (page + 1) * perPage)

  const canPrev = page > 0
  const canNext = page < totalPages - 1

  function applyConfig(config: Config) {
    for (const { courseId, optionId, recitationOptionId } of config.choices) {
      if (optionId) dispatch({ type: 'SET_LECTURE_OPTION', courseId, semesterId, optionId })
      if (recitationOptionId !== undefined) dispatch({ type: 'SET_RECITATION_OPTION', courseId, semesterId, optionId: recitationOptionId })
    }
    onClose()
  }

  // Find the current active config to highlight it
  const currentChoices = placed.map(p => `${p.courseId}:${p.lectureOptionId}:${p.recitationOptionId ?? ''}`).sort().join(',')

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-start pointer-events-none">
      {/* Backdrop for close */}
      <div className="absolute inset-0 pointer-events-auto" onClick={onClose} />

      {/* Panel — anchored above the bottom bar */}
      <div
        className="relative pointer-events-auto mb-[48px] ml-0 bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: 'calc(100vw - 256px - 1px)' }}  // full width minus catalogue
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
          <div>
            <p className="text-[13px] font-semibold text-stone-800">Schedule Combinations</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {configs.length} combination{configs.length !== 1 ? 's' : ''} · sorted by collisions
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        {/* Previews */}
        <div className="px-5 py-4 flex items-stretch gap-5">
          {/* Prev button */}
          <button
            onClick={() => canPrev && setPage(p => p - 1)}
            disabled={!canPrev}
            className={cn(
              'flex items-center justify-center w-8 rounded-lg transition-colors shrink-0 self-center',
              canPrev ? 'text-stone-600 hover:bg-stone-100' : 'text-stone-200 cursor-default'
            )}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Preview cards */}
          <div className="flex gap-5 flex-1 justify-center">
            {visible.map((config, idx) => {
              const configKey = config.choices.map(c => `${c.courseId}:${c.optionId}:${c.recitationOptionId ?? ''}`).sort().join(',')
              const isActive = configKey === currentChoices
              const isHovered = hoveredIdx === idx

              return (
                <div
                  key={idx}
                  className="relative flex flex-col items-center gap-2 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => applyConfig(config)}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 z-10 bg-stone-900 text-white rounded-full w-4 h-4 flex items-center justify-center">
                      <Check size={9} />
                    </div>
                  )}

                  {/* Mini schedule with hover blur + apply overlay */}
                  <div className={cn(
                    'relative rounded-xl overflow-hidden transition-all',
                    isActive ? 'ring-2 ring-stone-800 ring-offset-2' : 'ring-1 ring-stone-200',
                    isHovered && !isActive && 'ring-stone-400',
                  )}>
                    <div className={cn('transition-all duration-150', isHovered && 'blur-[2px] scale-[0.98]')}>
                      <MiniSchedule choices={config.choices} collisions={config.collisions} blockers={semBlockers} courseMap={courseMap} />
                    </div>

                    {/* Apply overlay on hover */}
                    {isHovered && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60">
                        <div className="bg-stone-900 text-white text-[11px] font-semibold px-4 py-1.5 rounded-full shadow-lg">
                          {isActive ? 'Current' : 'Apply'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collision count label */}
                  <div className="flex items-center gap-1.5">
                    {config.collisions === 0 ? (
                      <span className="text-[10px] text-emerald-600 font-medium">No collisions</span>
                    ) : (
                      <span className="text-[10px] text-red-600 font-medium">{config.collisions} collision{config.collisions > 1 ? 's' : ''}</span>
                    )}
                    {/* Option labels per course */}
                    <span className="text-[10px] text-stone-400">
                      {config.choices.map(c => {
                        const code = courseMap.get(c.courseId)?.code ?? ''
                        const l = c.optionId ? c.optionId.toUpperCase() : ''
                        const r = c.recitationOptionId ? `/${c.recitationOptionId.toUpperCase()}` : ''
                        return `${code}${l || r ? '-' : ''}${l}${r}`
                      }).join(' · ')}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Placeholder cards when fewer than 3 on the page */}
            {Array.from({ length: perPage - visible.length }).map((_, i) => (
              <div key={`ph-${i}`} style={{ width: PREVIEW_W }} />
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={() => canNext && setPage(p => p + 1)}
            disabled={!canNext}
            className={cn(
              'flex items-center justify-center w-8 rounded-lg transition-colors shrink-0 self-center',
              canNext ? 'text-stone-600 hover:bg-stone-100' : 'text-stone-200 cursor-default'
            )}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Page indicator */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 pb-3">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-colors',
                  i === page ? 'bg-stone-700' : 'bg-stone-300'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
