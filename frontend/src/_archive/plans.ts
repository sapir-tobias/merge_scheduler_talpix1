import type { PlacedCourse, SemesterId } from '../types'

type PlanEntry = { courseId: string; semesterId: SemesterId; lectureOptionId: string; recitationOptionId?: string }

export type TrackId = 'cs' | 'math' | 'physics'

const PLANS: Record<TrackId, PlanEntry[]> = {
  cs: [
    // Semester 1
    { courseId: 'cs-intro',           semesterId: 1, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-calculus1',     semesterId: 1, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-linear',        semesterId: 1, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-discrete',      semesterId: 1, lectureOptionId: 'a' },
    // Semester 2
    { courseId: 'cs-data-structures', semesterId: 2, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-calculus2',     semesterId: 2, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'phys-mechanics',     semesterId: 2, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'misc-econ',          semesterId: 2, lectureOptionId: 'a' },
    // Semester 3
    { courseId: 'cs-algorithms',      semesterId: 3, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'cs-os',              semesterId: 3, lectureOptionId: 'b', recitationOptionId: 'r1' },
    { courseId: 'math-probability',   semesterId: 3, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'cs-se',              semesterId: 3, lectureOptionId: 'a', recitationOptionId: 'r1' },
    // Semester 4
    { courseId: 'cs-networks',        semesterId: 4, lectureOptionId: 'a' },
    { courseId: 'cs-arch',            semesterId: 4, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'cs-toc',             semesterId: 4, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'cs-pl',              semesterId: 4, lectureOptionId: 'a' },
    // Semester 5
    { courseId: 'elec-db',            semesterId: 5, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'elec-ml',            semesterId: 5, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'cs-compilers',       semesterId: 5, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'cs-ai',              semesterId: 5, lectureOptionId: 'a' },
    // Semester 6
    { courseId: 'cs-dist',            semesterId: 6, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'elec-graphics',      semesterId: 6, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'misc-or',            semesterId: 6, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'misc-scicomp',       semesterId: 6, lectureOptionId: 'a', recitationOptionId: 'r1' },
  ],

  math: [
    // Semester 1
    { courseId: 'math-calculus1',     semesterId: 1, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-linear',        semesterId: 1, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-discrete',      semesterId: 1, lectureOptionId: 'a' },
    { courseId: 'cs-intro',           semesterId: 1, lectureOptionId: 'a', recitationOptionId: 'r1' },
    // Semester 2
    { courseId: 'math-calculus2',     semesterId: 2, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-probability',   semesterId: 2, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'cs-data-structures', semesterId: 2, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'phys-mechanics',     semesterId: 2, lectureOptionId: 'a', recitationOptionId: 'r1' },
    // Semester 3
    { courseId: 'math-analysis',      semesterId: 3, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-ode',           semesterId: 3, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'cs-algorithms',      semesterId: 3, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'misc-econ',          semesterId: 3, lectureOptionId: 'a' },
    // Semester 4
    { courseId: 'math-algebra',       semesterId: 4, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-numerical',     semesterId: 4, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'phys-electro',       semesterId: 4, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'cs-os',              semesterId: 4, lectureOptionId: 'a', recitationOptionId: 'r1' },
    // Semester 5
    { courseId: 'phys-quantum',       semesterId: 5, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'elec-ml',            semesterId: 5, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'misc-or',            semesterId: 5, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'cs-networks',        semesterId: 5, lectureOptionId: 'a' },
    // Semester 6
    { courseId: 'phys-stat',          semesterId: 6, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'misc-bioinfo',       semesterId: 6, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'misc-game',          semesterId: 6, lectureOptionId: 'a' },
    { courseId: 'misc-scicomp',       semesterId: 6, lectureOptionId: 'a', recitationOptionId: 'r1' },
  ],

  physics: [
    // Semester 1
    { courseId: 'math-calculus1',     semesterId: 1, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-linear',        semesterId: 1, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'cs-intro',           semesterId: 1, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-discrete',      semesterId: 1, lectureOptionId: 'a' },
    // Semester 2
    { courseId: 'math-calculus2',     semesterId: 2, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'phys-mechanics',     semesterId: 2, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'cs-data-structures', semesterId: 2, lectureOptionId: 'a', recitationOptionId: 'r1' },
    // Semester 3
    { courseId: 'phys-electro',       semesterId: 3, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-probability',   semesterId: 3, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-ode',           semesterId: 3, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'cs-algorithms',      semesterId: 3, lectureOptionId: 'a', recitationOptionId: 'r1' },
    // Semester 4
    { courseId: 'phys-quantum',       semesterId: 4, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'phys-thermo',        semesterId: 4, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-analysis',      semesterId: 4, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'misc-econ',          semesterId: 4, lectureOptionId: 'a' },
    // Semester 5
    { courseId: 'phys-stat',          semesterId: 5, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'phys-optics',        semesterId: 5, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'elec-ml',            semesterId: 5, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'math-numerical',     semesterId: 5, lectureOptionId: 'a', recitationOptionId: 'r1' },
    // Semester 6
    { courseId: 'cs-os',              semesterId: 6, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'cs-networks',        semesterId: 6, lectureOptionId: 'a' },
    { courseId: 'misc-or',            semesterId: 6, lectureOptionId: 'a', recitationOptionId: 'r1' },
    { courseId: 'misc-bioinfo',       semesterId: 6, lectureOptionId: 'a', recitationOptionId: 'r1' },
  ],
}

export function buildPlan(track: TrackId, exemptions: string[]): PlacedCourse[] {
  return PLANS[track]
    .filter(entry => !exemptions.includes(entry.courseId))
    .map(({ courseId, semesterId, lectureOptionId, recitationOptionId }) => ({
      courseId, semesterId, lectureOptionId, recitationOptionId, locked: false,
    }))
}
