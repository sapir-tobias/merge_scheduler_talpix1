import { MessageSquare, Paperclip, Calendar, MoreHorizontal } from 'lucide-react'
import { cn } from '../lib/utils'

interface Task {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  assignee: { name: string; initials: string; color: string }
  dueDate: string
  tags: string[]
  subtasks: { total: number; completed: number }
  comments: number
  attachments: number
}

const PRIORITY = {
  high:   { label: 'High',   bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500'     },
  medium: { label: 'Medium', bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500'   },
  low:    { label: 'Low',    bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
}

const TAG_COLORS = [
  'bg-indigo-50 text-indigo-600',
  'bg-pink-50 text-pink-600',
  'bg-violet-50 text-violet-700',
  'bg-cyan-50 text-cyan-700',
  'bg-teal-50 text-teal-600',
]

export default function TaskCard({ task }: { task: Task }) {
  const p = PRIORITY[task.priority]
  const progress = task.subtasks.total > 0
    ? Math.round((task.subtasks.completed / task.subtasks.total) * 100)
    : 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group">
      {/* Tags + more */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 2).map((tag, i) => (
            <span
              key={tag}
              className={cn('text-xs px-2 py-0.5 rounded-full font-medium', TAG_COLORS[i % TAG_COLORS.length])}
            >
              {tag}
            </span>
          ))}
        </div>
        <button className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mt-0.5">
          <MoreHorizontal size={15} />
        </button>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-800 leading-snug mb-1">{task.title}</h3>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">{task.description}</p>

      {/* Subtask progress */}
      {task.subtasks.total > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Subtasks</span>
            <span className="font-medium">{task.subtasks.completed}/{task.subtasks.total}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', p.bg, p.text)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', p.dot)} />
          {p.label}
        </span>
        <div className="flex items-center gap-2.5 text-slate-400">
          <span className="flex items-center gap-1 text-xs">
            <Calendar size={11} />
            {task.dueDate}
          </span>
          {task.comments > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <MessageSquare size={11} />
              {task.comments}
            </span>
          )}
          {task.attachments > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <Paperclip size={11} />
              {task.attachments}
            </span>
          )}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: task.assignee.color }}
            title={task.assignee.name}
          >
            {task.assignee.initials}
          </div>
        </div>
      </div>
    </div>
  )
}
