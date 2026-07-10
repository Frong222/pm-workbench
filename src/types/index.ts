// ===== 任务管理 =====
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  dueDate?: string
  tags: string[]
  projectId?: string
  calendarEventId?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// ===== 日程安排 =====
export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  isAllDay: boolean
  reminderMinutes: number
  taskId?: string
  color: string
  createdAt: string
}

// ===== 项目管理 =====
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  startDate?: string
  endDate?: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: string
  projectId: string
  title: string
  description?: string
  dueDate?: string
  completed: boolean
}

// ===== 需求管理 =====
export type RequirementPriority = 'P0' | 'P1' | 'P2' | 'P3'
export type RequirementStatus =
  | 'proposed'
  | 'evaluating'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'developing'
  | 'testing'
  | 'delivered'
  | 'closed'
export type RequirementSource =
  | 'user_feedback'
  | 'internal'
  | 'boss'
  | 'data_analysis'
  | 'competitive'
  | 'operations'
  | 'other'

export interface Requirement {
  id: string
  title: string
  description: string
  acceptanceCriteria?: string
  priority: RequirementPriority
  status: RequirementStatus
  source: RequirementSource
  proposer?: string
  projectId?: string
  version?: string
  module?: string
  evaluationResult?: string
  scheduleInfo?: string
  createdAt: string
  updatedAt: string
}

// ===== 知识库 =====
export interface Note {
  id: string
  title: string
  content: string
  folderId?: string
  tags: string[]
  linkedTaskIds: string[]
  linkedNoteIds: string[]
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  name: string
  parentId?: string
  sortOrder: number
}

// ===== 复盘总结 =====
export type ReviewType = 'daily' | 'weekly' | 'monthly' | 'manual'

export interface ReviewStats {
  totalTasks: number
  completedTasks: number
  completionRate: number
  avgCompletionHours: number
  projectProgress: Record<string, number>
}

export interface Review {
  id: string
  type: ReviewType
  periodStart: string
  periodEnd: string
  manualNotes?: string
  stats: ReviewStats
  createdAt: string
}

// ===== 标签 =====
export interface Tag {
  id: string
  name: string
  color?: string
}

// ===== 优先级/状态显示配置 =====
export const PriorityConfig: Record<string, { label: string; color: string; textColor: string }> = {
  high: { label: '高', color: '#fef2f2', textColor: '#dc2626' },
  medium: { label: '中', color: '#fefce8', textColor: '#ca8a04' },
  low: { label: '低', color: '#f0fdf4', textColor: '#16a34a' },
  P0: { label: 'P0', color: '#fef2f2', textColor: '#dc2626' },
  P1: { label: 'P1', color: '#fff7ed', textColor: '#ea580c' },
  P2: { label: 'P2', color: '#fefce8', textColor: '#ca8a04' },
  P3: { label: 'P3', color: '#f0fdf4', textColor: '#16a34a' },
}

export const TaskStatusConfig: Record<string, { label: string; color: string }> = {
  todo: { label: '待办', color: '#e5e7eb' },
  'in-progress': { label: '进行中', color: '#bfdbfe' },
  done: { label: '已完成', color: '#bbf7d0' },
}

export const RequirementStatusConfig: Record<string, { label: string; color: string }> = {
  proposed: { label: '待评估', color: '#e5e7eb' },
  evaluating: { label: '评估中', color: '#fef08a' },
  approved: { label: '已通过', color: '#bbf7d0' },
  rejected: { label: '已驳回', color: '#fecaca' },
  scheduled: { label: '已排期', color: '#bfdbfe' },
  developing: { label: '开发中', color: '#c7d2fe' },
  testing: { label: '测试中', color: '#ddd6fe' },
  delivered: { label: '已上线', color: '#86efac' },
  closed: { label: '已关闭', color: '#d1d5db' },
}

export const RequirementSourceConfig: Record<string, { label: string; color: string }> = {
  user_feedback: { label: '用户反馈', color: '#3b82f6' },
  internal: { label: '内部需求', color: '#8b5cf6' },
  boss: { label: '老板需求', color: '#ef4444' },
  data_analysis: { label: '数据分析', color: '#06b6d4' },
  competitive: { label: '竞品分析', color: '#f59e0b' },
  operations: { label: '运营需求', color: '#10b981' },
  other: { label: '其他', color: '#6b7280' },
}

// ===== AI 对话 =====
export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export type MessageRole = 'user' | 'assistant' | 'system'
export interface ChatMessage {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  createdAt: string
}

export interface AIConfig {
  provider: 'openai' | 'deepseek' | 'custom'
  apiKey: string
  baseUrl: string
  model: string
}

// ===== 会议记录 =====
export interface Meeting {
  id: string
  title: string
  date: string
  participants: string[]
  content: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface ExtractedTask {
  id: string
  meetingId: string
  description: string
  assignee?: string
  priority?: string
  dueDate?: string
  taskCreated: boolean
  taskId?: string
}