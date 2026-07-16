import React, { useEffect, useState } from 'react'
import { useRequirementStore } from '@/store/requirementStore'
import { useProjectStore } from '@/store/projectStore'
import {
  PriorityConfig,
  RequirementStatusConfig,
  RequirementSourceConfig,
  type RequirementPriority,
  type RequirementStatus,
  type RequirementSource,
} from '@/types'
import Modal from '@/components/Modal'

const Requirements: React.FC = () => {
  const { requirements, loading, loadRequirements, addRequirement, updateRequirement, deleteRequirement } =
    useRequirementStore()
  const { projects, loadProjects } = useProjectStore()
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [showModal, setShowModal] = useState(false)
  const [editingReq, setEditingReq] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<RequirementStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<RequirementPriority | 'all'>('all')

  const [form, setForm] = useState({
    title: '',
    description: '',
    acceptanceCriteria: '',
    priority: 'P2' as RequirementPriority,
    status: 'proposed' as RequirementStatus,
    source: 'user_feedback' as RequirementSource,
    proposer: '',
    projectId: '',
    version: '',
    module: '',
    evaluationResult: '',
    scheduleInfo: '',
  })

  useEffect(() => {
    loadRequirements()
    loadProjects()
  }, [loadRequirements, loadProjects])

  const filteredRequirements = requirements.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false
    return true
  })

  const openNew = () => {
    setEditingReq(null)
    setForm({
      title: '',
      description: '',
      acceptanceCriteria: '',
      priority: 'P2',
      status: 'proposed',
      source: 'user_feedback',
      proposer: '',
      projectId: '',
      version: '',
      module: '',
      evaluationResult: '',
      scheduleInfo: '',
    })
    setShowModal(true)
  }

  const openEdit = (req: typeof requirements[0]) => {
    setEditingReq(req.id)
    setForm({
      title: req.title,
      description: req.description,
      acceptanceCriteria: req.acceptanceCriteria || '',
      priority: req.priority,
      status: req.status,
      source: req.source,
      proposer: req.proposer || '',
      projectId: req.projectId || '',
      version: req.version || '',
      module: req.module || '',
      evaluationResult: req.evaluationResult || '',
      scheduleInfo: req.scheduleInfo || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) return
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      acceptanceCriteria: form.acceptanceCriteria.trim() || undefined,
      priority: form.priority,
      status: form.status,
      source: form.source,
      proposer: form.proposer.trim() || undefined,
      projectId: form.projectId || undefined,
      version: form.version.trim() || undefined,
      module: form.module.trim() || undefined,
      evaluationResult: form.evaluationResult.trim() || undefined,
      scheduleInfo: form.scheduleInfo.trim() || undefined,
    }
    if (editingReq) {
      await updateRequirement(editingReq, data)
    } else {
      await addRequirement(data as any)
    }
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    const req = requirements.find((r) => r.id === id)
    if (req && !['proposed', 'rejected'].includes(req.status)) {
      alert('仅"待评估"和"已驳回"状态的需求可删除')
      return
    }
    if (confirm('确认删除该需求？')) {
      await deleteRequirement(id)
    }
  }

  const getBadge = (config: Record<string, { label: string; color: string; textColor?: string }>, key: string) => {
    const c = config[key]
    if (!c) return null
    return (
      <span
        className="badge border"
        style={{
          backgroundColor: c.color + '20',
          color: c.textColor || c.color,
          borderColor: c.color + '30',
        }}
      >
        {c.label}
      </span>
    )
  }

  const kanbanColumns = [
    { key: 'proposed' as const, label: '待评估' },
    { key: 'evaluating' as const, label: '评估中' },
    { key: 'approved' as const, label: '已通过' },
    { key: 'scheduled' as const, label: '已排期' },
    { key: 'developing' as const, label: '开发中' },
    { key: 'testing' as const, label: '测试中' },
    { key: 'delivered' as const, label: '已上线' },
  ]

  const statusLabels: Record<string, string> = {
    proposed: '待评估',
    evaluating: '评估中',
    approved: '已通过',
    rejected: '已驳回',
    scheduled: '已排期',
    developing: '开发中',
    testing: '测试中',
    delivered: '已上线',
    closed: '已关闭',
  }

  const handleStatusChange = async (req: typeof requirements[0], newStatus: RequirementStatus) => {
    await updateRequirement(req.id, { status: newStatus })
  }

  if (loading && requirements.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="dot-loading" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">需求管理</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="segmented-control">
            <button
              className={`segmented-item ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              列表
            </button>
            <button
              className={`segmented-item ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              看板
            </button>
          </div>
          <button className="btn-primary transition-all duration-200 active:scale-[0.97] shrink-0" onClick={openNew}>
            + 新建需求
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
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            className="input w-auto"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
          >
            <option value="all">全部优先级</option>
            <option value="P0">P0</option>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
          <span className="text-sm text-muted-foreground">共 {filteredRequirements.length} 条</span>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">需求标题</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">优先级</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">状态</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">来源</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">提出人</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">版本</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequirements.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-icon">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="empty-title">暂无需求</p>
                      <p className="empty-desc">点击"新建需求"开始添加</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequirements.map((req) => (
                  <tr key={req.id} className="table-row">
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{req.title}</span>
                      {req.module && (
                        <span className="tag ml-2">{req.module}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getBadge(PriorityConfig, req.priority)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="badge border"
                        style={{
                          backgroundColor: (RequirementStatusConfig[req.status]?.color || '#475569') + '20',
                          color: RequirementStatusConfig[req.status]?.color || '#94a3b8',
                          borderColor: (RequirementStatusConfig[req.status]?.color || '#475569') + '30',
                        }}
                      >
                        {RequirementStatusConfig[req.status]?.label || req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="badge border"
                        style={{
                          backgroundColor: (RequirementSourceConfig[req.source]?.color || '#475569') + '20',
                          color: RequirementSourceConfig[req.source]?.color || '#94a3b8',
                          borderColor: (RequirementSourceConfig[req.source]?.color || '#475569') + '30',
                        }}
                      >
                        {RequirementSourceConfig[req.source]?.label || req.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{req.proposer || '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{req.version || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="btn-ghost btn-sm transition-all duration-200 active:scale-[0.97]"
                        onClick={() => openEdit(req)}
                      >
                        编辑
                      </button>
                      <button
                        className="btn-destructive btn-sm transition-all duration-200 active:scale-[0.97]"
                        onClick={() => handleDelete(req.id)}
                      >
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {kanbanColumns.map((col) => (
            <div key={col.key} className="card p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm">{col.label}</h3>
                <span className="badge border" style={{ backgroundColor: '#94a3b820', color: '#94a3b8', borderColor: '#94a3b830' }}>
                  {requirements.filter((r) => r.status === col.key).length}
                </span>
              </div>
              <div className="space-y-2 min-h-[150px]">
                {requirements
                  .filter((r) => r.status === col.key)
                  .map((req) => (
                    <div
                      key={req.id}
                      className="kanban-card"
                      onClick={() => {
                        const statusOrder = ['proposed', 'evaluating', 'approved', 'scheduled', 'developing', 'testing', 'delivered']
                        const idx = statusOrder.indexOf(req.status)
                        if (idx < statusOrder.length - 1) {
                          handleStatusChange(req, statusOrder[idx + 1] as RequirementStatus)
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        {getBadge(PriorityConfig, req.priority)}
                        {getBadge(RequirementSourceConfig, req.source)}
                      </div>
                      <p className="font-medium text-foreground text-xs leading-tight">{req.title}</p>
                      {req.proposer && (
                        <p className="text-xs text-muted-foreground mt-1">{req.proposer}</p>
                      )}
                    </div>
                  ))}
                {requirements.filter((r) => r.status === col.key).length === 0 && (
                  <p className="text-muted-foreground text-xs text-center py-4">暂无</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingReq ? '编辑需求' : '新建需求'}
        footer={
          <>
            <button className="btn-secondary transition-all duration-200 active:scale-[0.97]" onClick={() => setShowModal(false)}>
              取消
            </button>
            <button
              className="btn-primary transition-all duration-200 active:scale-[0.97]"
              onClick={handleSave}
              disabled={!form.title.trim() || !form.description.trim()}
            >
              保存
            </button>
          </>
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">需求标题 *</label>
            <input
              className="input"
              placeholder="请输入需求标题"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">需求描述 *</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="详细描述需求内容"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">验收标准</label>
            <textarea
              className="input min-h-[60px]"
              placeholder="描述验收标准/DoD"
              value={form.acceptanceCriteria}
              onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">优先级</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as RequirementPriority })}
              >
                <option value="P0">P0 - 必须做</option>
                <option value="P1">P1 - 应该做</option>
                <option value="P2">P2 - 可以做</option>
                <option value="P3">P3 - 暂缓</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">状态</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as RequirementStatus })}
              >
                <option value="proposed">待评估</option>
                <option value="evaluating">评估中</option>
                <option value="approved">已通过</option>
                <option value="rejected">已驳回</option>
                <option value="scheduled">已排期</option>
                <option value="developing">开发中</option>
                <option value="testing">测试中</option>
                <option value="delivered">已上线</option>
                <option value="closed">已关闭</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">来源</label>
              <select
                className="input"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as RequirementSource })}
              >
                <option value="user_feedback">用户反馈</option>
                <option value="internal">内部需求</option>
                <option value="boss">老板需求</option>
                <option value="data_analysis">数据分析</option>
                <option value="competitive">竞品分析</option>
                <option value="operations">运营需求</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">提出人</label>
              <input
                className="input"
                placeholder="提出人姓名"
                value={form.proposer}
                onChange={(e) => setForm({ ...form, proposer: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">关联版本</label>
              <input
                className="input"
                placeholder="如 v2.0"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">所属模块</label>
              <input
                className="input"
                placeholder="如 用户端"
                value={form.module}
                onChange={(e) => setForm({ ...form, module: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">排期信息</label>
              <input
                className="input"
                placeholder="预计上线时间"
                value={form.scheduleInfo}
                onChange={(e) => setForm({ ...form, scheduleInfo: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">评估结果</label>
            <textarea
              className="input min-h-[60px]"
              placeholder="评估结论、技术可行性等"
              value={form.evaluationResult}
              onChange={(e) => setForm({ ...form, evaluationResult: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Requirements
