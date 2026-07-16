import React, { useEffect, useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ListTodo } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import { useProjectStore } from '@/store/projectStore'
import { useCalendarStore } from '@/store/calendarStore'
import { PriorityConfig, TaskStatusConfig, type TaskPriority, type TaskStatus } from '@/types'
import Modal from '@/components/Modal'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

const Schedule: React.FC = () => {
  const { tasks, loading: tasksLoading, loadTasks, addTask, updateTask, deleteTask } = useTaskStore()
  const { projects, loadProjects } = useProjectStore()
  const { events, loading: eventsLoading, loadEvents, addEvent, updateEvent, deleteEvent } = useCalendarStore()

  const [mainView, setMainView] = useState<'tasks' | 'calendar'>('tasks')
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'kanban'>('list')
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week'>('month')
  
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    dueDate: '',
    tags: '',
    projectId: '',
  })

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    isAllDay: false,
    reminderMinutes: 15,
    taskId: '',
    color: COLORS[0],
  })

  useEffect(() => {
    loadTasks()
    loadProjects()
    loadEvents()
  }, [loadTasks, loadProjects, loadEvents])

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    return true
  })

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let day = calStart
  while (day <= calEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getEventsForDay = (date: Date) =>
    events.filter(
      (e) =>
        format(new Date(e.startTime), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )

  const getTasksForDay = (date: Date) =>
    tasks.filter(
      (t) => t.dueDate === format(date, 'yyyy-MM-dd') && t.status !== 'done'
    )

  const openNewTask = () => {
    setEditingTask(null)
    setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tags: '', projectId: '' })
    setShowTaskModal(true)
  }

  const openEditTask = (task: typeof tasks[0]) => {
    setEditingTask(task.id)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate || '',
      tags: task.tags.join(', '),
      projectId: task.projectId || '',
    })
    setShowTaskModal(true)
  }

  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) return
    const tags = taskForm.tags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
    const data = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || undefined,
      priority: taskForm.priority,
      status: taskForm.status,
      dueDate: taskForm.dueDate || undefined,
      tags,
      projectId: taskForm.projectId || undefined,
      calendarEventId: undefined,
      completedAt: taskForm.status === 'done' ? new Date().toISOString() : undefined,
    }
    if (editingTask) {
      await updateTask(editingTask, data)
    } else {
      await addTask(data as any)
    }
    setShowTaskModal(false)
  }

  const handleDeleteTask = async (id: string) => {
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

  const openNewEvent = (date?: Date) => {
    const d = date || new Date()
    setEditingEvent(null)
    setEventForm({
      title: '',
      description: '',
      startTime: format(d, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(d, "yyyy-MM-dd'T'HH:mm"),
      isAllDay: false,
      reminderMinutes: 15,
      taskId: '',
      color: COLORS[0],
    })
    setShowEventModal(true)
  }

  const openEditEvent = (event: typeof events[0]) => {
    setEditingEvent(event.id)
    setEventForm({
      title: event.title,
      description: event.description || '',
      startTime: event.startTime.slice(0, 16),
      endTime: event.endTime.slice(0, 16),
      isAllDay: event.isAllDay,
      reminderMinutes: event.reminderMinutes,
      taskId: event.taskId || '',
      color: event.color,
    })
    setShowEventModal(true)
  }

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim()) return
    const startTime = new Date(eventForm.startTime)
    const endTime = new Date(eventForm.endTime)
    const data = {
      title: eventForm.title.trim(),
      description: eventForm.description.trim() || undefined,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      isAllDay: eventForm.isAllDay,
      reminderMinutes: eventForm.reminderMinutes,
      taskId: eventForm.taskId || undefined,
      color: eventForm.color,
    }
    if (editingEvent) {
      await updateEvent(editingEvent, data)
    } else {
      await addEvent(data as any)
    }
    setShowEventModal(false)
  }

  const handleDeleteEvent = async (id: string) => {
    if (confirm('确认删除该事件？')) await deleteEvent(id)
  }

  const prev = () => {
    if (calendarViewMode === 'month') setCurrentDate(subMonths(currentDate, 1))
    else setSelectedDate(addDays(selectedDate, -7))
  }
  const next = () => {
    if (calendarViewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
    else setSelectedDate(addDays(selectedDate, 7))
  }
  const today = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
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

  const reminderLabels: Record<number, string> = {
    0: '不提醒',
    5: '5分钟前',
    15: '15分钟前',
    30: '30分钟前',
    60: '1小时前',
    1440: '1天前',
  }

  const loading = tasksLoading && eventsLoading && tasks.length === 0 && events.length === 0

  if (loading) {
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
        <h2 className="section-title mb-0">日程管理</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="segmented-control">
            <button
              className={`segmented-item${mainView === 'tasks' ? ' active' : ''}`}
              onClick={() => setMainView('tasks')}
            >
              任务
            </button>
            <button
              className={`segmented-item${mainView === 'calendar' ? ' active' : ''}`}
              onClick={() => setMainView('calendar')}
            >
              日历
            </button>
          </div>
          {mainView === 'tasks' ? (
            <button className="btn-primary transition-all duration-200 active:scale-[0.97] shrink-0" onClick={openNewTask}>
              + 新建任务
            </button>
          ) : (
            <button className="btn-primary shrink-0" onClick={() => openNewEvent()}>+ 新建事件</button>
          )}
        </div>
      </div>

      {mainView === 'tasks' && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="segmented-control">
              <button
                className={`segmented-item${taskViewMode === 'list' ? ' active' : ''}`}
                onClick={() => setTaskViewMode('list')}
              >
                列表
              </button>
              <button
                className={`segmented-item${taskViewMode === 'kanban' ? ' active' : ''}`}
                onClick={() => setTaskViewMode('kanban')}
              >
                看板
              </button>
            </div>
            {taskViewMode === 'list' && (
              <>
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
              </>
            )}
          </div>

          {taskViewMode === 'list' && (
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
                      <tr key={task.id} className="table-row">
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
                              <span key={tag} className="tag">{tag}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="btn-ghost btn-sm transition-all duration-200 active:scale-[0.97]" onClick={() => openEditTask(task)}>
                            编辑
                          </button>
                          <button className="btn-ghost btn-sm btn-destructive transition-all duration-200 active:scale-[0.97]" onClick={() => handleDeleteTask(task.id)}>
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

          {taskViewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {kanbanColumns.map((col) => (
                <div key={col.key} className="card card-hover p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">{col.label}</h3>
                    <span className="badge" style={{ backgroundColor: `${col.color}20`, color: col.color, boxShadow: `0 0 6px ${col.color}50` }}>
                      {tasks.filter((t) => t.status === col.key).length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[200px]">
                    {tasks.filter((t) => t.status === col.key).map((task) => (
                      <div
                        key={task.id}
                        className="kanban-card"
                        onClick={() => {
                          const nextStatus =
                            col.key === 'todo' ? 'in-progress' : col.key === 'in-progress' ? 'done' : 'todo'
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
                              <span key={tag} className="tag text-xs">{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex justify-end">
                          <button
                            className="btn-ghost btn-sm text-xs transition-all duration-200 active:scale-[0.97]"
                            onClick={(e) => { e.stopPropagation(); openEditTask(task) }}
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
                      setTaskForm({
                        title: '',
                        description: '',
                        priority: 'medium',
                        status: col.key,
                        dueDate: '',
                        tags: '',
                        projectId: '',
                      })
                      setEditingTask(null)
                      setShowTaskModal(true)
                    }}
                  >
                    + 添加任务
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mainView === 'calendar' && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="segmented-control">
              <button className={`segmented-item ${calendarViewMode === 'month' ? 'active' : ''}`} onClick={() => setCalendarViewMode('month')}>月</button>
              <button className={`segmented-item ${calendarViewMode === 'week' ? 'active' : ''}`} onClick={() => setCalendarViewMode('week')}>周</button>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost btn-sm" onClick={prev}>←</button>
              <h3 className="text-lg font-semibold text-foreground">
                {calendarViewMode === 'month'
                  ? format(currentDate, 'yyyy年 M月', { locale: zhCN })
                  : `${format(weekStart, 'M月d日', { locale: zhCN })} - ${format(addDays(weekStart, 6), 'M月d日', { locale: zhCN })}`}
              </h3>
              <button className="btn-ghost btn-sm" onClick={next}>→</button>
              <button className="btn-secondary btn-sm" onClick={today}>今天</button>
            </div>
          </div>

          {calendarViewMode === 'month' && (
            <div className="card overflow-hidden">
              <div className="grid grid-cols-7 border-b border-border">
                {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
                  <div key={d} className="px-3 py-2 text-sm font-medium text-muted-foreground text-center">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((date, idx) => {
                  const dayEvents = getEventsForDay(date)
                  const dayTasks = getTasksForDay(date)
                  const isCurrentMonth = isSameMonth(date, currentDate)
                  const isSelected = isSameDay(date, selectedDate)
                  const isTodayDate = isToday(date)
                  return (
                    <div
                      key={idx}
                      className={`min-h-[100px] border-b border-r border-border p-1 cursor-pointer transition-all duration-200 hover:bg-white/[0.04] ${isSelected ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}
                      style={{
                        backgroundColor: isTodayDate ? 'rgba(52,211,153,0.08)' : !isCurrentMonth ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
                      }}
                      onClick={() => { setSelectedDate(date); setCalendarViewMode('week') }}
                      onDoubleClick={() => openNewEvent(date)}
                    >
                      <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 ${isTodayDate ? 'bg-indigo-500 text-white' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {format(date, 'd')}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className="text-xs px-1.5 py-0.5 rounded truncate text-foreground cursor-pointer transition-all duration-200 hover:bg-white/[0.04] bg-white/[0.03] border-l-2"
                            style={{ borderLeftColor: event.color }}
                            onClick={(e) => { e.stopPropagation(); openEditEvent(event) }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground px-1">+{dayEvents.length - 3} 更多</div>
                        )}
                        {dayTasks.map((task) => (
                          <div key={task.id} className="badge text-xs truncate flex items-center">
                            <ListTodo className="w-3 h-3 mr-1" />{task.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {calendarViewMode === 'week' && (
            <div className="card overflow-hidden">
              <div className="grid grid-cols-7 border-b border-border">
                {weekDays.map((date, idx) => (
                  <div key={idx} className="px-3 py-2 text-center border-r border-border">
                    <div className="text-sm font-medium text-muted-foreground">{format(date, 'EEE', { locale: zhCN })}</div>
                    <div className={`text-lg font-semibold mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-all duration-200 ${isToday(date) ? 'bg-indigo-500 text-white' : 'text-foreground'}`}>
                      {format(date, 'd')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {weekDays.map((date, idx) => {
                  const dayEvents = getEventsForDay(date)
                  const dayTasks = getTasksForDay(date)
                  return (
                    <div key={idx} className="min-h-[300px] border-r border-border p-1 cursor-pointer transition-all duration-200 hover:bg-white/[0.04]"
                      style={{ backgroundColor: isToday(date) ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.02)' }}
                      onClick={() => openNewEvent(date)}
                    >
                      <div className="space-y-1 mt-1">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="text-xs px-1.5 py-1 rounded text-foreground cursor-pointer transition-all duration-200 hover:bg-white/[0.04] bg-white/[0.05] border border-white/[0.06] border-l-[3px]"
                            style={{ borderLeftColor: event.color }}
                            onClick={(e) => { e.stopPropagation(); openEditEvent(event) }}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            {!event.isAllDay && (
                              <div className="opacity-80">
                                {format(new Date(event.startTime), 'HH:mm')}-{format(new Date(event.endTime), 'HH:mm')}
                              </div>
                            )}
                          </div>
                        ))}
                        {dayTasks.map((task) => (
                          <div key={task.id} className="badge text-xs flex items-center">
                            <ListTodo className="w-3 h-3 mr-1" />{task.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3">今日事件</h3>
            <div className="space-y-2">
              {getEventsForDay(new Date()).length === 0 ? (
                <p className="text-muted-foreground text-sm">今日暂无事件</p>
              ) : (
                getEventsForDay(new Date()).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl transition-all duration-200 hover:bg-white/[0.05] border border-white/[0.06] border-l-[3px]" style={{ borderLeftColor: event.color }}>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                      <div>
                        <span className="font-medium text-foreground text-sm">{event.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {format(new Date(event.startTime), 'HH:mm')}-{format(new Date(event.endTime), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                    <button className="btn-destructive btn-sm" onClick={() => handleDeleteEvent(event.id)}>删除</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title={editingTask ? '编辑任务' : '新建任务'}
        footer={
          <>
            <button className="btn-secondary transition-all duration-200 active:scale-[0.97]" onClick={() => setShowTaskModal(false)}>取消</button>
            <button className="btn-primary transition-all duration-200 active:scale-[0.97]" onClick={handleSaveTask} disabled={!taskForm.title.trim()}>保存</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">标题 *</label>
            <input className="input" placeholder="请输入任务标题" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">描述</label>
            <textarea className="input min-h-[80px]" placeholder="输入任务描述" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">优先级</label>
              <select className="input" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">状态</label>
              <select className="input" value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as TaskStatus })}>
                <option value="todo">待办</option>
                <option value="in-progress">进行中</option>
                <option value="done">已完成</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">截止日期</label>
            <input type="date" className="input" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">标签（逗号分隔）</label>
            <input className="input" placeholder="如: 评审, 文档, 调研" value={taskForm.tags} onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">所属项目</label>
            <select className="input" value={taskForm.projectId} onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}>
              <option value="">无</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={editingEvent ? '编辑事件' : '新建事件'}
        footer={
          <>
            {editingEvent && (
              <button className="btn-destructive btn-sm" onClick={() => { handleDeleteEvent(editingEvent); setShowEventModal(false) }}>删除</button>
            )}
            <div className="flex-1" />
            <button className="btn-secondary" onClick={() => setShowEventModal(false)}>取消</button>
            <button className="btn-primary" onClick={handleSaveEvent} disabled={!eventForm.title.trim()}>保存</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">标题 *</label>
            <input className="input" placeholder="事件标题" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">描述</label>
            <textarea className="input min-h-[60px]" placeholder="事件描述" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="isAllDay" checked={eventForm.isAllDay} onChange={(e) => setEventForm({ ...eventForm, isAllDay: e.target.checked })} />
            <label htmlFor="isAllDay" className="text-sm text-foreground">全天事件</label>
          </div>
          {!eventForm.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">开始时间</label>
                <input type="datetime-local" className="input" value={eventForm.startTime} onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">结束时间</label>
                <input type="datetime-local" className="input" value={eventForm.endTime} onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">提醒</label>
              <select className="input" value={eventForm.reminderMinutes} onChange={(e) => setEventForm({ ...eventForm, reminderMinutes: Number(e.target.value) })}>
                {[0, 0, 5, 15, 30, 60, 1440].map((v) => (
                  <option key={v} value={v}>{reminderLabels[v] || `${v}分钟前`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">颜色</label>
              <div className="flex space-x-1">
                {COLORS.map((c) => (
                  <button key={c} className={`w-6 h-6 rounded-full border-2 transition-all duration-200 active:scale-[0.97] ${eventForm.color === c ? 'border-foreground ring-2 ring-indigo-500/30' : 'border-border'}`}
                    style={{ backgroundColor: c }} onClick={() => setEventForm({ ...eventForm, color: c })} />
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">关联任务</label>
            <select className="input" value={eventForm.taskId} onChange={(e) => setEventForm({ ...eventForm, taskId: e.target.value })}>
              <option value="">无</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Schedule