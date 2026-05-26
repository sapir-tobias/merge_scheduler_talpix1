import { useState, useEffect } from 'react'
import { useDegree } from '../state/DegreeContext'
import { COURSE_MAP } from '../data/courses'
import { pickBestOption, pickFirstRecitationOption } from '../lib/scoring'
import SemesterBox from '../components/SemesterBox'
import ExemptionsBox from '../components/ExemptionsBox'
import Catalogue from '../components/Catalogue'
import type { SemesterId, PlanYear } from '../types'
import { Trash2 } from 'lucide-react'
import { cn } from '../lib/utils'

const YEAR_PAIRS: [SemesterId, SemesterId][] = [[1, 2], [3, 4], [5, 6]]

interface Props { year: PlanYear }

export default function DegreePlanPage({ year }: Props) {
  const { state, dispatch } = useDegree()
  const [trashOver, setTrashOver] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const onStart = () => setIsDragging(true)
    const onEnd   = () => setIsDragging(false)
    document.addEventListener('dragstart', onStart)
    document.addEventListener('dragend',   onEnd)
    return () => {
      document.removeEventListener('dragstart', onStart)
      document.removeEventListener('dragend',   onEnd)
    }
  }, [])

  function handleSemDrop(e: React.DragEvent, toSem: SemesterId) {
    const courseId = e.dataTransfer.getData('courseId')
    const source   = e.dataTransfer.getData('source')
    if (!courseId) return

    if (source === 'semester') {
      const fromSem = parseInt(e.dataTransfer.getData('fromSem')) as SemesterId
      if (fromSem !== toSem) dispatch({ type: 'MOVE_COURSE', courseId, fromSem, toSem })
    } else if (source === 'catalogue' || source === 'exemptions') {
      const course = COURSE_MAP.get(courseId)
      if (!course) return
      const semPlaced = state.placed.filter(p => p.semesterId === toSem)
      const bestOption = pickBestOption(course, semPlaced, toSem)
      const recOpt = pickFirstRecitationOption(course)
      if (source === 'exemptions') dispatch({ type: 'REMOVE_EXEMPTION', courseId })
      dispatch({ type: 'ADD_COURSE', payload: { courseId, semesterId: toSem, lectureOptionId: bestOption, recitationOptionId: recOpt, locked: false } })
    }
  }

  function handleTrashDrop(e: React.DragEvent) {
    e.preventDefault()
    const courseId = e.dataTransfer.getData('courseId')
    const source   = e.dataTransfer.getData('source')
    if (!courseId) return
    if (source === 'semester') {
      const fromSem = parseInt(e.dataTransfer.getData('fromSem')) as SemesterId
      dispatch({ type: 'REMOVE_COURSE', courseId, semesterId: fromSem })
    } else if (source === 'exemptions') {
      dispatch({ type: 'REMOVE_EXEMPTION', courseId })
    }
    setTrashOver(false)
  }

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* Exemptions panel */}
      <ExemptionsBox />

      {/* Main area: 3 year rows + trash */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 pt-4 pb-3 gap-3">

        {YEAR_PAIRS.map(([semA, semB], yi) => {
          const isActive = (yi + 1) === year
          return (
            <div
              key={yi}
              className={cn(
                'flex gap-3 min-h-0 transition-opacity',
                !isActive && 'opacity-70'
              )}
              style={{ flex: isActive ? '2 1 0' : '1 1 0' }}
            >
              {[semA, semB].map(id => (
                <div key={id} className="flex-1 min-w-0 min-h-0">
                  <SemesterBox
                    semesterId={id}
                    showCalendar={isActive}
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleSemDrop}
                  />
                </div>
              ))}
            </div>
          )
        })}

        {/* Trash zone */}
        <div
          className={cn(
            'shrink-0 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed transition-all',
            trashOver
              ? 'border-red-500 bg-red-100 text-red-600 font-semibold'
              : isDragging
                ? 'border-red-300 bg-red-50/60 text-red-400'
                : 'border-stone-200 text-stone-400'
          )}
          onDragOver={e => { e.preventDefault(); setTrashOver(true) }}
          onDragLeave={() => setTrashOver(false)}
          onDrop={handleTrashDrop}
        >
          <Trash2 size={13} />
          <span className="text-[11px] font-medium">Drop here to remove</span>
        </div>
      </div>

      {/* Catalogue */}
      <Catalogue showSemesterSelector draggable noScoring dropRemove />
    </div>
  )
}
