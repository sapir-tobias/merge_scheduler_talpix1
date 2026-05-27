import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import { TEST_IDS } from '../testIds'
import { getAllConfigs } from '../lib/previewConfigs'
import PreviewCard, { PREVIEW_W } from './scheduler/PreviewCard'
import styles from './SchedulePreviewPanel.module.css'

export default function SchedulePreviewPanel({ semesterId, placed, onClose }) {
  const { state, dispatch } = useDegree()
  const { courseMap } = useCoursesStore()
  const [page, setPage] = useState(0)
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const semBlockers = state.blockers.filter(b => b.semesterId === semesterId)
  const configs = getAllConfigs(placed, semBlockers, courseMap)
  const perPage = 3
  const totalPages = Math.ceil(configs.length / perPage)
  const visible = configs.slice(page * perPage, (page + 1) * perPage)

  const canPrev = page > 0
  const canNext = page < totalPages - 1

  function applyConfig(config) {
    for (const { courseId, optionId, recitationOptionId } of config.choices) {
      if (optionId) dispatch({ type: 'SET_LECTURE_OPTION', courseId, semesterId, optionId })
      if (recitationOptionId !== undefined) dispatch({ type: 'SET_RECITATION_OPTION', courseId, semesterId, optionId: recitationOptionId })
    }
    onClose()
  }

  // Find the current active config to highlight it
  const currentChoices = placed.map(p => `${p.courseId}:${p.lectureOptionId}:${p.recitationOptionId ?? ''}`).sort().join(',')

  return createPortal(
    <div className={styles.overlay}>
      {/* Backdrop for close */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Panel — anchored above the bottom bar */}
      <div
        data-testid={TEST_IDS.PREVIEW.PANEL}
        className={styles.panel}
        style={{ width: 'calc(100vw - 256px - 1px)' }}  // full width minus catalogue
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <p className={styles.headerTitle}>Schedule Combinations</p>
            <p className={styles.headerSubtitle}>
              {configs.length} combination{configs.length !== 1 ? 's' : ''} · sorted by collisions
            </p>
          </div>
          <button onClick={onClose} data-testid={TEST_IDS.PREVIEW.CLOSE_BUTTON} className={styles.closeBtn}>
            <X size={16} />
          </button>
        </div>

        {/* Previews */}
        <div className={styles.previews}>
          {/* Prev button */}
          <button
            onClick={() => canPrev && setPage(p => p - 1)}
            disabled={!canPrev}
            data-testid={TEST_IDS.PREVIEW.PREV_BUTTON}
            className={cn(
              styles.navArrow,
              canPrev ? styles.navArrowEnabled : styles.navArrowDisabled
            )}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Preview cards */}
          <div className={styles.cards}>
            {visible.map((config, idx) => {
              const configKey = config.choices.map(c => `${c.courseId}:${c.optionId}:${c.recitationOptionId ?? ''}`).sort().join(',')
              const isActive = configKey === currentChoices
              const isHovered = hoveredIdx === idx

              return (
                <PreviewCard
                  key={idx}
                  config={config}
                  idx={idx}
                  isActive={isActive}
                  isHovered={isHovered}
                  onHover={() => setHoveredIdx(idx)}
                  onLeave={() => setHoveredIdx(null)}
                  onApply={() => applyConfig(config)}
                  blockers={semBlockers}
                  courseMap={courseMap}
                  TEST_IDS={TEST_IDS}
                />
              )
            })}

            {/* Placeholder cards when fewer than 3 on the page */}
            {Array.from({ length: perPage - visible.length }).map((_, i) => (
              <div key={`ph-${i}`} style={{ width: PREVIEW_W }} />
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={() => canNext && setPage(p => p + 1)}
            disabled={!canNext}
            data-testid={TEST_IDS.PREVIEW.NEXT_BUTTON}
            className={cn(
              styles.navArrow,
              canNext ? styles.navArrowEnabled : styles.navArrowDisabled
            )}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Page indicator */}
        {totalPages > 1 && (
          <div className={styles.pageDots}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                data-testid={`${TEST_IDS.PREVIEW.PAGE_DOT}-${i}`}
                className={cn(
                  styles.pageDot,
                  i === page ? styles.pageDotActive : styles.pageDotInactive
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
