/**
 * Plan import/export helpers — pure browser IO, no React.
 * Relocated verbatim from SchedulerPage.jsx.
 */

// Export the full plan (placement + exemptions + blockers) as a JSON file.
export function exportPlan(state) {
  const payload = JSON.stringify(
    { placed: state.placed, exemptions: state.exemptions, blockers: state.blockers },
    null,
    2,
  )
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'degree-plan.json'
  a.click()
  URL.revokeObjectURL(url)
}

// Restore a previously exported plan from a JSON file.
export function importPlanFile(e, dispatch) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result))
      dispatch({ type: 'LOAD_PLAN', placed: Array.isArray(parsed.placed) ? parsed.placed : [] })
      for (const id of parsed.exemptions ?? []) dispatch({ type: 'ADD_EXEMPTION', courseId: id })
      for (const b of parsed.blockers ?? []) dispatch({ type: 'ADD_BLOCKER', payload: b })
    } catch {
      // ignore malformed files — nothing to restore
    }
  }
  reader.readAsText(file)
  e.target.value = ''  // allow re-importing the same file
}
