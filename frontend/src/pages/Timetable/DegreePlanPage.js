import { useState, useEffect } from 'react'
import { useDegree } from '../../stores/DegreeContext'
import { useCoursesStore } from '../../stores/CoursesStore'
import { pickBestOption, pickFirstRecitationOption } from '../../utils/scoring'
import SemesterBox from '../../components/timetable/SemesterBox'
import ExemptionsBox from '../../components/timetable/ExemptionsBox'
import Catalogue from '../../components/timetable/Catalogue'
import { LuTrash2 } from 'react-icons/lu'
import { cn } from '../../utils/utils'
import { TEST_IDS } from '../../testIds'
import styles from './DegreePlanPage.module.css'

const YEAR_PAIRS = [[1, 2], [3, 4], [5, 6]]

export default function DegreePlanPage({ year }) {
  const { state, dispatch } = useDegree()
  const { courseMap } = useCoursesStore()
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

  function handleSemDrop(e, toSem) {
    const courseId = e.dataTransfer.getData('courseId')
    const source   = e.dataTransfer.getData('source')
    if (!courseId) return

    if (source === 'semester') {
      const fromSem = parseInt(e.dataTransfer.getData('fromSem'))
      if (fromSem !== toSem) dispatch({ type: 'MOVE_COURSE', courseId, fromSem, toSem })
    } else if (source === 'catalogue' || source === 'exemptions') {
      const course = courseMap.get(courseId)
      if (!course) return
      const semPlaced = state.placed.filter(p => p.semesterId === toSem)
      const bestOption = pickBestOption(course, semPlaced, toSem, courseMap)
      const recOpt = pickFirstRecitationOption(course)
      if (source === 'exemptions') dispatch({ type: 'REMOVE_EXEMPTION', courseId })
      dispatch({ type: 'ADD_COURSE', payload: { courseId, semesterId: toSem, lectureOptionId: bestOption, recitationOptionId: recOpt, locked: false } })
    }
  }

  function handleTrashDrop(e) {
    e.preventDefault()
    const courseId = e.dataTransfer.getData('courseId')
    const source   = e.dataTransfer.getData('source')
    if (!courseId) return
    if (source === 'semester') {
      const fromSem = parseInt(e.dataTransfer.getData('fromSem'))
      dispatch({ type: 'REMOVE_COURSE', courseId, semesterId: fromSem })
    } else if (source === 'exemptions') {
      dispatch({ type: 'REMOVE_EXEMPTION', courseId })
    }
    setTrashOver(false)
  }

  return (
    <div className={styles.container} data-testid={TEST_IDS.DEGREE_PLAN.CONTAINER}>

      {/* Exemptions panel */}
      <ExemptionsBox />

      {/* Main area: 3 year rows + trash */}
      <div className={styles.main}>

        {YEAR_PAIRS.map(([semA, semB], yi) => {
          const isActive = (yi + 1) === year
          return (
            <div
              key={yi}
              className={cn(
                styles.yearRow,
                !isActive && styles.yearRowInactive
              )}
              style={{ flex: isActive ? '2 1 0' : '1 1 0' }}
            >
              {[semA, semB].map(id => (
                <div key={id} className={styles.semCell}>
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
          data-testid={TEST_IDS.DEGREE_PLAN.TRASH_ZONE}
          className={cn(
            styles.trash,
            trashOver
              ? styles.trashActive
              : isDragging
                ? styles.trashDragging
                : styles.trashIdle
          )}
          onDragOver={e => { e.preventDefault(); setTrashOver(true) }}
          onDragLeave={() => setTrashOver(false)}
          onDrop={handleTrashDrop}
        >
          <LuTrash2 size={13} />
          <span className={styles.trashLabel}>Drop here to remove</span>
        </div>
      </div>

      {/* Catalogue */}
      <Catalogue showSemesterSelector draggable noScoring dropRemove />
    </div>
  )
}
