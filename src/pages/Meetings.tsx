import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ClipboardList, RefreshCw, Users } from 'lucide-react'
import { useMeetingStore } from '@/store/meetingStore'
import { useTaskStore } from '@/store/taskStore'
import type { ExtractedTask } from '@/types'

const Meetings: React.FC = () => {
  const { meetings, loading, loadMeetings, addMeeting, updateMeeting, deleteMeeting,
    getExtractedTasks, saveExtractedTask, updateExtractedTask, deleteExtractedTask } = useMeetingStore()
  const { addTask } = useTaskStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<string | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null)
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([])

  const [form, setForm] = useState({
    title: '',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    participants: '',
    content: '',
    notes: '',
  })

  // Task extraction form
  const [taskForm, setTaskForm] = useState({ description: '', assignee: '', priority: 'medium', dueDate: '' })

  useEffect(() => {
    loadMeetings()
  }, [loadMeetings])

  const openNew = () => {
    setEditingMeeting(null)
    setSelectedMeeting(null)
    setForm({
      title: '',
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      participants: '',
      content: '',
      notes: '',
    })
    setIsEditing(true)
  }

  const openEdit = (meeting: typeof meetings[0]) => {
    setEditingMeeting(meeting.id)
    setSelectedMeeting(meeting.id)
    setForm({
      title: meeting.title,
      date: meeting.date.slice(0, 16),
      participants: meeting.participants.join(', '),
      content: meeting.content,
      notes: meeting.notes,
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    const data = {
      title: form.title.trim(),
      date: new Date(form.date).toISOString(),
      participants: form.participants.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      content: form.content,
      notes: form.notes,
    }
    if (editingMeeting) {
      await updateMeeting(editingMeeting, data)
      setIsEditing(false)
    } else {
      const newMeeting = await addMeeting(data)
      setIsEditing(false)
      if (newMeeting) {
        setSelectedMeeting(newMeeting.id)
        const tasks = await getExtractedTasks(newMeeting.id)
        setExtractedTasks(tasks)
      }
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (!editingMeeting) {
      setSelectedMeeting(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('确认删除该会议记录？相关的拆解任务也将被删除')) {
      await deleteMeeting(id)
      if (selectedMeeting === id) {
        setSelectedMeeting(null)
        setIsEditing(false)
      }
    }
  }

  const selectMeeting = async (id: string) => {
    setSelectedMeeting(id)
    setIsEditing(false)
    const tasks = await getExtractedTasks(id)
    setExtractedTasks(tasks)
  }

  // Auto-extract tasks from meeting content
  const extractTasksFromContent = (content: string) => {
    const lines = content.split('\n')
    const tasks: string[] = []
    let inTaskSection = false

    for (const line of lines) {
      const trimmed = line.trim()
      // Detect task-like lines
      if (/^[-*]\s*(TODO|待办|任务|Action|action|接下来|下一步)/i.test(trimmed)) {
        inTaskSection = true
        continue
      }
      if (inTaskSection && /^[-*]\s+/.test(trimmed)) {
        const taskText = trimmed.replace(/^[-*]\s+/, '').trim()
        if (taskText) tasks.push(taskText)
      }
      // Also detect checkbox lines
      if (/[-*]\s*\[ \]\s+/.test(trimmed)) {
        const taskText = trimmed.replace(/[-*]\s*\[ \]\s+/, '').trim()
        if (taskText) tasks.push(taskText)
      }
    }

    // If no structured tasks found, use AI-like heuristic
    if (tasks.length === 0) {
      const sentences = content.split(/[。\n]/).filter((s) => s.trim())
      for (const s of sentences) {
        if (/需要|要|必须|得|应该|计划|准备|负责|完成|跟进|落实/.test(s) && s.length < 50) {
          tasks.push(s.trim())
        }
      }
    }

    return tasks
  }

  const handleAutoExtract = async () => {
    if (!selectedMeeting) return
    const meeting = meetings.find((m) => m.id === selectedMeeting)
    if (!meeting) return

    const extracted = extractTasksFromContent(meeting.content)
    for (const taskText of extracted) {
      await saveExtractedTask({
        meetingId: selectedMeeting,
        description: taskText,
        taskCreated: false,
      })
    }
    const tasks = await getExtractedTasks(selectedMeeting)
    setExtractedTasks(tasks)
  }

  const handleCreateTask = async (extracted: ExtractedTask) => {
    await addTask({
      title: extracted.description,
      description: `从会议记录中拆解`,
      priority: 'medium',
      status: 'todo',
      tags: ['会议'],
      projectId: undefined,
      calendarEventId: undefined,
    } as any)
    await updateExtractedTask(extracted.id, { taskCreated: true })
    const tasks = await getExtractedTasks(extracted.meetingId)
    setExtractedTasks(tasks)
  }

  const handleAddExtractedTask = async () => {
    if (!selectedMeeting || !taskForm.description.trim()) return
    await saveExtractedTask({
      meetingId: selectedMeeting,
      description: taskForm.description.trim(),
      assignee: taskForm.assignee.trim() || undefined,
      priority: taskForm.priority,
      dueDate: taskForm.dueDate || undefined,
      taskCreated: false,
    })
    setTaskForm({ description: '', assignee: '', priority: 'medium', dueDate: '' })
    const tasks = await getExtractedTasks(selectedMeeting)
    setExtractedTasks(tasks)
  }

  const handleDeleteExtractedTask = async (id: string) => {
    await deleteExtractedTask(id)
    const tasks = await getExtractedTasks(selectedMeeting!)
    setExtractedTasks(tasks)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] space-x-4">
      {/* Meeting list */}
      <div className="w-72 shrink-0 bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">会议记录</h3>
          <button className="btn-primary btn-sm active:scale-[0.97] transition-all duration-200" onClick={openNew}>+ 新建</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {meetings.length === 0 ? (
            <div className="empty-state py-8">
              <p className="empty-desc">暂无会议记录</p>
            </div>
          ) : (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className={`px-3 py-3 cursor-pointer border-b border-border/50 hover:bg-muted transition-all duration-200 ${
                  selectedMeeting === meeting.id ? 'bg-primary/15 text-primary' : ''
                }`}
                onClick={() => selectMeeting(meeting.id)}
              >
                <p className="font-medium text-sm text-foreground truncate">{meeting.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(meeting.date), 'MM月dd日 HH:mm')}
                </p>
                {meeting.participants.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center">
                    <Users className="w-3 h-3 mr-1" />{meeting.participants.join(', ')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail / Edit / Empty state */}
      <div className="flex-1 bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
        {isEditing ? (
          <div className="flex flex-col h-full">
            {/* Edit header */}
            <div className="px-4 py-3 border-b border-border bg-muted flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{editingMeeting ? '编辑会议' : '新建会议'}</h3>
              <div className="flex items-center space-x-2">
                <button className="btn-secondary btn-sm active:scale-[0.97] transition-all duration-200" onClick={handleCancel}>取消</button>
                <button className="btn-primary btn-sm active:scale-[0.97] transition-all duration-200" onClick={handleSave} disabled={!form.title.trim()}>保存</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">会议标题 *</label>
                <input className="input" placeholder="如：需求评审会" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">时间</label>
                <input type="datetime-local" className="input" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">参会人（逗号分隔）</label>
                <input className="input" placeholder="张三, 李四, 王五" value={form.participants}
                  onChange={(e) => setForm({ ...form, participants: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">会议内容</label>
                <textarea className="input min-h-[160px] font-mono text-sm" placeholder={`记录会议内容，支持结构化格式：

- 讨论主题1
- 讨论主题2

TODO / 待办：
- 完成需求文档
- 跟进设计评审

- [ ] 确认上线时间
- [ ] 准备演示材料`}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })} />
                <p className="text-xs text-muted-foreground mt-1">自动提取任务基于 "TODO/待办:" 或 "[ ]" 格式</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">备注</label>
                <textarea className="input min-h-[80px]" placeholder="额外备注" value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
          </div>
        ) : !selectedMeeting ? (
          <div className="empty-state">
            <div className="empty-icon"><ClipboardList className="w-10 h-10" /></div>
            <p className="empty-desc">选择一条会议记录查看详情，或点击新建</p>
          </div>
        ) : (() => {
          const meeting = meetings.find((m) => m.id === selectedMeeting)
          if (!meeting) return null
          return (
            <div className="flex flex-col h-full">
              {/* Meeting detail header */}
              <div className="px-4 py-3 border-b border-border bg-muted flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{meeting.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(meeting.date), 'yyyy年MM月dd日 HH:mm')}
                    {meeting.participants.length > 0 && ` | 👥 ${meeting.participants.join(', ')}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="btn-ghost btn-sm active:scale-[0.97] transition-all duration-200" onClick={() => openEdit(meeting)}>编辑</button>
                  <button className="btn-ghost btn-sm text-red-400 active:scale-[0.97] transition-all duration-200" onClick={() => handleDelete(meeting.id)}>删除</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Meeting content */}
                {meeting.content && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">会议内容</h4>
                    <div className="p-3 bg-muted/50 rounded-xl">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{meeting.content}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {meeting.notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">备注</h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{meeting.notes}</p>
                  </div>
                )}

                {/* Task extraction */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground">拆解任务</h4>
                    <button className="btn-secondary btn-sm active:scale-[0.97] transition-all duration-200 flex items-center gap-1" onClick={handleAutoExtract}>
                      <RefreshCw className="w-4 h-4" />自动提取
                    </button>
                  </div>

                  {/* Add task form */}
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      className="input flex-1 text-sm py-1.5"
                      placeholder="输入任务描述"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    />
                    <button
                      className="btn-primary btn-sm active:scale-[0.97] transition-all duration-200"
                      onClick={handleAddExtractedTask}
                      disabled={!taskForm.description.trim()}
                    >添加</button>
                  </div>

                  {/* Extracted tasks list */}
                  <div className="space-y-2">
                    {extractedTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        暂无拆解任务，点击"自动提取"从会议内容中提取，或手动添加
                      </p>
                    ) : (
                      extractedTasks.map((et) => (
                        <div key={et.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-xl group hover:bg-green-500/10 border border-transparent hover:border-green-500/20 transition-colors">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-sm text-foreground truncate">{et.description}</span>
                            {et.taskCreated && (
                              <span className="badge bg-green-500/20 text-green-400 text-xs">已创建</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {!et.taskCreated && (
                              <button
                                className="btn-ghost btn-sm text-xs text-indigo-400 active:scale-[0.97] transition-all duration-200"
                                onClick={() => handleCreateTask(et)}
                              >
                                创建任务
                              </button>
                            )}
                            <button
                              className="btn-ghost btn-sm text-xs text-red-400 active:scale-[0.97] transition-all duration-200"
                              onClick={() => handleDeleteExtractedTask(et.id)}
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export default Meetings
