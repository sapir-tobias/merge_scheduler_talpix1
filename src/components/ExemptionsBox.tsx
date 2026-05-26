import { useState } from 'react'
import { useDegree } from '../state/DegreeContext'
import { COURSE_MAP } from '../data/courses'
import type { Faculty, SemesterId } from '../types'
import { cn } from '../lib/utils'
import { X, GripVertical, ShieldCheck } from 'lucide-react'

const FACULTY_PILL: Record<Faculty, string> = {
  cs:       'bg-blue-100 text-blue-700',
  math:     'bg-violet-100 text-violet-700',
  physics:  'bg-amber-100 text-amber-700',
  misc:    'bg-stone-100 text-stone-600',
}

export default function ExemptionsBox() {
  const { state, dispatch } = useDegree()
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const courseId = e.dataTransfer.getData('courseId')
    const source   = e.dataTransfer.getData('source')
    if (!courseId) return

    if (source === 'semester') {
      const fromSem = parseInt(e.dataTransfer.getData('fromSem')) as SemesterId
      dispatch({ type: 'REMOVE_COURSE', courseId, semesterId: fromSem })
    }
    // ADD_EXEMPTION also removes from placed automatically
    dispatch({ type: 'ADD_EXEMPTION', courseId })
    setDragOver(false)
  }

  return (
    <div
      className={cn(
        'w-52 shrink-0 flex flex-col border-r transition-colors',
        dragOver ? 'border-stone-400 bg-stone-50' : 'border-stone-200 bg-white'
      )}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="h-11 shrink-0 border-b border-stone-200 flex items-center gap-2 px-3">
        <ShieldCheck size={13} className="text-stone-400 shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-stone-600">
          Exemptions
        </span>
      </div>

      {/* Help text */}
      <p className="text-[10px] text-stone-400 px-3 pt-2.5 pb-2 leading-relaxed">
        Drop courses here to treat them as already completed — they satisfy prerequisites in all semesters.
      </p>
      <div className="mx-3 border-t border-stone-100 mb-1" />

      {/* Course list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {state.exemptions.length === 0 && (
          <p className="text-[10px] text-stone-300 text-center pt-6 leading-relaxed">
            No exemptions yet
          </p>
        )}
        {state.exemptions.map(courseId => {
          const course = COURSE_MAP.get(courseId)
          if (!course) return null
          return (
            <div
              key={courseId}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('courseId', courseId)
                e.dataTransfer.setData('source', 'exemptions')
              }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors group cursor-grab active:cursor-grabbing"
            >
              <GripVertical size={10} className="text-stone-300 shrink-0" />
              <span className={cn('text-[9px] font-bold px-1 py-0.5 rounded shrink-0', FACULTY_PILL[course.faculty])}>
                {course.code}
              </span>
              <span className="flex-1 text-[11px] text-stone-600 truncate">{course.name}</span>
              <button
                onClick={() => dispatch({ type: 'REMOVE_EXEMPTION', courseId })}
                className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all shrink-0"
              >
                <X size={10} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Drop hint when dragging over */}
      {dragOver && (
        <div className="mx-2 mb-2 border-2 border-dashed border-stone-300 rounded-lg py-3 text-center">
          <p className="text-[10px] text-stone-400">Drop to exempt</p>
        </div>
      )}
    </div>
  )
}
