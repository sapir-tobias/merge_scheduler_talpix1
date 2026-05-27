import { cn } from '../../utils/utils'
import { FACULTIES } from '../../constants'
import { TEST_IDS } from '../../testIds'
import styles from './Catalogue.module.css'

export default function CatalogueFilters({ filters, setFilter, toggleFaculty, creditMax, noScoring }) {
  return (
    <div className={styles.filterPanel}>
      <div>
        <p className={styles.sectionLabel}>Faculty</p>
        <div className={styles.facultyRow}>
          {FACULTIES.map(f => (
            <button
              key={f.id}
              data-testid={`${TEST_IDS.CATALOGUE.FACULTY_FILTER}-${f.id}`}
              onClick={() => toggleFaculty(f.id)}
              className={cn(
                styles.facultyBtn,
                filters.faculties.has(f.id) && styles.facultyBtnActive
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={styles.sectionLabel}>
          Credits {filters.minCredits}–{filters.maxCredits}
        </p>
        <div className={styles.creditsRow}>
          <div className={styles.creditsCol}>
            <p className={styles.creditsColLabel}>Min</p>
            <input type="range" min={0} max={creditMax} value={filters.minCredits}
              data-testid={TEST_IDS.CATALOGUE.CREDITS_MIN}
              onChange={e => setFilter('minCredits', +e.target.value)}
              className={styles.range} />
          </div>
          <div className={styles.creditsCol}>
            <p className={styles.creditsColLabel}>Max</p>
            <input type="range" min={0} max={creditMax} value={filters.maxCredits}
              data-testid={TEST_IDS.CATALOGUE.CREDITS_MAX}
              onChange={e => setFilter('maxCredits', +e.target.value)}
              className={styles.range} />
          </div>
        </div>
      </div>

      {!noScoring && (
        <div>
          <p className={styles.sectionLabel}>
            Max collisions: {filters.maxCollisions}
          </p>
          <input type="range" min={0} max={5} value={filters.maxCollisions}
            data-testid={TEST_IDS.CATALOGUE.MAX_COLLISIONS}
            onChange={e => setFilter('maxCollisions', +e.target.value)}
            className={styles.range} />
        </div>
      )}

      {!noScoring && (
        <div>
          <p className={styles.sectionLabel}>
            Min exam gap: {filters.minExamSeparationDays}d
          </p>
          <input type="range" min={0} max={14} value={filters.minExamSeparationDays}
            data-testid={TEST_IDS.CATALOGUE.MIN_EXAM_GAP}
            onChange={e => setFilter('minExamSeparationDays', +e.target.value)}
            className={styles.range} />
        </div>
      )}

      <div className={styles.toggleRow}>
        <p className={styles.toggleLabel}>Ignore prereqs</p>
        <button
          data-testid={TEST_IDS.CATALOGUE.IGNORE_PREREQS_TOGGLE}
          onClick={() => setFilter('ignorePrerequisites', !filters.ignorePrerequisites)}
          className={cn(
            styles.toggleTrack,
            filters.ignorePrerequisites && styles.toggleTrackOn
          )}
        >
          <span className={cn(
            styles.toggleKnob,
            filters.ignorePrerequisites && styles.toggleKnobOn
          )} />
        </button>
      </div>
    </div>
  )
}
