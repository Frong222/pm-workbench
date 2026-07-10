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
  getHours,
  getMinutes,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useCalendarStore } from '@/store/calendarStore'
import { useTaskStore } from '@/store/taskStore'
import Modal from '@/components/Modal'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

const Calendar: React.FC = () => {
  const { events, loading, loadEvents, addEvent, updateEvent, deleteEvent } = useCalendarStore()
  const { tasks, loadTasks } = useTaskStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [form, setForm] = useState({
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
    loadEvents()
    loadTasks()
  }, [loadEvents, loadTasks])

  // Month navigation
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

  // Week navigation
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

  const openNew = (date?: Date) => {
    const d = date || new Date()
    setEditingEvent(null)
    setForm({
      title: '',
      description: '',
      startTime: format(d, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(d, "yyyy-MM-dd'T'HH:mm"),
      isAllDay: false,
      reminderMinutes: 15,
      taskId: '',
      color: COLORS[0],
    })
    setShowModal(true)
  }

  const openEdit = (event: typeof events[0]) => {
    setEditingEvent(event.id)
    setForm({
      title: event.title,
      description: event.description || '',
      startTime: event.startTime.slice(0, 16),
      endTime: event.endTime.slice(0, 16),
      isAllDay: event.isAllDay,
      reminderMinutes: event.reminderMinutes,
      taskId: event.taskId || '',
      color: event.color,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    const startTime = new Date(form.startTime)
    const endTime = new Date(form.endTime)
    const data = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      isAllDay: form.isAllDay,
      reminderMinutes: form.reminderMinutes,
      taskId: form.taskId || undefined,
      color: form.color,
    }
    if (editingEvent) {
      await updateEvent(editingEvent, data)
    } else {
      await addEvent(data as any)
    }
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('确认删除该事件？')) await deleteEvent(id)
  }

  const prev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1))
    else setSelectedDate(addDays(selectedDate, -7))
  }
  const next = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
    else setSelectedDate(addDays(selectedDate, 7))
  }
  const today = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const reminderLabels: Record<number, string> = {
    0: '不提醒',
    0: '事件开始时',
    5: '5分钟前',
    15: '15分钟前',
    30: '30分钟前',
    60: '1小时前',
    1440: '1天前',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">日程安排</h2>
        <div className="flex items-center space-x-2">
          <div className="bg-gray-100 rounded-lg p-0.5 flex">
            <button
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'month' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              onClick={() => setViewMode('month')}
            >月</button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'week' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              onClick={() => setViewMode('week')}
            >周</button>
          </div>
          <button className="btn-primary" onClick={() => openNew()}>+ 新建事件</button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button className="btn-ghost btn-sm" onClick={prev}>←</button>
          <h3 className="text-lg font-semibold">
            {viewMode === 'month'
              ? format(currentDate, 'yyyy年 M月', { locale: zhCN })
              : `${format(weekStart, 'M月d日', { locale: zhCN })} - ${format(addDays(weekStart, 6), 'M月d日', { locale: zhCN })}`}
          </h3>
          <button className="btn-ghost btn-sm" onClick={next}>→</button>
          <button className="btn-secondary btn-sm" onClick={today}>今天</button>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
              <div key={d} className="px-3 py-2 text-sm font-medium text-gray-500 text-center">
                {d}
              </div>
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
                  className={`min-h-[100px] border-b border-r border-gray-50 p-1 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !isCurrentMonth ? 'bg-gray-50/50' : ''
                  } ${isSelected ? 'ring-2 ring-primary-500 ring-inset' : ''}`}
                  onClick={() => {
                    setSelectedDate(date)
                    setViewMode('week')
                  }}
                  onDoubleClick={() => openNew(date)}
                >
                  <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                    isTodayDate ? 'bg-primary-500 text-white' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {format(date, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs px-1.5 py-0.5 rounded truncate text-white cursor-pointer"
                        style={{ backgroundColor: event.color }}
                        onClick={(e) => {
                          e.stopPropagation()
                          openEdit(event)
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-400 px-1">+{dayEvents.length - 3} 更多</div>
                    )}
                    {dayTasks.map((task) => (
                      <div key={task.id} className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 truncate">
                        📋 {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map((date, idx) => (
              <div key={idx} className="px-3 py-2 text-center border-r border-gray-50">
                <div className="text-sm font-medium text-gray-500">{format(date, 'EEE', { locale: zhCN })}</div>
                <div className={`text-lg font-semibold mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
                  isToday(date) ? 'bg-primary-500 text-white' : 'text-gray-900'
                }`}>
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
                <div key={idx} className="min-h-[300px] border-r border-gray-50 p-1 cursor-pointer hover:bg-gray-50"
                  onClick={() => openNew(date)}
                >
                  <div className="space-y-1 mt-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="text-xs px-1.5 py-1 rounded text-white cursor-pointer"
                        style={{ backgroundColor: event.color }}
                        onClick={(e) => {
                          e.stopPropagation()
                          openEdit(event)
                        }}
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
                      <div key={task.id} className="text-xs px-1.5 py-1 rounded bg-orange-50 text-orange-700 border border-orange-200">
                        📋 {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Today's events list */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 mb-3">今日事件</h3>
        <div className="space-y-2">
          {getEventsForDay(new Date()).length === 0 ? (
            <p className="text-gray-500 text-sm">今日暂无事件</p>
          ) : (
            getEventsForDay(new Date()).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{event.title}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {format(new Date(event.startTime), 'HH:mm')}-{format(new Date(event.endTime), 'HH:mm')}
                    </span>
                  </div>
                </div>
                <button className="btn-ghost btn-sm text-red-600" onClick={() => handleDelete(event.id)}>删除</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEvent ? '编辑事件' : '新建事件'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>取消</button>
            <button className="btn-primary" onClick={handleSave} disabled={!form.title.trim()}>保存</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
            <input className="input" placeholder="事件标题" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea className="input min-h-[60px]" placeholder="事件描述" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="isAllDay" checked={form.isAllDay}
              onChange={(e) => setForm({ ...form, isAllDay: e.target.checked })} />
            <label htmlFor="isAllDay" className="text-sm text-gray-700">全天事件</label>
          </div>
          {!form.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                <input type="datetime-local" className="input" value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                <input type="datetime-local" className="input" value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">提醒</label>
              <select className="input" value={form.reminderMinutes}
                onChange={(e) => setForm({ ...form, reminderMinutes: Number(e.target.value) })}>
                {[0, 0, 5, 15, 30, 60, 1440].map((v) => (
                  <option key={v} value={v}>{reminderLabels[v] || `${v}分钟前`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <div className="flex space-x-1">
                {COLORS.map((c) => (
                  <button key={c} className={`w-6 h-6 rounded-full border-2 ${form.color === c ? 'border-gray-900' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} onClick={() => setForm({ ...form, color: c })} />
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联任务</label>
            <select className="input" value={form.taskId}
              onChange={(e) => setForm({ ...form, taskId: e.target.value })}>
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

export default Calendar