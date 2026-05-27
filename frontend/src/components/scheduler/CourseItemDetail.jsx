import { cn } from '../../lib/utils'
import { DAY_LABEL } from '../../constants'
import styles from '../CourseItem.module.css'

function formatTime(h) {
  const hour = Math.floor(h)
  const min = h % 1 === 0.5 ? '30' : '00'
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${min}${suffix}`
}

function formatExamDate(dateStr) {
  if (!dateStr) return 'No exam'
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? 'No exam' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CourseItemDetail({ course, scoreInfo, prereqInfo }) {
  return (
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

      {prereqInfo.length > 0 && (
        <div>
          <p className={styles.sectionLabel}>Prerequisites</p>
          <div className={styles.prereqRow}>
            {prereqInfo.map((p, i) => (
              <span key={i} className={cn(
                styles.prereqTag,
                scoreInfo.prerequisitesMet ? styles.prereqMet : styles.prereqUnmet
              )}>
                {p.name}{p.offered ? '' : ' (not offered)'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
