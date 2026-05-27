import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import { filterAndScore, pickFirstRecitationOption } from '../lib/scoring'
import CourseItem from './CourseItem'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'
import { TEST_IDS } from '../testIds'
import { SEMESTER_IDS } from '../constants'
import CatalogueFilters from './scheduler/CatalogueFilters'
import styles from './Catalogue.module.css'

export default function Catalogue({ semesterId: propSemId, showSemesterSelector, draggable, noScoring, dropRemove }) {
  const { state, dispatch } = useDegree()
  const { courses, courseMap } = useCoursesStore()
  const { filters } = state
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [targetSemId, setTargetSemId] = useState(propSemId ?? 1)

  // Credit slider bound, driven by the real dataset (so high-credit projects
  // are reachable rather than clamped to a hardcoded max).
  const creditMax = courses.reduce((m, c) => Math.max(m, Math.ceil(c.credits || 0)), 6)

  const semesterId = showSemesterSelector ? targetSemId : (propSemId ?? 1)

  const semPlaced = state.placed.filter(p => p.semesterId === semesterId)
  const inSemester = new Set(semPlaced.map(p => p.courseId))
  const allPlacedIds = new Set(state.placed.map(p => p.courseId))
  const exemptedIds = new Set(state.exemptions)

  const scored = noScoring
    ? courses
        .filter(c =>
          filters.faculties.has(c.faculty) &&
          c.credits >= filters.minCredits && c.credits <= filters.maxCredits &&
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

  function setFilter(key, val) {
    dispatch({ type: 'SET_FILTERS', filters: { [key]: val } })
  }

  function toggleFaculty(f) {
    const next = new Set(filters.faculties)
    if (next.has(f)) { if (next.size > 1) next.delete(f) }
    else next.add(f)
    setFilter('faculties', next)
  }

  function handleAdd(courseId) {
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

  function handleDropRemove(e) {
    const courseId = e.dataTransfer.getData('courseId')
    const source   = e.dataTransfer.getData('source')
    const fromSem  = parseInt(e.dataTransfer.getData('fromSem'))
    if (source === 'semester' && courseId && !isNaN(fromSem)) {
      dispatch({ type: 'REMOVE_COURSE', courseId, semesterId: fromSem })
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
        <CatalogueFilters
          filters={filters}
          setFilter={setFilter}
          toggleFaculty={toggleFaculty}
          creditMax={creditMax}
          noScoring={noScoring}
        />
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
