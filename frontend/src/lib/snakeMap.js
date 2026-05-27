export function buildCells(year, month) {
  const lead  = new Date(year, month, 1).getDay()
  const total = new Date(year, month + 1, 0).getDate()
  const cells = [
    ...Array(lead).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function shiftDate(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export function buildSnakeMap(rawExamMap) {
  const map = new Map()
  // Drop any non-date keys (e.g. courses with no final) so the date math below
  // never feeds an invalid value to shiftDate().
  const examMap = new Map([...rawExamMap].filter(([d]) => DATE_ONLY.test(d)))
  if (examMap.size === 0) return map

  const sortedDates = [...examMap.keys()].sort()

  // Mark all exam days as heads
  for (const [date, courses] of examMap) {
    map.set(date, { type: 'head', courses })
  }

  // Pre-exam body for the very first single-exam: 7 days before
  const firstDate = sortedDates[0]
  const firstCourses = examMap.get(firstDate)
  if (firstCourses.length === 1) {
    let cur = shiftDate(firstDate, -7)
    while (cur < firstDate) {
      if (!map.has(cur)) map.set(cur, { type: 'body', forExam: firstCourses[0].name, faculty: firstCourses[0].faculty })
      cur = shiftDate(cur, 1)
    }
  }

  // Body days between consecutive single-exam targets, limited to 7 days before each exam
  for (let i = 1; i < sortedDates.length; i++) {
    const nextDate = sortedDates[i]
    const nextCourses = examMap.get(nextDate)
    if (nextCourses.length > 1) continue  // multi-exam: no snake

    const prevDate = sortedDates[i - 1]
    const sevenBefore = shiftDate(nextDate, -7)
    // Start from whichever is later: day after prevExam OR 7 days before nextExam
    const bodyStart = prevDate >= sevenBefore ? shiftDate(prevDate, 1) : sevenBefore

    let cur = bodyStart
    while (cur < nextDate) {
      if (!map.has(cur)) map.set(cur, { type: 'body', forExam: nextCourses[0].name, faculty: nextCourses[0].faculty })
      cur = shiftDate(cur, 1)
    }
  }

  return map
}

// True if dateStr is a body day — used for LEFT connectivity of body days
export function isBodyDay(snakeMap, dateStr) {
  return snakeMap.get(dateStr)?.type === 'body'
}
// True if next day is body or single-head — used for RIGHT connectivity of body days
export function connectsRight(snakeMap, dateStr) {
  const info = snakeMap.get(dateStr)
  if (!info) return false
  if (info.type === 'body') return true
  return info.type === 'head' && info.courses.length === 1
}
