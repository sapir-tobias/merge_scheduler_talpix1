import { useRef, useEffect, useMemo } from 'react'
import { cn } from './utils'
import { TEST_IDS } from '../../testIds'
import { DATE_ONLY, shiftDate, buildSnakeMap, toDateStr } from './snakeMap'
import MonthGrid from './MonthGrid'
import styles from './MonthCalendar.module.css'

const WEEK_LABELS = ['S','M','T','W','T','F','S']

export default function MonthCalendar({ markedDays, onToggleDay, examMap, closeExamDates }) {
  const today = new Date()
  const scrollRef = useRef(null)
  const monthRefs = useRef(new Map())

  // Only date-only ('YYYY-MM-DD') keys are usable; courses with no final (or a
  // raw datetime) are dropped so none of the date math below can throw.
  const validExamMap = useMemo(
    () => new Map([...(examMap ?? new Map())].filter(([d]) => DATE_ONLY.test(d))),
    [examMap],
  )

  const snakeMap = useMemo(() => buildSnakeMap(validExamMap), [validExamMap])

  // Month range: start from earlier of today or month containing first snake day
  const months = useMemo(() => {
    let fromYear = today.getFullYear()
    let fromMonth = today.getMonth()

    if (validExamMap.size > 0) {
      const firstExam = [...validExamMap.keys()].sort()[0]
      // Snake starts 7 days before first exam
      const snakeStart = shiftDate(firstExam, -7)
      const snakeDate = new Date(snakeStart + 'T12:00:00')
      if (snakeDate < new Date(fromYear, fromMonth, 1)) {
        fromYear = snakeDate.getFullYear()
        fromMonth = snakeDate.getMonth()
      }
    }

    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(fromYear, fromMonth + i, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }, [validExamMap])

  const examDatesKey = useMemo(
    () => [...validExamMap.keys()].sort().join(','),
    [validExamMap]
  )

  // Auto-scroll to the month containing the first snake day
  useEffect(() => {
    if (validExamMap.size === 0) return
    const firstExam = [...validExamMap.keys()].sort()[0]
    const snakeStart = shiftDate(firstExam, -7)
    const d = new Date(snakeStart + 'T12:00:00')
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const el = monthRefs.current.get(key)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [examDatesKey])

  const isToday  = (y, m, d) =>
    today.getFullYear() === y && today.getMonth() === m && today.getDate() === d
  const isMarked = (y, m, d) => markedDays.has(toDateStr(y, m, d))

  return (
    <div className={styles.container} data-testid={TEST_IDS.MONTH_CALENDAR.CONTAINER}>

      {/* Fixed weekday header */}
      <div className={styles.weekHeader}>
        {WEEK_LABELS.map((l, i) => (
          <div key={i} className={styles.weekCell}>
            <span className={styles.weekLabel}>{l}</span>
          </div>
        ))}
      </div>

      {/* Scrollable month blocks */}
      <div ref={scrollRef} className={styles.scrollArea}>
        {months.map(({ year, month }, mi) => {
          const monthKey = `${year}-${month}`

          return (
            <div
              key={monthKey}
              ref={el => {
                if (el) monthRefs.current.set(monthKey, el)
                else monthRefs.current.delete(monthKey)
              }}
              className={cn(mi > 0 && styles.monthDivider)}
            >
              <MonthGrid
                year={year}
                month={month}
                mi={mi}
                snakeMap={snakeMap}
                onToggleDay={onToggleDay}
                closeExamDates={closeExamDates}
                isToday={isToday}
                isMarked={isMarked}
                TEST_IDS={TEST_IDS}
              />
            </div>
          )
        })}

        <div className={styles.bottomSpacer} />
      </div>
    </div>
  )
}
