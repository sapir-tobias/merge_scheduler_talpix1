import { Search, Bell, LayoutGrid, List, Filter, Plus } from 'lucide-react'
import { cn } from '../lib/utils'

interface Project {
  name: string
  emoji: string
  description: string
  dueDate: string
  color: string
  members: Array<{ id: string; name: string; initials: string; color: string }>
}

interface Props {
  project: Project
  view: 'kanban' | 'list'
  onViewChange: (v: 'kanban' | 'list') => void
  filterPriority: string
  onFilterChange: (p: string) => void
  onNewTask: () => void
}

export default function Header({ project, view, onViewChange, filterPriority, onFilterChange, onNewTask }: Props) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center gap-4 shrink-0">
      {/* Project info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{project.emoji}</span>
          <h1 className="font-bold text-slate-900 text-lg leading-tight">{project.name}</h1>
          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5 font-medium shrink-0">
            Due {project.dueDate}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{project.description}</p>
      </div>

      {/* Team avatars */}
      <div className="flex items-center -space-x-2 shrink-0">
        {project.members.slice(0, 4).map(m => (
          <div
            key={m.id}
            className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: m.color }}
            title={m.name}
          >
            {m.initials}
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center bg-slate-100 rounded-lg p-1 shrink-0">
        <button
          onClick={() => onViewChange('kanban')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            view === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <LayoutGrid size={14} />
          Board
        </button>
        <button
          onClick={() => onViewChange('list')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <List size={14} />
          List
        </button>
      </div>

      {/* Priority filter */}
      <div className="relative shrink-0">
        <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <select
          value={filterPriority}
          onChange={e => onFilterChange(e.target.value)}
          className="text-sm text-slate-600 bg-slate-100 rounded-lg border-0 pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
        >
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Search */}
      <div className="relative shrink-0">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          className="pl-8 pr-4 py-2 text-sm bg-slate-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
        />
      </div>

      {/* Notification */}
      <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      {/* New task */}
      <button
        onClick={onNewTask}
        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shrink-0"
      >
        <Plus size={15} />
        New Task
      </button>
    </header>
  )
}
