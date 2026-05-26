import { cn } from '../lib/utils'
import Tooltip from './Tooltip'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const WEEK_LABELS = ['S','M','T','W','T','F','S']

interface Props {
  // date string → array of course names with exams that day
  examMap: Map<string, string[]>
}

function buildCells(year: number, month: number): (number | null)[] {
  const lead  = new Date(year, month, 1).getDay()
  const total = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function MiniExamCalendar({ examMap }: Props) {
  if (examMap.size === 0) return null

  const dates = Array.from(examMap.keys()).sort()
  const first = new Date(dates[0])
  const last  = new Date(dates[dates.length - 1])

  const months: { year: number; month: number }[] = []
  let cur = new Date(first.getFullYear(), first.getMonth(), 1)
  const end = new Date(last.getFullYear(), last.getMonth(), 1)
  while (cur <= end) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() })
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }

  return (
    <div className="border-t border-stone-100 pt-3 mt-1">
      <p className="text-[9px] font-bold uppercase tracking-wide text-stone-400 px-3 mb-2">
        Exam Period
      </p>

      {/* Fixed weekday row */}
      <div className="grid grid-cols-7 px-2 mb-1">
        {WEEK_LABELS.map((l, i) => (
          <div key={i} className="flex justify-center">
            <span className="text-[8px] text-stone-400 font-medium">{l}</span>
          </div>
        ))}
      </div>

      {months.map(({ year, month }, mi) => {
        const cells = buildCells(year, month)
        return (
          <div key={`${year}-${month}`} className={cn(mi > 0 && 'mt-2')}>
            <p className="text-[9px] text-stone-400 font-semibold px-3 mb-0.5">
              {MONTH_NAMES[month]} {year}
            </p>
            <div className="grid grid-cols-7 px-2 gap-y-0.5">
              {cells.map((day, i) => {
                if (day === null) return <div key={`e${i}`} className="h-5" />
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const names = examMap.get(dateStr)
                const hasExam = !!names

                const circle = (
                  <div
                    className={cn(
                      'h-5 w-5 mx-auto flex items-center justify-center rounded-full text-[9px] leading-none transition-colors',
                      hasExam
                        ? 'bg-red-100 text-red-700 font-bold cursor-default hover:bg-red-200'
                        : 'text-stone-400'
                    )}
                  >
                    {day}
                  </div>
                )
                return hasExam ? (
                  <Tooltip key={i} text={names!.join(' · ')} side="top" className="flex justify-center">
                    {circle}
                  </Tooltip>
                ) : (
                  <div key={i}>{circle}</div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
