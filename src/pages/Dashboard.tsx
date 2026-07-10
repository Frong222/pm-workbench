import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useTaskStore } from '@/store/taskStore'
import { useRequirementStore } from '@/store/requirementStore'
import { useProjectStore } from '@/store/projectStore'
import { PriorityConfig, TaskStatusConfig, type Task, type Project } from '@/types'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { tasks, loading, loadTasks } = useTaskStore()
  const { requirements, loadRequirements } = useRequirementStore()
  const { projects, loadProjects } = useProjectStore()

  useEffect(() => {
    loadTasks()
    loadRequirements()
    loadProjects()
  }, [loadTasks, loadRequirements, loadProjects])

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // 今日待办
  const todayTodos = tasks.filter(
    (t) => t.status === 'todo' && t.dueDate === todayStr
  )

  // 进行中
  const inProgress = tasks.filter((t) => t.status === 'in-progress')

  // 近期截止（未来3天）
  const threeDaysLater = new Date()
  threeDaysLater.setDate(threeDaysLater.getDate() + 3)
  const upcoming = tasks.filter(
    (t) =>
      t.status !== 'done' &&
      t.dueDate &&
      t.dueDate >= new Date().toISOString().split('T')[0] &&
      t.dueDate <= threeDaysLater.toISOString().split('T')[0]
  )

  // 活跃项目统计
  const activeProjects = projects.filter((p) => p.status === 'active')

  // 计算项目进度（基于关联任务）
  const getProjectProgress = (project: Project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id)
    if (projectTasks.length === 0) return 0
    const done = projectTasks.filter((t) => t.status === 'done').length
    return Math.round((done / projectTasks.length) * 100)
  }

  const stats = {
    totalTasks: tasks.length,
    todoTasks: tasks.filter((t) => t.status === 'todo').length,
    inProgressTasks: inProgress.length,
    doneTasks: tasks.filter((t) => t.status === 'done').length,
    activeRequirements: requirements.filter((r) => !['rejected', 'closed'].includes(r.status)).length,
    activeProjects: activeProjects.length,
  }

  const getPriorityBadge = (priority: string) => {
    const config = PriorityConfig[priority]
    return (
      <span
        className="badge"
        style={{ backgroundColor: config.color, color: config.textColor }}
      >
        {config.label}
      </span>
    )
  }

  const isOverdue = (task: Task) => {
    if (!task.dueDate) return false
    return task.status !== 'done' && task.dueDate < todayStr
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">
          {format(today, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
        </h2>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">总任务数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTasks}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600">📋</span>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">待处理任务</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.todoTasks}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-amber-600">⏰</span>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">活跃需求</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeRequirements}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600">📝</span>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">活跃项目</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeProjects}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600">📁</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 今日待办 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">今日待办</h3>
            <button
              className="btn-primary btn-sm"
              onClick={() => navigate('/tasks')}
            >
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {todayTodos.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">今日暂无待办 ✨</p>
            ) : (
              todayTodos.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => navigate('/tasks')}
                >
                  <span className="font-medium text-gray-900">{task.title}</span>
                  {getPriorityBadge(task.priority)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 进行中任务 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">进行中</h3>
            <button
              className="btn-primary btn-sm"
              onClick={() => navigate('/tasks')}
            >
              看板视图
            </button>
          </div>
          <div className="space-y-3">
            {inProgress.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">当前无进行中任务</p>
            ) : (
              inProgress.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => navigate('/tasks')}
                >
                  <span className="font-medium text-gray-900">{task.title}</span>
                  {getPriorityBadge(task.priority)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 近期截止 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">未来3天截止</h3>
          </div>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">无近期截止任务 🎉</p>
            ) : (
              upcoming.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                    isOverdue(task) ? 'bg-red-50' : 'bg-gray-50'
                  }`}
                  onClick={() => navigate('/tasks')}
                >
                  <div>
                    <p className={`font-medium ${isOverdue(task) ? 'text-red-700' : 'text-gray-900'}`}>
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className={`text-xs ${isOverdue(task) ? 'text-red-500' : 'text-gray-500'}`}>
                        {task.dueDate}
                      </p>
                    )}
                  </div>
                  {getPriorityBadge(task.priority)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 活跃项目进度 */}
      {activeProjects.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">活跃项目进度</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map((project) => {
              const progress = getProjectProgress(project)
              return (
                <div
                  key={project.id}
                  className="p-4 border border-gray-100 rounded-lg cursor-pointer hover:border-primary-300 transition-colors"
                  onClick={() => navigate('/projects')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{project.name}</span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-primary-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 快捷入口 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          className="card-hover p-4 text-center hover:border-primary-300 transition-all"
          onClick={() => navigate('/tasks')}
        >
          <div className="text-3xl mb-2">📋</div>
          <div className="font-medium text-gray-900">任务管理</div>
        </button>
        <button
          className="card-hover p-4 text-center hover:border-primary-300 transition-all"
          onClick={() => navigate('/requirements')}
        >
          <div className="text-3xl mb-2">📝</div>
          <div className="font-medium text-gray-900">需求管理</div>
        </button>
        <button
          className="card-hover p-4 text-center hover:border-primary-300 transition-all"
          onClick={() => navigate('/projects')}
        >
          <div className="text-3xl mb-2">📁</div>
          <div className="font-medium text-gray-900">项目管理</div>
        </button>
        <button
          className="card-hover p-4 text-center hover:border-primary-300 transition-all"
          onClick={() => navigate('/requirements?view=matrix')}
        >
          <div className="text-3xl mb-2">🎯</div>
          <div className="font-medium text-gray-900">优先级矩阵</div>
        </button>
      </div>
    </div>
  )
}

export default Dashboard