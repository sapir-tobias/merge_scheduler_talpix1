export const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu']

export function buildSlots(choices, courseMap) {
  const slots = []
  for (const { courseId, optionId, recitationOptionId, faculty } of choices) {
    const course = courseMap.get(courseId)
    if (!course) continue
    const opt = course.lectureOptions.find(o => o.id === optionId)
    if (opt) {
      for (const slot of opt.slots) {
        const dayIndex = DAYS.indexOf(slot.day)
        if (dayIndex < 0) continue
        slots.push({ courseId, optionId, faculty, day: slot.day, startHour: slot.startHour, endHour: slot.endHour, dayIndex })
      }
    }
    if (recitationOptionId && course.recitationOptions) {
      const recOpt = course.recitationOptions.find(o => o.id === recitationOptionId)
      if (recOpt) {
        for (const slot of recOpt.slots) {
          const dayIndex = DAYS.indexOf(slot.day)
          if (dayIndex < 0) continue
          slots.push({ courseId, optionId: recitationOptionId, faculty, day: slot.day, startHour: slot.startHour, endHour: slot.endHour, dayIndex })
        }
      }
    }
  }
  return slots
}

export function countCollisions(choices, blockers, courseMap) {
  const slots = buildSlots(choices, courseMap)
  let count = 0
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (slots[i].courseId === slots[j].courseId) continue
      if (slots[i].dayIndex !== slots[j].dayIndex) continue
      if (Math.max(slots[i].startHour, slots[j].startHour) < Math.min(slots[i].endHour, slots[j].endHour)) count++
    }
  }
  for (const slot of slots) {
    for (const blocker of blockers) {
      const blockerDayIndex = DAYS.indexOf(blocker.day)
      if (blockerDayIndex !== slot.dayIndex) continue
      if (Math.max(slot.startHour, blocker.startHour) < Math.min(slot.endHour, blocker.endHour)) count++
    }
  }
  return count
}

export function getAllConfigs(placed, blockers, courseMap) {
  let combos = [[]]

  for (const p of placed) {
    const course = courseMap.get(p.courseId)
    if (!course) continue

    const lectIds = course.lectureOptions.length > 0
      ? course.lectureOptions.map(o => o.id)
      : ['']
    const recitIds = (course.recitationOptions?.length ?? 0) > 0
      ? course.recitationOptions.map(o => o.id)
      : [undefined]

    const next = []
    for (const existing of combos) {
      for (const lId of lectIds) {
        for (const rId of recitIds) {
          next.push([...existing, { courseId: p.courseId, optionId: lId, recitationOptionId: rId, faculty: course.faculty }])
        }
      }
    }
    combos = next
  }

  return combos
    .map(choices => ({ choices, collisions: countCollisions(choices, blockers, courseMap) }))
    .sort((a, b) => a.collisions - b.collisions)
}
