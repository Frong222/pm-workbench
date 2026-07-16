import React, { useEffect, useState } from 'react'
import { Folder } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useTaskStore } from '@/store/taskStore'
import { type ProjectStatus } from '@/types'
import Modal from '@/components/Modal'

const Projects: React.FC = () => {
  const { projects, loading, loadProjects, addProject, updateProject, deleteProject } = useProjectStore()
  const { tasks, loadTasks } = useTaskStore()
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'active' as ProjectStatus,
    startDate: '',
    endDate: '',
    color: '#3b82f6',
  })

  useEffect(() => {
    loadProjects()
    loadTasks()
  }, [loadProjects, loadTasks])

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId)
    if (projectTasks.length === 0) return 0
    const done = projectTasks.filter((t) => t.status === 'done').length
    return Math.round((done / projectTasks.length) * 100)
  }

  const openNew = () => {
    setEditingProject(null)
    setForm({ name: '', description: '', status: 'active', startDate: '', endDate: '', color: '#3b82f6' })
    setShowModal(true)
  }

  const openEdit = (project: typeof projects[0]) => {
    setEditingProject(project.id)
    setForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      color: project.color,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    const data = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      color: form.color,
    }
    if (editingProject) {
      await updateProject(editingProject, data)
    } else {
      await addProject(data as any)
    }
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('确认删除该项目？')) {
      await deleteProject(id)
    }
  }

  const statusLabels: Record<string, string> = {
    active: '进行中',
    paused: '已暂停',
    completed: '已完成',
    archived: '已归档',
  }

  const statusColors: Record<string, string> = {
    active: '#3b82f6',
    paused: '#f59e0b',
    completed: '#10b981',
    archived: '#6b7280',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">项目管理</h2>
        <button className="btn-primary" onClick={openNew}>
          + 新建项目
        </button>
      </div>

      {loading && projects.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="dot-loading" />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Folder className="w-10 h-10" /></div>
          <div className="empty-title">暂无项目</div>
          <div className="empty-desc">创建你的第一个项目来开始管理工作</div>
          <button className="btn-primary mt-4" onClick={openNew}>
            创建第一个项目
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const progress = getProjectProgress(project.id)
            const projectTasks = tasks.filter((t) => t.projectId === project.id)
            return (
              <div
                key={project.id}
                className="card card-hover p-5"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${project.color}40`
                  e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.3), 0 0 15px ${project.color}10`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color, boxShadow: `0 0 8px ${project.color}60` }}
                    />
                    <h3 className="font-semibold text-foreground">{project.name}</h3>
                  </div>
                  <span
                    className="badge border-2"
                    style={{
                      backgroundColor: statusColors[project.status] + '15',
                      color: statusColors[project.status],
                      borderColor: statusColors[project.status] + '30',
                    }}
                  >
                    {statusLabels[project.status]}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                )}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">进度</span>
                    <span className="font-medium text-foreground">{progress}%</span>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{ width: `${progress}%`, backgroundColor: project.color, boxShadow: `0 0 10px ${project.color}40` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>任务 {projectTasks.length}</span>
                    {project.endDate && <span>截止 {project.endDate}</span>}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button className="btn-ghost btn-sm" onClick={() => openEdit(project)}>
                    编辑
                  </button>
                  <button className="btn-ghost btn-sm text-destructive" onClick={() => handleDelete(project.id)}>
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProject ? '编辑项目' : '新建项目'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>
              取消
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={!form.name.trim()}>
              保存
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">项目名称 *</label>
            <input
              className="input"
              placeholder="请输入项目名称"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">描述</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="输入项目描述"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">状态</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
              >
                <option value="active">进行中</option>
                <option value="paused">已暂停</option>
                <option value="completed">已完成</option>
                <option value="archived">已归档</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">颜色</label>
              <input
                type="color"
                className="input h-[38px] p-1"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">开始日期</label>
              <input
                type="date"
                className="input"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">截止日期</label>
              <input
                type="date"
                className="input"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Projects
