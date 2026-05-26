import { LayoutDashboard, CheckSquare, Bell, Users, Settings, Plus, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

interface ProjectSummary {
  id: string
  name: string
  emoji: string
  color: string
  progress: number
}

interface Props {
  projects: ProjectSummary[]
  selectedId: string
  onSelect: (id: string) => void
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: CheckSquare,      label: 'My Tasks' },
  { icon: Bell,             label: 'Inbox', badge: 3 },
  { icon: Users,            label: 'Team' },
]

export default function Sidebar({ projects, selectedId, onSelect }: Props) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/60">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <CheckSquare size={17} className="text-white" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">TaskFlow</span>
      </div>

      {/* Navigation */}
      <nav className="px-3 pt-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 mb-2">Menu</p>
        {NAV_ITEMS.map(({ icon: Icon, label, badge }) => (
          <button
            key={label}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm mb-0.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Icon size={16} />
            <span className="flex-1 text-left">{label}</span>
            {badge != null && (
              <span className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Projects */}
      <div className="px-3 pt-6 flex-1">
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Projects</p>
          <button className="text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded">
            <Plus size={14} />
          </button>
        </div>
        {projects.map(project => (
          <button
            key={project.id}
            onClick={() => onSelect(project.id)}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors',
              project.id === selectedId
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )}
          >
            <span className="text-base leading-none">{project.emoji}</span>
            <span className="flex-1 text-left truncate">{project.name}</span>
            {project.id === selectedId && (
              <ChevronRight size={13} className="text-slate-500 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Progress summary */}
      <div className="px-3 pb-3">
        {projects.map(p => (
          <div key={p.id} className={cn('hidden', p.id === selectedId && 'block')}>
            <div className="bg-slate-800 rounded-xl p-3 mt-1">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Progress</span>
                <span className="text-white font-semibold">{p.progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${p.progress}%`, backgroundColor: p.color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User */}
      <div className="px-5 py-4 border-t border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            AJ
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Alex Johnson</p>
            <p className="text-xs text-slate-500 truncate">Product Manager</p>
          </div>
          <button className="text-slate-500 hover:text-slate-300 transition-colors">
            <Settings size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
