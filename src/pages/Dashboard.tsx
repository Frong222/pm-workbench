import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ListTodo, Clock, FileText, Folder, Target } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import { useRequirementStore } from '@/store/requirementStore'
import { useProjectStore } from '@/store/projectStore'
import { PriorityConfig, type Task, type Project } from '@/types'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { tasks, loadTasks } = useTaskStore()
  const { requirements, loadRequirements } = useRequirementStore()
  const { projects, loadProjects } = useProjectStore()

  useEffect(() => { loadTasks(); loadRequirements(); loadProjects() }, [loadTasks, loadRequirements, loadProjects])

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayTodos = tasks.filter((t) => t.status === 'todo' && t.dueDate === todayStr)
  const inProgress = tasks.filter((t) => t.status === 'in-progress')

  const threeDaysLater = new Date(); threeDaysLater.setDate(threeDaysLater.getDate() + 3)
  const upcoming = tasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate >= todayStr && t.dueDate <= threeDaysLater.toISOString().split('T')[0])
  const activeProjects = projects.filter((p) => p.status === 'active')

  const getProjectProgress = (project: Project) => {
    const pt = tasks.filter((t) => t.projectId === project.id)
    if (pt.length === 0) return 0
    return Math.round((pt.filter((t) => t.status === 'done').length / pt.length) * 100)
  }

  const stats = {
    totalTasks: tasks.length,
    todoTasks: tasks.filter((t) => t.status === 'todo').length,
    activeRequirements: requirements.filter((r) => !['rejected', 'closed'].includes(r.status)).length,
    activeProjects: activeProjects.length,
  }

  const getPriorityDot = (priority: string) => {
    const c = PriorityConfig[priority].color
    return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c, boxShadow: `0 0 6px ${c}50` }} />
  }

  const isOverdue = (task: Task) => task.dueDate && task.status !== 'done' && task.dueDate < todayStr

  const quickActions = [
    { label: '任务管理', icon: <ListTodo className="w-6 h-6" />, path: '/tasks', grad: 'from-emerald-400 to-teal-500' },
    { label: '需求管理', icon: <FileText className="w-6 h-6" />, path: '/requirements', grad: 'from-blue-400 to-cyan-500' },
    { label: '项目管理', icon: <Folder className="w-6 h-6" />, path: '/projects', grad: 'from-violet-400 to-purple-500' },
    { label: '优先级矩阵', icon: <Target className="w-6 h-6" />, path: '/requirements?view=matrix', grad: 'from-rose-400 to-pink-500' },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="page-title">工作台</h2>
          <p className="page-subtitle">{format(today, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总任务数', value: stats.totalTasks, icon: <ListTodo className="w-5 h-5" />, color: '#34d399' },
          { label: '待处理', value: stats.todoTasks, icon: <Clock className="w-5 h-5" />, color: '#fbbf24' },
          { label: '活跃需求', value: stats.activeRequirements, icon: <FileText className="w-5 h-5" />, color: '#60a5fa' },
          { label: '活跃项目', value: stats.activeProjects, icon: <Folder className="w-5 h-5" />, color: '#a78bfa' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">{s.label}</p>
                <p className="stat-value">{s.value}</p>
              </div>
              <div className="stat-icon" style={{ borderColor: `${s.color}30`, background: `${s.color}15` }}>
                <span>{s.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[
          { title: '今日待办', data: todayTodos, link: '/tasks', linkText: '查看全部' },
          { title: '进行中', data: inProgress, link: '/tasks', linkText: '看板' },
          { title: '未来3天截止', data: upcoming, link: '', linkText: '' },
        ].map((col) => (
          <div key={col.title} className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              {col.link && (
                <button className="btn-ghost btn-sm" onClick={() => navigate(col.link)}>
                  {col.linkText}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
            <div className="space-y-2.5">
              {col.data.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground">
                    {col.title === '今日待办' ? '今日暂无待办 ✨' : col.title === '进行中' ? '当前无进行中任务' : '无近期截止任务 🎉'}
                  </p>
                </div>
              ) : (
                col.data.map((task: Task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-200 ${
                      isOverdue(task)
                        ? 'border border-red-500/20'
                        : ''
                    }`}
                    style={{
                      background: isOverdue(task) ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.03)',
                      border: isOverdue(task) ? '1px solid rgba(248,113,113,0.15)' : '1px solid rgba(255,255,255,0.04)',
                    }}
                    onClick={() => navigate('/tasks')}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getPriorityDot(task.priority)}
                      <span className={`text-sm font-medium truncate ${isOverdue(task) ? 'text-red-400' : 'text-foreground'}`}>
                        {task.title}
                      </span>
                    </div>
                    <span className="badge text-[11px] py-0.5" style={{
                      background: PriorityConfig[task.priority].color + '15',
                      color: PriorityConfig[task.priority].color,
                      borderColor: PriorityConfig[task.priority].color + '25',
                    }}>
                      {PriorityConfig[task.priority].label}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Project Progress */}
      {activeProjects.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-foreground">活跃项目进度</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map((project) => {
              const progress = getProjectProgress(project)
              return (
                <div
                  key={project.id}
                  className="p-4 rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onClick={() => navigate('/projects')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${project.color}40`
                    e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.3), 0 0 15px ${project.color}10`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: project.color, boxShadow: `0 0 8px ${project.color}60` }} />
                      <span className="text-sm font-medium text-foreground">{project.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{progress}%</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${progress}%`, background: project.color, boxShadow: `0 0 10px ${project.color}40` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <p className="section-title">快捷入口</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.path}
              className="card p-5 text-center transition-all duration-300 active:scale-[0.98] group"
              onClick={() => navigate(action.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.borderColor = 'rgba(52,211,153,0.2)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(52,211,153,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 bg-gradient-to-br ${action.grad}`}>
                {action.icon}
              </div>
              <p className="text-sm font-semibold text-foreground">{action.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
