import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import { filterAndScore, pickFirstRecitationOption } from '../lib/scoring'
import CourseItem from './CourseItem'
import type { Faculty, SemesterId } from '../types'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'

const FACULTIES: { id: Faculty; label: string }[] = [
  { id: 'cs', label: 'CS' },
  { id: 'math', label: 'Math' },
  { id: 'physics', label: 'Phys' },
  { id: 'misc', label: 'Misc' },
]

const SEMESTER_IDS: SemesterId[] = [1, 2, 3, 4, 5, 6]

interface Props {
  semesterId?: SemesterId
  showSemesterSelector?: boolean
  draggable?: boolean
  noScoring?: boolean
  dropRemove?: boolean
}

export default function Catalogue({ semesterId: propSemId, showSemesterSelector, draggable, noScoring, dropRemove }: Props) {
  const { state, dispatch } = useDegree()
  const { courses, courseMap } = useCoursesStore()
  const { filters } = state
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [targetSemId, setTargetSemId] = useState<SemesterId>(propSemId ?? 1)

  const semesterId = showSemesterSelector ? targetSemId : (propSemId ?? 1)

  const semPlaced = state.placed.filter(p => p.semesterId === semesterId)
  const inSemester = new Set(semPlaced.map(p => p.courseId))
  const allPlacedIds = new Set(state.placed.map(p => p.courseId))
  const exemptedIds = new Set(state.exemptions)

  const scored = noScoring
    ? courses
        .filter(c =>
          filters.faculties.has(c.faculty) &&
          (!filters.searchQuery ||
            c.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
            c.code.toLowerCase().includes(filters.searchQuery.toLowerCase()))
        )
        .map(c => ({
          course: c,
          courseId: c.id,
          score: 0,
          collisions: 0,
          examSeparationMin: -1,
          prerequisitesMet: true,
          warning: false,
          critical: false,
          bestLectureOptionId: c.lectureOptions[0]?.id ?? 'a',
        }))
    : filterAndScore(courses, state.placed, state.exemptions, semesterId, filters, inSemester, courseMap)

  function setFilter<K extends keyof typeof filters>(key: K, val: (typeof filters)[K]) {
    dispatch({ type: 'SET_FILTERS', filters: { [key]: val } })
  }

  function toggleFaculty(f: Faculty) {
    const next = new Set(filters.faculties)
    if (next.has(f)) { if (next.size > 1) next.delete(f) }
    else next.add(f)
    setFilter('faculties', next)
  }

  function handleAdd(courseId: string) {
    const course = courseMap.get(courseId)
    const entry = scored.find(s => s.course.id === courseId)
    const bestOption = entry?.bestLectureOptionId ?? course?.lectureOptions[0]?.id ?? ''
    dispatch({
      type: 'ADD_COURSE',
      payload: {
        courseId, semesterId, lectureOptionId: bestOption,
        recitationOptionId: course ? pickFirstRecitationOption(course) : undefined,
        locked: false,
      },
    })
  }

  function handleDropRemove(e: React.DragEvent) {
    const courseId = e.dataTransfer.getData('courseId')
    const source   = e.dataTransfer.getData('source')
    const fromSem  = parseInt(e.dataTransfer.getData('fromSem'))
    if (source === 'semester' && courseId && !isNaN(fromSem)) {
      dispatch({ type: 'REMOVE_COURSE', courseId, semesterId: fromSem as SemesterId })
    }
  }

  return (
    <div
      className="w-64 shrink-0 border-l border-stone-200 flex flex-col overflow-hidden bg-white"
      onDragOver={dropRemove ? (e => e.preventDefault()) : undefined}
      onDrop={dropRemove ? handleDropRemove : undefined}
    >

      {/* Semester selector (degree plan mode) */}
      {showSemesterSelector && !noScoring && (
        <div className="shrink-0 border-b border-stone-100 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-stone-400 mb-1.5">Add to semester</p>
          <div className="flex gap-1">
            {SEMESTER_IDS.map(id => (
              <button
                key={id}
                onClick={() => setTargetSemId(id)}
                className={cn(
                  'flex-1 text-[10px] font-semibold py-1 rounded-md transition-colors',
                  targetSemId === id
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                )}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search header */}
      <div className="h-11 shrink-0 border-b border-stone-200 flex items-center gap-1.5 px-3">
        <div className="flex items-center gap-1.5 flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2.5 h-[28px]">
          <Search size={11} className="text-stone-400 shrink-0" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={e => setFilter('searchQuery', e.target.value)}
            placeholder="Search courses…"
            className="flex-1 min-w-0 text-[11px] bg-transparent border-0 focus:outline-none text-stone-700 placeholder:text-stone-400"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className={cn(
            'shrink-0 p-1.5 rounded-lg transition-colors',
            filtersOpen ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          )}
        >
          <SlidersHorizontal size={13} />
        </button>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="shrink-0 border-b border-stone-200 px-3 py-3 space-y-3 bg-stone-50/60">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-1.5">Faculty</p>
            <div className="flex flex-wrap gap-1">
              {FACULTIES.map(f => (
                <button
                  key={f.id}
                  onClick={() => toggleFaculty(f.id)}
                  className={cn(
                    'text-[10px] px-2 py-1 rounded-md font-medium transition-colors',
                    filters.faculties.has(f.id)
                      ? 'bg-stone-900 text-white'
                      : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-400'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-1.5">
              Credits {filters.minCredits}–{filters.maxCredits}
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-[9px] text-stone-400 mb-0.5">Min</p>
                <input type="range" min={1} max={6} value={filters.minCredits}
                  onChange={e => setFilter('minCredits', +e.target.value)}
                  className="w-full h-1 accent-stone-800" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] text-stone-400 mb-0.5">Max</p>
                <input type="range" min={1} max={6} value={filters.maxCredits}
                  onChange={e => setFilter('maxCredits', +e.target.value)}
                  className="w-full h-1 accent-stone-800" />
              </div>
            </div>
          </div>

          {!noScoring && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-1.5">
                Max collisions: {filters.maxCollisions}
              </p>
              <input type="range" min={0} max={5} value={filters.maxCollisions}
                onChange={e => setFilter('maxCollisions', +e.target.value)}
                className="w-full h-1 accent-stone-800" />
            </div>
          )}

          {!noScoring && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-1.5">
                Min exam gap: {filters.minExamSeparationDays}d
              </p>
              <input type="range" min={0} max={14} value={filters.minExamSeparationDays}
                onChange={e => setFilter('minExamSeparationDays', +e.target.value)}
                className="w-full h-1 accent-stone-800" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Ignore prereqs</p>
            <button
              onClick={() => setFilter('ignorePrerequisites', !filters.ignorePrerequisites)}
              className={cn(
                'relative w-8 h-4 rounded-full transition-colors',
                filters.ignorePrerequisites ? 'bg-stone-900' : 'bg-stone-300'
              )}
            >
              <span className={cn(
                'absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm',
                filters.ignorePrerequisites ? 'left-[18px]' : 'left-0.5'
              )} />
            </button>
          </div>
        </div>
      )}

      {/* Section label */}
      <div className="px-3 pt-2.5 pb-1.5 shrink-0 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
          {scored.length} {noScoring ? 'courses' : 'available'}
        </span>
        {!noScoring && <span className="text-[10px] text-stone-400">Best fit ↑</span>}
      </div>
      <div className="mx-3 border-t border-stone-100 shrink-0" />

      {/* Course list */}
      <div className="flex-1 overflow-y-auto">
        {scored.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[11px] text-stone-300 text-center px-4 leading-relaxed">
              No courses match your filters
            </p>
          </div>
        ) : (
          scored.map(({ course, ...scoreInfo }) => (
            <CourseItem
              key={course.id}
              course={course}
              scoreInfo={scoreInfo}
              added={allPlacedIds.has(course.id) || exemptedIds.has(course.id)}
              addedToCurrentSem={inSemester.has(course.id)}
              onAdd={noScoring ? undefined : () => handleAdd(course.id)}
              draggable={draggable}
            />
          ))
        )}
      </div>
    </div>
  )
}
