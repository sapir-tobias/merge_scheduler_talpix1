import { cn } from '../../lib/utils'
import { formatTime, DAY_LABEL } from '../../lib/weeklyLayout'

export default function LectureOptionPanel({
  panel,
  panelCourse,
  panelPlaced,
  semesterId,
  dispatch,
  setPanel,
  styles,
  TEST_IDS,
}) {
  return (
    <div
      data-testid={TEST_IDS.WEEKLY.OPTION_PANEL}
      className={styles.optionPanel}
      style={{
        position: 'fixed',
        top: Math.min(panel.rect.bottom + 6, window.innerHeight - 280),
        left: Math.min(panel.rect.left, window.innerWidth - 230),
      }}
      onClick={e => e.stopPropagation()}
    >
      <p className={styles.panelTitle}>
        {panelCourse.name}
      </p>

      {panelCourse.lectureOptions.length > 0 && (
        <>
          <p className={styles.panelSectionLabel}>
            Lecture options
          </p>
          {panelCourse.lectureOptions.map(opt => {
            const active = panelPlaced.lectureOptionId === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => {
                  dispatch({ type: 'SET_LECTURE_OPTION', courseId: panel.courseId, semesterId, optionId: opt.id })
                  setPanel(null)
                }}
                className={cn(
                  styles.optionBtn,
                  active && styles.optionBtnActiveLect
                )}
              >
                <span className={cn(styles.optionRadio, active && styles.optionRadioActive)} />
                <div>
                  {opt.slots.map((s, i) => (
                    <p key={i} className={cn(styles.optionSlot, active && styles.optionSlotActive)}>
                      {DAY_LABEL[s.day]} {formatTime(s.startHour)}–{formatTime(s.endHour)}
                    </p>
                  ))}
                </div>
              </button>
            )
          })}
        </>
      )}

      {panelCourse.recitationOptions && panelCourse.recitationOptions.length > 0 && (
        <>
          <p className={styles.panelSectionLabel}>
            Recitation options
          </p>
          {panelCourse.recitationOptions.map(opt => {
            const active = panelPlaced.recitationOptionId === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => {
                  dispatch({ type: 'SET_RECITATION_OPTION', courseId: panel.courseId, semesterId, optionId: opt.id })
                  setPanel(null)
                }}
                className={cn(
                  styles.optionBtn,
                  active && styles.optionBtnActiveRec
                )}
              >
                <span className={cn(styles.optionRadio, active && styles.optionRadioActive)} />
                <div>
                  {opt.slots.map((s, i) => (
                    <p key={i} className={cn(styles.optionSlot, active && styles.optionSlotActive)}>
                      {DAY_LABEL[s.day]} {formatTime(s.startHour)}–{formatTime(s.endHour)}
                    </p>
                  ))}
                </div>
              </button>
            )
          })}
        </>
      )}

      <div className={styles.panelFooter}>
        <button
          onClick={() => { dispatch({ type: 'REMOVE_COURSE', courseId: panel.courseId, semesterId }); setPanel(null) }}
          className={styles.panelRemoveBtn}
        >
          Remove from schedule
        </button>
      </div>
    </div>
  )
}
