import { CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react'

interface Task {
  status: string
  priority: string
}

interface Props {
  tasks: Task[]
}

export default function StatsCards({ tasks }: Props) {
  const total      = tasks.length
  const done       = tasks.filter(t => t.status === 'done').length
  const inProgress = tasks.filter(t => t.status === 'in-progress').length
  const highOpen   = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length

  const stats = [
    { label: 'Total Tasks',    value: total,      icon: ListTodo,    iconBg: 'bg-slate-100',   iconColor: 'text-slate-600'   },
    { label: 'In Progress',    value: inProgress, icon: Clock,       iconBg: 'bg-blue-50',     iconColor: 'text-blue-600'    },
    { label: 'Completed',      value: done,       icon: CheckCircle2, iconBg: 'bg-emerald-50',  iconColor: 'text-emerald-600' },
    { label: 'High Priority',  value: highOpen,   icon: AlertCircle, iconBg: 'bg-red-50',      iconColor: 'text-red-600'     },
  ]

  return (
    <div className="grid grid-cols-4 gap-4 px-6 pt-5 pb-2 shrink-0">
      {stats.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
        <div key={label} className="bg-white rounded-xl border border-slate-200 px-4 py-4 flex items-center gap-4 shadow-sm">
          <div className={`${iconBg} ${iconColor} p-3 rounded-xl`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
