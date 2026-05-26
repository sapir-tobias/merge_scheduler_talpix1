import { Search } from 'lucide-react'

export default function RightPanel() {
  return (
    <div className="w-56 shrink-0 border-l border-stone-200 flex flex-col overflow-hidden bg-white">

      {/* ── Search — h-11 to align with the grid and calendar headers ── */}
      <div className="h-11 shrink-0 border-b border-stone-200 flex items-center px-3">
        <div className="flex items-center gap-1.5 flex-1 bg-stone-50 border border-stone-200 rounded-md px-2.5 h-[28px]">
          <Search size={11} className="text-stone-400 shrink-0" />
          <input
            type="text"
            placeholder="Search courses…"
            className="flex-1 min-w-0 text-[11px] bg-transparent border-0 focus:outline-none text-stone-700 placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* ── List area ── */}
      <div className="flex-1 overflow-y-auto flex flex-col">

        {/* Section label */}
        <div className="px-3 pt-3 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Courses
          </span>
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-stone-100" />

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[11px] text-stone-300 text-center px-4 leading-relaxed">
            No courses added yet
          </p>
        </div>

      </div>
    </div>
  )
}
