import { cn } from './utils'
import Tooltip from './Tooltip'
import { toDateStr, shiftDate, isBodyDay, connectsRight, buildCells } from './snakeMap'
import styles from './MonthCalendar.module.css'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// Snake colours by course faculty
const FACULTY_BAR = {
  cs:       'rgba(147,197,253,0.85)',
  math:     'rgba(196,181,253,0.85)',
  physics:  'rgba(252,211,77,0.85)',
  misc: 'rgba(214,211,209,0.9)',
}
const FACULTY_HEAD = {
  cs:       '#3b82f6',
  math:     '#8b5cf6',
  physics:  '#f59e0b',
  misc: '#78716c',
}

export default function MonthGrid({
  year,
  month,
  mi,
  snakeMap,
  onToggleDay,
  closeExamDates,
  isToday,
  isMarked,
  TEST_IDS,
}) {
  const cells = buildCells(year, month)

  return (
    <>
      <div className={styles.monthTitleRow}>
        <span className={styles.monthTitle}>
          {MONTH_NAMES[month]}&nbsp;{year}
        </span>
      </div>

      <div className={styles.dayGrid}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${mi}-${i}`} className={styles.emptyCell} />

          const dateStr = toDateStr(year, month, day)
          const snake = snakeMap.get(dateStr)
          const isHead = snake?.type === 'head'
          const isBody = snake?.type === 'body'
          const headCourses = isHead ? snake.courses : []
          const isSingleHead = isHead && headCourses.length === 1
          const isMultiHead = isHead && headCourses.length > 1
          const bodyInfo = isBody ? snake : null

          const prevStr = shiftDate(dateStr, -1)
          const nextStr = shiftDate(dateStr, 1)

          const todayDay = isToday(year, month, day)
          const marked = isMarked(year, month, day)
          const isCloseExam = isHead && closeExamDates?.has(dateStr)

          // Bar rendering:
          //  - body days: left cap at first study day (prev not a body), right connects toward next body or head
          //  - single head: bar only from left (prev body) toward center; never extends right
          const showBodyBar = isBody
          const bodyLeftEdge = isBodyDay(snakeMap, prevStr) ? '0' : '50%'
          const bodyRightEdge = connectsRight(snakeMap, nextStr) ? '0' : '50%'
          const bodyLeftCap = bodyLeftEdge === '50%'
          const bodyRightCap = bodyRightEdge === '50%'

          const showHeadBar = isSingleHead && isBodyDay(snakeMap, prevStr)

          const faculty = isSingleHead ? headCourses[0].faculty : bodyInfo?.faculty ?? null

          const hoverTitle = isSingleHead
            ? `Exam: ${headCourses[0].name}`
            : isMultiHead
              ? `Exams:\n${headCourses.map(c => c.name).join('\n')}`
              : isBody
                ? `Studying for: ${bodyInfo.forExam}`
                : undefined

          const tooltipText = hoverTitle
            ? hoverTitle.replace(/\n/g, ' · ')
            : undefined

          const btn = (
            <button
              data-testid={`${TEST_IDS.MONTH_CALENDAR.DAY}-${dateStr}`}
              onClick={() => onToggleDay(dateStr)}
              className={styles.dayButton}
            >
              {/* Snake body bar */}
              {showBodyBar && (
                <div
                  className={cn(
                    styles.bar,
                    bodyLeftCap && !bodyRightCap && styles.roundedLeft,
                    !bodyLeftCap && bodyRightCap && styles.roundedRight,
                    bodyLeftCap && bodyRightCap && styles.roundedFull,
                  )}
                  style={{
                    left: bodyLeftEdge,
                    right: bodyRightEdge,
                    backgroundColor: faculty ? FACULTY_BAR[faculty] : 'rgba(200,200,200,0.7)',
                  }}
                />
              )}

              {/* Head bar: left side only, covering the full circle width */}
              {showHeadBar && (
                <div
                  className={styles.bar}
                  style={{
                    left: '0',
                    right: 'calc(50% - 16px)',
                    backgroundColor: faculty ? FACULTY_BAR[faculty] : 'rgba(200,200,200,0.7)',
                  }}
                />
              )}

              {/* Day circle */}
              <div
                className={cn(
                  styles.circle,
                  todayDay
                    ? styles.circleToday
                    : isSingleHead
                      ? styles.circleSingleHead
                      : isMultiHead
                        ? styles.circleMultiHead
                        : marked
                          ? styles.circleMarked
                          : styles.circleDefault
                )}
                style={{
                  backgroundColor: todayDay
                    ? '#1c1917'
                    : isSingleHead && faculty
                      ? FACULTY_HEAD[faculty]
                      : undefined,
                  outline: isCloseExam ? '2.5px solid #ef4444' : undefined,
                  outlineOffset: isCloseExam ? '2px' : undefined,
                }}
              >
                <span className={cn(
                  (marked || isMultiHead) && !isSingleHead && !todayDay && styles.dayNumberShift
                )}>
                  {day}
                </span>

                {/* Dots for marked days / multi-exam heads */}
                {(marked || isMultiHead) && !todayDay && !isSingleHead && (
                  <div className={styles.dots}>
                    {marked && <span className={styles.dotMarked} />}
                    {isMultiHead && <span className={styles.dotMulti} />}
                  </div>
                )}
              </div>
            </button>
          )

          return tooltipText ? (
            <Tooltip key={`${mi}-${day}`} text={tooltipText} side="top" className={styles.dayTooltip}>
              {btn}
            </Tooltip>
          ) : (
            <div key={`${mi}-${day}`} className={styles.dayWrap}>
              {btn}
            </div>
          )
        })}
      </div>
    </>
  )
}
