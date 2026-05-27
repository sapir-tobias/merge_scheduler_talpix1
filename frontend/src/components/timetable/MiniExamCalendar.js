import { cn } from './utils'
import Tooltip from './Tooltip'
import styles from './MiniExamCalendar.module.css'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const WEEK_LABELS = ['S','M','T','W','T','F','S']

function buildCells(year, month) {
  const lead  = new Date(year, month, 1).getDay()
  const total = new Date(year, month + 1, 0).getDate()
  const cells = [
    ...Array(lead).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function MiniExamCalendar({ examMap }) {
  if (examMap.size === 0) return null

  const dates = Array.from(examMap.keys()).sort()
  const first = new Date(dates[0])
  const last  = new Date(dates[dates.length - 1])

  const months = []
  let cur = new Date(first.getFullYear(), first.getMonth(), 1)
  const end = new Date(last.getFullYear(), last.getMonth(), 1)
  while (cur <= end) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() })
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }

  return (
    <div className={styles.container}>
      <p className={styles.title}>
        Exam Period
      </p>

      {/* Fixed weekday row */}
      <div className={styles.weekRow}>
        {WEEK_LABELS.map((l, i) => (
          <div key={i} className={styles.weekCell}>
            <span className={styles.weekLabel}>{l}</span>
          </div>
        ))}
      </div>

      {months.map(({ year, month }, mi) => {
        const cells = buildCells(year, month)
        return (
          <div key={`${year}-${month}`} className={cn(mi > 0 ? styles.monthBlockSpaced : styles.monthBlock)}>
            <p className={styles.monthLabel}>
              {MONTH_NAMES[month]} {year}
            </p>
            <div className={styles.daysGrid}>
              {cells.map((day, i) => {
                if (day === null) return <div key={`e${i}`} className={styles.emptyCell} />
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const names = examMap.get(dateStr)
                const hasExam = !!names

                const circle = (
                  <div
                    className={cn(
                      styles.circle,
                      hasExam ? styles.circleExam : styles.circlePlain
                    )}
                  >
                    {day}
                  </div>
                )
                return hasExam ? (
                  <Tooltip key={i} text={names.join(' · ')} side="top" className={styles.tooltipWrap}>
                    {circle}
                  </Tooltip>
                ) : (
                  <div key={i}>{circle}</div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
