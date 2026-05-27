import { useState } from 'react'
import { AlertTriangle, AlertOctagon, ChevronDown, ChevronUp, Plus, Check, ArrowRight, GripVertical } from 'lucide-react'
import { cn } from '../lib/utils'
import Tooltip from './Tooltip'
import type { Course, CourseScore, Faculty } from '../types'
import { useCoursesStore } from '../stores/CoursesStore'
import { TEST_IDS } from '../testIds'
import styles from './CourseItem.module.css'

const FACULTY_BADGE: Record<Faculty, string> = {
  cs:      styles.badgeCs,
  math:    styles.badgeMath,
  physics: styles.badgePhysics,
  misc:    styles.badgeMisc,
}
const FACULTY_LABEL: Record<Faculty, string> = {
  cs: 'CS', math: 'Math', physics: 'Phys', misc: 'Misc',
}
const DAY_LABEL: Record<string, string> = {
  sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
}
const TERM_LABEL: Record<string, string> = {
  a: 'Sem A', b: 'Sem B', either: 'A / B', yearly: 'Yearly', summer: 'Summer',
}

function formatTime(h: number) {
  const hour = Math.floor(h)
  const min = h % 1 === 0.5 ? '30' : '00'
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${min}${suffix}`
}

function formatExamDate(dateStr: string) {
  if (!dateStr) return 'No exam'
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? 'No exam' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
  course: Course
  scoreInfo: CourseScore
  added: boolean
  addedToCurrentSem: boolean
  onAdd?: () => void
  draggable?: boolean
}

export default function CourseItem({ course, scoreInfo, added, addedToCurrentSem, onAdd, draggable }: Props) {
  const { courseMap } = useCoursesStore()
  const [expanded, setExpanded] = useState(false)
  const prereqNames = course.prerequisites.map(id => courseMap.get(id)?.name ?? id)

  return (
    <div
      data-testid={`${TEST_IDS.COURSE_ITEM.ROW}-${course.id}`}
      className={cn(
        styles.root,
        scoreInfo.critical && !addedToCurrentSem && styles.critical,
        draggable && styles.draggable
      )}
      draggable={draggable}
      onDragStart={draggable ? e => {
        e.dataTransfer.setData('courseId', course.id)
        e.dataTransfer.setData('source', 'catalogue')
      } : undefined}
    >
      {/* Slim row */}
      <div className={styles.row}>
        {draggable && (
          <GripVertical size={11} className={styles.grip} />
        )}

        <span className={cn(styles.badge, FACULTY_BADGE[course.faculty])}>
          {FACULTY_LABEL[course.faculty]}
        </span>

        <div className={styles.info}>
          <p className={styles.name}>{course.name}</p>
          <p className={styles.meta}>
            {course.code} · {course.credits} cr
            {course.term && TERM_LABEL[course.term] ? ` · ${TERM_LABEL[course.term]}` : ''}
            {course.mandatoryAttendance ? ' · נ״ח' : ''}
          </p>
        </div>

        <div className={styles.actions}>
          {scoreInfo.critical && !addedToCurrentSem && (
            <Tooltip text="Critical: scheduling breach" className={styles.shrink0}>
              <AlertOctagon size={13} className={styles.iconCritical} />
            </Tooltip>
          )}
          {scoreInfo.warning && !scoreInfo.critical && !addedToCurrentSem && (
            <Tooltip text="Minor scheduling issue" className={styles.shrink0}>
              <AlertTriangle size={13} className={styles.iconWarning} />
            </Tooltip>
          )}

          <button
            data-testid={`${TEST_IDS.COURSE_ITEM.EXPAND_BUTTON}-${course.id}`}
            onClick={() => setExpanded(e => !e)}
            className={styles.expandBtn}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {onAdd && (
            <Tooltip
              text={added && !addedToCurrentSem ? 'Move to this semester' : addedToCurrentSem ? 'Already here' : 'Add to schedule'}
              className={styles.shrink0}
            >
              <button
                data-testid={`${TEST_IDS.COURSE_ITEM.ADD_BUTTON}-${course.id}`}
                onClick={onAdd}
                disabled={addedToCurrentSem}
                className={cn(
                  styles.addBtn,
                  addedToCurrentSem
                    ? styles.addBtnHere
                    : added
                      ? styles.addBtnMove
                      : styles.addBtnNew
                )}
              >
                {addedToCurrentSem ? <Check size={11} /> : added ? <ArrowRight size={11} /> : <Plus size={11} />}
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className={styles.detail}>
          <p className={styles.description}>{course.description}</p>

          {course.lectureOptions.length > 0 && (
            <div>
              <p className={styles.sectionLabel}>Lecture times</p>
              {course.lectureOptions.map(opt => (
                <div key={opt.id} className={styles.optionRow}>
                  <span className={styles.optionId}>{opt.id.toUpperCase()}:</span>
                  {opt.slots.map((slot, si) => (
                    <span key={si} className={styles.lectureSlot}>
                      {DAY_LABEL[slot.day]} {formatTime(slot.startHour)}–{formatTime(slot.endHour)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
          {course.lectureOptions.length === 0 && (
            <p className={styles.labOnly}>Lab / recitation only — no fixed lectures</p>
          )}
          {course.recitationOptions && course.recitationOptions.length > 0 && (
            <div>
              <p className={styles.sectionLabel}>Recitation times</p>
              {course.recitationOptions.map(opt => (
                <div key={opt.id} className={styles.optionRow}>
                  <span className={styles.optionId}>{opt.id.toUpperCase()}:</span>
                  {opt.slots.map((slot, si) => (
                    <span key={si} className={styles.recitationSlot}>
                      {DAY_LABEL[slot.day]} {formatTime(slot.startHour)}–{formatTime(slot.endHour)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className={styles.statRow}>
            <div>
              <p className={styles.sectionLabel}>Exam</p>
              <p className={styles.statValue}>{formatExamDate(course.examDate)}</p>
            </div>
            {course.mandatoryAttendance && (
              <div>
                <p className={styles.sectionLabel}>Attendance</p>
                <p className={styles.statValue}>Required</p>
              </div>
            )}
            {scoreInfo.examSeparationMin >= 0 && (
              <div>
                <p className={styles.sectionLabel}>Gap</p>
                <p className={scoreInfo.critical ? styles.statValueCritical : styles.statValue}>
                  {scoreInfo.examSeparationMin}d
                </p>
              </div>
            )}
            {scoreInfo.collisions > 0 && (
              <div>
                <p className={styles.sectionLabel}>Collisions</p>
                <p className={styles.statValueWarning}>{scoreInfo.collisions}</p>
              </div>
            )}
          </div>

          {prereqNames.length > 0 && (
            <div>
              <p className={styles.sectionLabel}>Prerequisites</p>
              <div className={styles.prereqRow}>
                {prereqNames.map(name => (
                  <span key={name} className={cn(
                    styles.prereqTag,
                    scoreInfo.prerequisitesMet ? styles.prereqMet : styles.prereqUnmet
                  )}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
