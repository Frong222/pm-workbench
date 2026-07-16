import React, { useEffect, useState } from 'react'
import { useTaskStore } from '@/store/taskStore'
import { useProjectStore } from '@/store/projectStore'
import { PriorityConfig, TaskStatusConfig, type TaskPriority, type TaskStatus } from '@/types'
import Modal from '@/components/Modal'

const Tasks: React.FC = () => {
  const { tasks, loading, loadTasks, addTask, updateTask, deleteTask } = useTaskStore()
  const { projects, loadProjects } = useProjectStore()
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')

  // Form
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    dueDate: '',
    tags: '',
    projectId: '',
  })

  useEffect(() => {
    loadTasks()
    loadProjects()
  }, [loadTasks, loadProjects])

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    return true
  })

  const openNew = () => {
    setEditingTask(null)
    setForm({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tags: '', projectId: '' })
    setShowModal(true)
  }

  const openEdit = (task: typeof tasks[0]) => {
    setEditingTask(task.id)
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate || '',
      tags: task.tags.join(', '),
      projectId: task.projectId || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    const tags = form.tags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
    const data = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate || undefined,
      tags,
      projectId: form.projectId || undefined,
      calendarEventId: undefined,
      completedAt: form.status === 'done' ? new Date().toISOString() : undefined,
    }
    if (editingTask) {
      await updateTask(editingTask, data)
    } else {
      await addTask(data as any)
    }
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('确认删除该任务？')) {
      await deleteTask(id)
    }
  }

  const handleStatusChange = async (task: typeof tasks[0], newStatus: TaskStatus) => {
    const updates: any = { status: newStatus }
    if (newStatus === 'done') updates.completedAt = new Date().toISOString()
    if (newStatus !== 'done') updates.completedAt = undefined
    await updateTask(task.id, updates)
  }

  const getPriorityBadge = (priority: string) => {
    const config = PriorityConfig[priority]
    return (
      <span
        className="badge"
        style={{
          backgroundColor: `${config.color}20`,
          color: config.color,
          boxShadow: `0 0 6px ${config.color}50`,
        }}
      >
        {config.label}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const config = TaskStatusConfig[status]
    return (
      <span
        className="badge"
        style={{
          backgroundColor: `${config.color}20`,
          color: config.color,
          boxShadow: `0 0 6px ${config.color}50`,
        }}
      >
        {config.label}
      </span>
    )
  }

  const kanbanColumns = [
    { key: 'todo' as const, label: '待办', color: '#e5e7eb' },
    { key: 'in-progress' as const, label: '进行中', color: '#bfdbfe' },
    { key: 'done' as const, label: '已完成', color: '#bbf7d0' },
  ]

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-2">
          <div className="dot-loading" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="section-title mb-0">任务管理</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="segmented-control">
            <button
              className={`segmented-item${viewMode === 'list' ? ' active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              列表
            </button>
            <button
              className={`segmented-item${viewMode === 'kanban' ? ' active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              看板
            </button>
          </div>
          <button className="btn-primary transition-all duration-200 active:scale-[0.97] shrink-0" onClick={openNew}>
            + 新建任务
          </button>
        </div>
      </div>

      {/* Filters */}
      {viewMode === 'list' && (
        <div className="flex items-center space-x-3">
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">全部状态</option>
            <option value="todo">待办</option>
            <option value="in-progress">进行中</option>
            <option value="done">已完成</option>
          </select>
          <select
            className="input w-auto"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
          >
            <option value="all">全部优先级</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
          <span className="text-sm text-muted-foreground">共 {filteredTasks.length} 条</span>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card card-hover overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">标题</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">优先级</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">状态</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">截止日期</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">标签</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon" />
                      <div className="empty-title">暂无任务</div>
                      <div className="empty-desc">点击"新建任务"开始创建第一个任务</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="table-row"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{task.title}</span>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">{getPriorityBadge(task.priority)}</td>
                    <td className="px-4 py-3">{getStatusBadge(task.status)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {task.dueDate || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag) => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn-ghost btn-sm transition-all duration-200 active:scale-[0.97]" onClick={() => openEdit(task)}>
                        编辑
                      </button>
                      <button className="btn-ghost btn-sm btn-destructive transition-all duration-200 active:scale-[0.97]" onClick={() => handleDelete(task.id)}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kanbanColumns.map((col) => (
            <div key={col.key} className="card card-hover p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">{col.label}</h3>
                <span
                  className="badge"
                  style={{
                    backgroundColor: `${col.color}20`,
                    color: col.color,
                    boxShadow: `0 0 6px ${col.color}50`,
                  }}
                >
                  {tasks.filter((t) => t.status === col.key).length}
                </span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {tasks
                  .filter((t) => t.status === col.key)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="kanban-card"
                      onClick={() => {
                        const nextStatus =
                          col.key === 'todo'
                            ? 'in-progress'
                            : col.key === 'in-progress'
                            ? 'done'
                            : 'todo'
                        handleStatusChange(task, nextStatus)
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        {getPriorityBadge(task.priority)}
                        {col.key === 'todo' && task.dueDate && (
                          <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                        )}
                      </div>
                      <p className="font-medium text-foreground text-sm">{task.title}</p>
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map((tag) => (
                            <span key={tag} className="tag text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex justify-end">
                        <button
                          className="btn-ghost btn-sm text-xs transition-all duration-200 active:scale-[0.97]"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(task)
                          }}
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                  ))}
                {tasks.filter((t) => t.status === col.key).length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">暂无任务</p>
                )}
              </div>
              <button
                className="w-full mt-3 py-2 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-all duration-200 active:scale-[0.97]"
                onClick={() => {
                  setForm({
                    title: '',
                    description: '',
                    priority: 'medium',
                    status: col.key,
                    dueDate: '',
                    tags: '',
                    projectId: '',
                  })
                  setEditingTask(null)
                  setShowModal(true)
                }}
              >
                + 添加任务
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTask ? '编辑任务' : '新建任务'}
        footer={
          <>
            <button className="btn-secondary transition-all duration-200 active:scale-[0.97]" onClick={() => setShowModal(false)}>
              取消
            </button>
            <button className="btn-primary transition-all duration-200 active:scale-[0.97]" onClick={handleSave} disabled={!form.title.trim()}>
              保存
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">标题 *</label>
            <input
              className="input"
              placeholder="请输入任务标题"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">描述</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="输入任务描述"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">优先级</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">状态</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
              >
                <option value="todo">待办</option>
                <option value="in-progress">进行中</option>
                <option value="done">已完成</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">截止日期</label>
            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">标签（逗号分隔）</label>
            <input
              className="input"
              placeholder="如: 评审, 文档, 调研"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">所属项目</label>
            <select
              className="input"
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            >
              <option value="">无</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Tasks
