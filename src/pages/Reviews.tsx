import React, { useEffect, useState, useMemo } from 'react'
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useTaskStore } from '@/store/taskStore'
import { useProjectStore } from '@/store/projectStore'
import { useReviewStore } from '@/store/reviewStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { ReviewStats } from '@/types'

type ReviewTab = 'daily' | 'weekly' | 'monthly'

const Reviews: React.FC = () => {
  const { tasks, loadTasks } = useTaskStore()
  const { projects, loadProjects } = useProjectStore()
  const { reviews, loadReviews, addReview, updateReview } = useReviewStore()

  const [activeTab, setActiveTab] = useState<ReviewTab>('daily')
  const [manualNotes, setManualNotes] = useState('')
  const [savedReviewId, setSavedReviewId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTasks()
    loadProjects()
    loadReviews()
  }, [loadTasks, loadProjects, loadReviews])

  // Calculate period
  const now = new Date()
  const period = useMemo(() => {
    const today = new Date()
    switch (activeTab) {
      case 'daily':
        return {
          start: startOfDay(today),
          end: endOfDay(today),
          label: format(today, 'yyyy年MM月dd日', { locale: zhCN }),
        }
      case 'weekly': {
        const start = subDays(today, today.getDay())
        return {
          start: startOfDay(start),
          end: endOfDay(today),
          label: `${format(start, 'MM月dd日')} - ${format(today, 'MM月dd日')}`,
        }
      }
      case 'monthly':
        return {
          start: startOfDay(new Date(today.getFullYear(), today.getMonth(), 1)),
          end: endOfDay(today),
          label: format(today, 'yyyy年M月', { locale: zhCN }),
        }
    }
  }, [activeTab])

  // Calculate stats
  const stats = useMemo((): ReviewStats => {
    const periodEnd = period.end
    const periodStart = period.start

    // For daily, use today; for weekly, use last 7 days; for monthly, use last 30 days
    let chartStart: Date
    if (activeTab === 'daily') {
      chartStart = subDays(now, 6)
    } else if (activeTab === 'weekly') {
      chartStart = subWeeks(now, 1)
    } else {
      chartStart = subMonths(now, 1)
    }

    const periodTasks = tasks.filter((t) => {
      const createdAt = new Date(t.createdAt)
      return createdAt >= chartStart && createdAt <= periodEnd
    })

    const completedTasks = periodTasks.filter((t) => t.status === 'done')
    const total = periodTasks.length
    const completed = completedTasks.length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // Average completion time
    let totalHours = 0
    let countWithTime = 0
    completedTasks.forEach((t) => {
      if (t.completedAt && t.createdAt) {
        const created = new Date(t.createdAt).getTime()
        const completed = new Date(t.completedAt).getTime()
        totalHours += (completed - created) / (1000 * 60 * 60)
        countWithTime++
      }
    })
    const avgCompletionHours = countWithTime > 0 ? Math.round((totalHours / countWithTime) * 10) / 10 : 0

    // Project progress
    const projectProgress: Record<string, number> = {}
    projects.forEach((p) => {
      const projectTasks = tasks.filter((t) => t.projectId === p.id)
      if (projectTasks.length > 0) {
        const done = projectTasks.filter((t) => t.status === 'done').length
        projectProgress[p.id] = Math.round((done / projectTasks.length) * 100)
      }
    })

    return { totalTasks: total, completedTasks: completed, completionRate, avgCompletionHours, projectProgress }
  }, [tasks, projects, period, activeTab])

  // Trend data for chart
  const trendData = useMemo(() => {
    let days: Date[]
    if (activeTab === 'daily') {
      days = eachDayOfInterval({ start: subDays(now, 6), end: now })
    } else if (activeTab === 'weekly') {
      days = eachDayOfInterval({ start: subDays(now, 6), end: now })
    } else {
      days = eachDayOfInterval({ start: subDays(now, 29), end: now })
    }
    return days.map((d) => {
      const dateStr = format(d, 'yyyy-MM-dd')
      const count = tasks.filter(
        (t) => t.completedAt && t.completedAt.startsWith(dateStr)
      ).length
      return {
        date: format(d, 'MM/dd'),
        completed: count,
      }
    })
  }, [tasks, activeTab])

  // Project distribution for pie chart
  const pieData = useMemo(() => {
    const data: { name: string; value: number; color: string }[] = []
    projects.forEach((p) => {
      const count = tasks.filter((t) => t.projectId === p.id && t.status === 'done').length
      if (count > 0) {
        data.push({ name: p.name, value: count, color: p.color })
      }
    })
    const noProject = tasks.filter((t) => !t.projectId && t.status === 'done').length
    if (noProject > 0) {
      data.push({ name: '无项目', value: noProject, color: '#9ca3af' })
    }
    return data
  }, [tasks, projects])

  // Load saved review for this period
  useEffect(() => {
    const periodStartStr = period.start.toISOString()
    const existing = reviews.find(
      (r) => r.type === activeTab && r.periodStart === periodStartStr
    )
    if (existing) {
      setManualNotes(existing.manualNotes || '')
      setSavedReviewId(existing.id)
    } else {
      setManualNotes('')
      setSavedReviewId(null)
    }
  }, [activeTab, period, reviews])

  const handleSaveReview = async () => {
    setSaving(true)
    try {
      const data = {
        type: activeTab,
        periodStart: period.start.toISOString(),
        periodEnd: period.end.toISOString(),
        manualNotes: manualNotes.trim() || undefined,
        stats,
      }
      if (savedReviewId) {
        await updateReview(savedReviewId, data)
      } else {
        await addReview(data as any)
      }
      setSaving(false)
      alert('复盘保存成功！')
    } catch {
      setSaving(false)
    }
  }

  const handleExport = () => {
    const content = `# 复盘报告 - ${period.label}

## 统计数据
- 总任务数: ${stats.totalTasks}
- 完成任务数: ${stats.completedTasks}
- 完成率: ${stats.completionRate}%
- 平均完成时长: ${stats.avgCompletionHours}小时

## 项目进度
${projects.map((p) => {
  const progress = stats.projectProgress[p.id] || 0
  return `- ${p.name}: ${progress}%`
}).join('\n')}

## 手动复盘笔记
${manualNotes || '（无）'}

---

生成时间: ${format(now, 'yyyy-MM-dd HH:mm')}
`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `复盘报告_${format(now, 'yyyyMMdd')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">复盘总结</h2>
        <div className="flex items-center space-x-2">
          <button className="btn-secondary btn-sm" onClick={handleExport}>导出报告</button>
          <button className="btn-primary" onClick={handleSaveReview} disabled={saving}>
            {saving ? '保存中...' : '保存复盘'}
          </button>
        </div>
      </div>

      {/* Tab switch */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        {[
          { key: 'daily' as const, label: '日报' },
          { key: 'weekly' as const, label: '周报' },
          { key: 'monthly' as const, label: '月报' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === tab.key ? 'bg-white shadow-sm font-medium' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Period info */}
      <p className="text-sm text-gray-500">统计周期：{period.label}</p>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500">总任务数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTasks}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">已完成</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.completedTasks}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">完成率</p>
          <p className="text-2xl font-bold text-primary-500 mt-1">{stats.completionRate}%</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">平均完成时长</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.avgCompletionHours}h</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">完成任务趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="completed" name="完成任务" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project distribution */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">项目分布</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
              暂无数据
            </div>
          )}
        </div>
      </div>

      {/* Project progress list */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">项目进度</h3>
        {projects.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无项目</p>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => {
              const progress = stats.projectProgress[p.id] || 0
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{p.name}</span>
                    <span className="text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Manual notes */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">手动复盘笔记</h3>
        <textarea
          className="input min-h-[120px]"
          placeholder={`写下你对${activeTab === 'daily' ? '今天' : activeTab === 'weekly' ? '本周' : '本月'}工作的总结与反思...

例如：
- 完成了哪些重要工作？
- 遇到了什么问题？
- 下一步计划是什么？`}
          value={manualNotes}
          onChange={(e) => setManualNotes(e.target.value)}
        />
        <div className="flex justify-end mt-3">
          <button className="btn-primary" onClick={handleSaveReview} disabled={saving}>
            {saving ? '保存中...' : '保存复盘'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reviews