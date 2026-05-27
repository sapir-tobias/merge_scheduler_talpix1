import { LuCheck } from 'react-icons/lu'
import { cn } from '../../utils/utils'
import MiniSchedule, { PREVIEW_W } from './MiniSchedule'
import styles from './SchedulePreviewPanel.module.css'

export { PREVIEW_W }

export default function PreviewCard({ config, idx, isActive, isHovered, onHover, onLeave, onApply, blockers, courseMap, TEST_IDS }) {
  return (
    <div
      data-testid={`${TEST_IDS.PREVIEW.CARD}-${idx}`}
      className={styles.card}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onApply}
    >
      {/* Active indicator */}
      {isActive && (
        <div className={styles.activeIndicator}>
          <LuCheck size={9} />
        </div>
      )}

      {/* Mini schedule with hover blur + apply overlay */}
      <div className={cn(
        styles.miniWrap,
        isActive ? styles.miniWrapActive : styles.miniWrapInactive,
        isHovered && !isActive && styles.miniWrapHovered,
      )}>
        <div className={cn(styles.miniInner, isHovered && styles.miniInnerHovered)}>
          <MiniSchedule choices={config.choices} collisions={config.collisions} blockers={blockers} courseMap={courseMap} />
        </div>

        {/* Apply overlay on hover */}
        {isHovered && (
          <div className={styles.applyOverlay}>
            <div className={styles.applyPill}>
              {isActive ? 'Current' : 'Apply'}
            </div>
          </div>
        )}
      </div>

      {/* Collision count label */}
      <div className={styles.collisionLabel}>
        {config.collisions === 0 ? (
          <span className={styles.noCollisions}>No collisions</span>
        ) : (
          <span className={styles.hasCollisions}>{config.collisions} collision{config.collisions > 1 ? 's' : ''}</span>
        )}
        {/* Option labels per course */}
        <span className={styles.optionLabels}>
          {config.choices.map(c => {
            const code = courseMap.get(c.courseId)?.code ?? ''
            const l = c.optionId ? c.optionId.toUpperCase() : ''
            const r = c.recitationOptionId ? `/${c.recitationOptionId.toUpperCase()}` : ''
            return `${code}${l || r ? '-' : ''}${l}${r}`
          }).join(' · ')}
        </span>
      </div>
    </div>
  )
}
