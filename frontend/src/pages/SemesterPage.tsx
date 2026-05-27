import { useState, useMemo } from 'react'
import WeeklySchedule from '../components/WeeklySchedule'
import MonthCalendar, { type ExamCourse } from '../components/MonthCalendar'
import Catalogue from '../components/Catalogue'
import SemesterCourseList from '../components/SemesterCourseList'
import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import type { SemesterId } from '../types'
import styles from './SemesterPage.module.css'

interface Props { semesterId: SemesterId }

export default function SemesterPage({ semesterId }: Props) {
  const { state } = useDegree()
  const { courseMap } = useCoursesStore()
  const [markedDays, setMarkedDays] = useState<Set<string>>(new Set())

  function toggleDay(dateStr: string) {
    setMarkedDays(prev => {
      const next = new Set(prev)
      if (next.has(dateStr)) next.delete(dateStr)
      else next.add(dateStr)
      return next
    })
  }

  // date → [{name, faculty}] for snake colouring in the calendar
  const examMap = useMemo(() => {
    const map = new Map<string, ExamCourse[]>()
    for (const p of state.placed.filter(pl => pl.semesterId === semesterId)) {
      const course = courseMap.get(p.courseId)
      if (!course) continue
      const existing = map.get(course.examDate) ?? []
      map.set(course.examDate, [...existing, { name: course.name, faculty: course.faculty }])
    }
    return map
  }, [state.placed, semesterId, courseMap])

  // Exam dates that are too close to another exam (< minExamSeparationDays apart)
  const closeExamDates = useMemo(() => {
    const dates = [...examMap.keys()]
    const close = new Set<string>()
    for (let i = 0; i < dates.length; i++) {
      for (let j = i + 1; j < dates.length; j++) {
        const gap = Math.abs(new Date(dates[i]).getTime() - new Date(dates[j]).getTime()) / 86400000
        if (gap < state.filters.minExamSeparationDays) {
          close.add(dates[i])
          close.add(dates[j])
        }
      }
    }
    return close
  }, [examMap, state.filters.minExamSeparationDays])

  return (
    <div className={styles.container}>
      {/* Centre: schedule + calendar stacked above bottom bar */}
      <div className={styles.center}>
        <div className={styles.topRow}>
          <WeeklySchedule semesterId={semesterId} />
          <MonthCalendar
            markedDays={markedDays}
            onToggleDay={toggleDay}
            examMap={examMap}
            closeExamDates={closeExamDates}
          />
        </div>
        {/* Bottom bar spans full width below both schedule and calendar */}
        <SemesterCourseList semesterId={semesterId} />
      </div>

      {/* Catalogue: full height on the far right */}
      <Catalogue semesterId={semesterId} />
    </div>
  )
}
