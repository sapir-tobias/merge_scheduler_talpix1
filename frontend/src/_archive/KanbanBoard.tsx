import { Plus } from 'lucide-react'
import { cn } from '../lib/utils'
import TaskCard from './TaskCard'

type Status = 'todo' | 'in-progress' | 'review' | 'done'

interface Task {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: Status
  assignee: { name: string; initials: string; color: string }
  dueDate: string
  tags: string[]
  subtasks: { total: number; completed: number }
  comments: number
  attachments: number
}

const COLUMNS: { id: Status; label: string; accent: string; dotColor: string }[] = [
  { id: 'todo',        label: 'To Do',       accent: 'border-slate-300',  dotColor: 'bg-slate-400'   },
  { id: 'in-progress', label: 'In Progress', accent: 'border-blue-400',   dotColor: 'bg-blue-500'    },
  { id: 'review',      label: 'In Review',   accent: 'border-amber-400',  dotColor: 'bg-amber-500'   },
  { id: 'done',        label: 'Done',        accent: 'border-emerald-400', dotColor: 'bg-emerald-500' },
]

export default function KanbanBoard({ tasks }: { tasks: Task[] }) {
  return (
    <div className="flex gap-5 px-6 pb-6 pt-4 overflow-x-auto" style={{ minHeight: 'calc(100vh - 220px)' }}>
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id)
        return (
          <div key={col.id} className="flex flex-col w-72 shrink-0">
            {/* Column header */}
            <div className={cn('flex items-center justify-between mb-3 pb-3 border-b-2', col.accent)}>
              <div className="flex items-center gap-2">
                <span className={cn('w-2.5 h-2.5 rounded-full', col.dotColor)} />
                <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 font-medium">
                  {colTasks.length}
                </span>
              </div>
              <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                <Plus size={14} />
              </button>
            </div>

            {/* Tasks */}
            <div className="flex flex-col gap-3">
              {colTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
              {colTasks.length === 0 && (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                  <p className="text-sm text-slate-300 font-medium">No tasks</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
