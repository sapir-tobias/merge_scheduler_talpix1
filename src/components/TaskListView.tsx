import { Calendar, MessageSquare, Paperclip } from 'lucide-react'
import { cn } from '../lib/utils'

interface Task {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  status: string
  assignee: { name: string; initials: string; color: string }
  dueDate: string
  comments: number
  attachments: number
  tags: string[]
}

const PRIORITY = {
  high:   { label: 'High',   classes: 'bg-red-50 text-red-600'         },
  medium: { label: 'Medium', classes: 'bg-amber-50 text-amber-600'     },
  low:    { label: 'Low',    classes: 'bg-emerald-50 text-emerald-600' },
}

const STATUS: Record<string, { label: string; classes: string }> = {
  'todo':        { label: 'To Do',       classes: 'bg-slate-100 text-slate-600'   },
  'in-progress': { label: 'In Progress', classes: 'bg-blue-50 text-blue-600'      },
  'review':      { label: 'In Review',   classes: 'bg-amber-50 text-amber-700'    },
  'done':        { label: 'Done',        classes: 'bg-emerald-50 text-emerald-600' },
}

export default function TaskListView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="px-6 pb-6 pt-4">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid items-center gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider"
          style={{ gridTemplateColumns: '2fr 120px 110px 130px 40px' }}
        >
          <span>Task</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Due Date</span>
          <span>Who</span>
        </div>

        {/* Rows */}
        {tasks.map((task, i) => (
          <div
            key={task.id}
            className={cn(
              'grid items-center gap-4 px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors',
              i < tasks.length - 1 && 'border-b border-slate-100'
            )}
            style={{ gridTemplateColumns: '2fr 120px 110px 130px 40px' }}
          >
            {/* Title + meta */}
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">{task.title}</p>
              <div className="flex items-center gap-2.5 mt-0.5 text-xs text-slate-400">
                {task.comments > 0 && (
                  <span className="flex items-center gap-0.5">
                    <MessageSquare size={11} /> {task.comments}
                  </span>
                )}
                {task.attachments > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Paperclip size={11} /> {task.attachments}
                  </span>
                )}
                {task.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-slate-400">{tag}</span>
                ))}
              </div>
            </div>

            {/* Status */}
            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full inline-block w-fit', STATUS[task.status]?.classes)}>
              {STATUS[task.status]?.label}
            </span>

            {/* Priority */}
            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full inline-block w-fit', PRIORITY[task.priority]?.classes)}>
              {PRIORITY[task.priority]?.label}
            </span>

            {/* Due date */}
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Calendar size={13} className="text-slate-400" />
              {task.dueDate}
            </span>

            {/* Assignee */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: task.assignee.color }}
              title={task.assignee.name}
            >
              {task.assignee.initials}
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">No tasks match the current filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
