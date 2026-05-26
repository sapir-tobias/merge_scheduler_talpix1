import type { Course, PlacedCourse, CatalogueFilters, CourseScore, LectureSlot, SemesterId } from '../types'
import { COURSE_MAP } from '../data/courses'

function slotsOverlap(a: LectureSlot, b: LectureSlot): boolean {
  if (a.day !== b.day) return false
  return a.startHour < b.endHour && b.startHour < a.endHour
}

function countCollisionsForOption(course: Course, optionId: string, placed: PlacedCourse[], semesterId: SemesterId): number {
  const option = course.lectureOptions.find(o => o.id === optionId)
  if (!option) return 0
  let collisions = 0
  for (const p of placed) {
    if (p.semesterId !== semesterId || p.courseId === course.id) continue
    const pc = COURSE_MAP.get(p.courseId)
    if (!pc) continue
    const po = pc.lectureOptions.find(o => o.id === p.lectureOptionId)
    if (!po) continue
    for (const slot of option.slots) {
      for (const pslot of po.slots) {
        if (slotsOverlap(slot, pslot)) collisions++
      }
    }
  }
  return collisions
}

// Pick the lecture option with fewest collisions against already-placed courses
export function pickBestOption(course: Course, placed: PlacedCourse[], semesterId: SemesterId): string {
  if (course.lectureOptions.length === 0) return ''
  let bestOptionId = course.lectureOptions[0].id
  let bestCollisions = Infinity
  for (const opt of course.lectureOptions) {
    const c = countCollisionsForOption(course, opt.id, placed, semesterId)
    if (c < bestCollisions) { bestCollisions = c; bestOptionId = opt.id }
  }
  return bestOptionId
}

export function pickFirstRecitationOption(course: Course): string | undefined {
  return course.recitationOptions?.[0]?.id
}

function daysBetween(a: string, b: string): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86400000)
}

function minExamSeparation(candidate: Course, placed: PlacedCourse[], semesterId: SemesterId): number {
  let min = Infinity
  for (const p of placed) {
    if (p.semesterId !== semesterId || p.courseId === candidate.id) continue
    const pc = COURSE_MAP.get(p.courseId)
    if (!pc) continue
    const d = daysBetween(candidate.examDate, pc.examDate)
    if (d < min) min = d
  }
  return min === Infinity ? 999 : min
}

function prerequisitesMet(course: Course, placed: PlacedCourse[], exemptions: string[], semesterId: SemesterId): boolean {
  const satisfied = new Set([
    ...placed.filter(p => p.semesterId < semesterId).map(p => p.courseId),
    ...exemptions,
  ])
  return course.prerequisites.every(id => satisfied.has(id))
}

export function scoreCourse(
  course: Course,
  placed: PlacedCourse[],
  exemptions: string[],
  semesterId: SemesterId,
  filters: CatalogueFilters,
): CourseScore {
  const bestOptionId = pickBestOption(course, placed, semesterId)
  const bestCollisions = countCollisionsForOption(course, bestOptionId, placed, semesterId)
  const examSep = minExamSeparation(course, placed, semesterId)
  const prereqMet = prerequisitesMet(course, placed, exemptions, semesterId)

  const collisionBreached = bestCollisions > filters.maxCollisions
  const examBreached = examSep < filters.minExamSeparationDays && examSep < 999
  const prereqBreached = !filters.ignorePrerequisites && !prereqMet

  const critical = collisionBreached || examBreached || prereqBreached
  const warning = !critical && (
    bestCollisions > 0 ||
    (examSep < filters.minExamSeparationDays + 3 && examSep < 999)
  )

  let score = 100
  score -= bestCollisions * 15
  if (examSep < 999) score -= Math.max(0, filters.minExamSeparationDays - examSep) * 8
  if (!prereqMet && !filters.ignorePrerequisites) score -= 30
  if (critical) score = Math.min(score, 20)
  score = Math.max(0, score)

  return {
    courseId: course.id,
    score,
    collisions: bestCollisions,
    examSeparationMin: examSep === 999 ? -1 : examSep,
    prerequisitesMet: prereqMet,
    warning,
    critical,
    bestLectureOptionId: bestOptionId,
  }
}

function fuzzyMatch(query: string, target: string): number {
  if (!query) return 1
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  if (t.includes(q)) return 1
  let qi = 0; let matched = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) { qi++; matched++ }
  }
  return qi === q.length ? 0.4 + (matched / t.length) * 0.6 : 0
}

export function filterAndScore(
  allCourses: Course[],
  placed: PlacedCourse[],
  exemptions: string[],
  semesterId: SemesterId,
  filters: CatalogueFilters,
  alreadyInSemester: Set<string>,
): (CourseScore & { course: Course; matchScore: number })[] {
  const { searchQuery, faculties, minCredits, maxCredits } = filters

  return allCourses
    .filter(c => {
      if (alreadyInSemester.has(c.id)) return false
      if (!faculties.has(c.faculty)) return false
      if (c.credits < minCredits || c.credits > maxCredits) return false
      if (searchQuery) {
        const nm = fuzzyMatch(searchQuery, c.name)
        const cm = fuzzyMatch(searchQuery, c.code)
        if (nm < 0.01 && cm < 0.01) return false
      }
      return true
    })
    .map(c => {
      const cs = scoreCourse(c, placed, exemptions, semesterId, filters)
      const nm = fuzzyMatch(searchQuery, c.name)
      const cm = fuzzyMatch(searchQuery, c.code)
      return { ...cs, course: c, matchScore: Math.max(nm, cm) }
    })
    .sort((a, b) => {
      if (a.critical !== b.critical) return a.critical ? 1 : -1
      const combined = (x: typeof a) => x.score * 0.7 + x.matchScore * 30
      return combined(b) - combined(a)
    })
}
