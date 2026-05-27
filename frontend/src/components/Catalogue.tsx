import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import { filterAndScore, pickFirstRecitationOption } from '../lib/scoring'
import CourseItem from './CourseItem'
import type { Faculty, SemesterId } from '../types'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'
import { TEST_IDS } from '../testIds'
import styles from './Catalogue.module.css'

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
      data-testid={TEST_IDS.CATALOGUE.CONTAINER}
      className={styles.container}
      onDragOver={dropRemove ? (e => e.preventDefault()) : undefined}
      onDrop={dropRemove ? handleDropRemove : undefined}
    >

      {/* Semester selector (degree plan mode) */}
      {showSemesterSelector && !noScoring && (
        <div className={styles.semesterSelect}>
          <p className={styles.semesterSelectLabel}>Add to semester</p>
          <div className={styles.semesterBtnRow}>
            {SEMESTER_IDS.map(id => (
              <button
                key={id}
                data-testid={`${TEST_IDS.CATALOGUE.SEMESTER_SELECT}-${id}`}
                onClick={() => setTargetSemId(id)}
                className={cn(
                  styles.semesterBtn,
                  targetSemId === id && styles.semesterBtnActive
                )}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search header */}
      <div className={styles.searchHeader}>
        <div className={styles.searchBox}>
          <Search size={11} className={styles.searchIcon} />
          <input
            type="text"
            data-testid={TEST_IDS.CATALOGUE.SEARCH_INPUT}
            value={filters.searchQuery}
            onChange={e => setFilter('searchQuery', e.target.value)}
            placeholder="Search courses…"
            className={styles.searchInput}
          />
        </div>
        <button
          data-testid={TEST_IDS.CATALOGUE.FILTER_TOGGLE}
          onClick={() => setFiltersOpen(o => !o)}
          className={cn(
            styles.filterToggle,
            filtersOpen && styles.filterToggleActive
          )}
        >
          <SlidersHorizontal size={13} />
        </button>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className={styles.filterPanel}>
          <div>
            <p className={styles.sectionLabel}>Faculty</p>
            <div className={styles.facultyRow}>
              {FACULTIES.map(f => (
                <button
                  key={f.id}
                  data-testid={`${TEST_IDS.CATALOGUE.FACULTY_FILTER}-${f.id}`}
                  onClick={() => toggleFaculty(f.id)}
                  className={cn(
                    styles.facultyBtn,
                    filters.faculties.has(f.id) && styles.facultyBtnActive
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={styles.sectionLabel}>
              Credits {filters.minCredits}–{filters.maxCredits}
            </p>
            <div className={styles.creditsRow}>
              <div className={styles.creditsCol}>
                <p className={styles.creditsColLabel}>Min</p>
                <input type="range" min={1} max={6} value={filters.minCredits}
                  data-testid={TEST_IDS.CATALOGUE.CREDITS_MIN}
                  onChange={e => setFilter('minCredits', +e.target.value)}
                  className={styles.range} />
              </div>
              <div className={styles.creditsCol}>
                <p className={styles.creditsColLabel}>Max</p>
                <input type="range" min={1} max={6} value={filters.maxCredits}
                  data-testid={TEST_IDS.CATALOGUE.CREDITS_MAX}
                  onChange={e => setFilter('maxCredits', +e.target.value)}
                  className={styles.range} />
              </div>
            </div>
          </div>

          {!noScoring && (
            <div>
              <p className={styles.sectionLabel}>
                Max collisions: {filters.maxCollisions}
              </p>
              <input type="range" min={0} max={5} value={filters.maxCollisions}
                data-testid={TEST_IDS.CATALOGUE.MAX_COLLISIONS}
                onChange={e => setFilter('maxCollisions', +e.target.value)}
                className={styles.range} />
            </div>
          )}

          {!noScoring && (
            <div>
              <p className={styles.sectionLabel}>
                Min exam gap: {filters.minExamSeparationDays}d
              </p>
              <input type="range" min={0} max={14} value={filters.minExamSeparationDays}
                data-testid={TEST_IDS.CATALOGUE.MIN_EXAM_GAP}
                onChange={e => setFilter('minExamSeparationDays', +e.target.value)}
                className={styles.range} />
            </div>
          )}

          <div className={styles.toggleRow}>
            <p className={styles.toggleLabel}>Ignore prereqs</p>
            <button
              data-testid={TEST_IDS.CATALOGUE.IGNORE_PREREQS_TOGGLE}
              onClick={() => setFilter('ignorePrerequisites', !filters.ignorePrerequisites)}
              className={cn(
                styles.toggleTrack,
                filters.ignorePrerequisites && styles.toggleTrackOn
              )}
            >
              <span className={cn(
                styles.toggleKnob,
                filters.ignorePrerequisites && styles.toggleKnobOn
              )} />
            </button>
          </div>
        </div>
      )}

      {/* Section label */}
      <div className={styles.listHeader}>
        <span className={styles.listCount}>
          {scored.length} {noScoring ? 'courses' : 'available'}
        </span>
        {!noScoring && <span className={styles.listHint}>Best fit ↑</span>}
      </div>
      <div className={styles.divider} />

      {/* Course list */}
      <div className={styles.courseList} data-testid={TEST_IDS.CATALOGUE.COURSE_LIST}>
        {scored.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
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
