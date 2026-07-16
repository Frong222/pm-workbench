import { create } from 'zustand'
import { db } from '@/db'
import type { Conversation, ChatMessage, AIConfig } from '@/types'

interface AIStore {
  conversations: Conversation[]
  messages: ChatMessage[]
  currentConversationId: string | null
  config: AIConfig
  loading: boolean
  loadConversations: () => Promise<void>
  loadMessages: (conversationId: string) => Promise<void>
  createConversation: () => Promise<string>
  selectConversation: (id: string) => void
  sendMessage: (content: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  updateConfig: (config: AIConfig) => void
}

const DEFAULT_CONFIG: AIConfig = {
  provider: 'deepseek',
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
}

export const useAIStore = create<AIStore>((set, get) => ({
  conversations: [],
  messages: [],
  currentConversationId: null,
  config: (() => {
    try {
      const saved = localStorage.getItem('ai-config')
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG
    } catch {
      return DEFAULT_CONFIG
    }
  })(),
  loading: false,

  loadConversations: async () => {
    const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray()
    set({ conversations })
  },

  loadMessages: async (conversationId) => {
    const messages = await db.chatMessages
      .where('conversationId')
      .equals(conversationId)
      .sortBy('createdAt')
    set({ messages })
  },

  createConversation: async () => {
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const conversation: Conversation = {
      id,
      title: '新对话',
      createdAt: now,
      updatedAt: now,
    }
    await db.conversations.add(conversation)
    set({ currentConversationId: id, messages: [] })
    get().loadConversations()
    return id
  },

  selectConversation: (id) => {
    set({ currentConversationId: id })
    get().loadMessages(id)
  },

  sendMessage: async (content) => {
    const { currentConversationId, config, messages } = get()
    if (!currentConversationId) return

    const now = new Date().toISOString()

    // Save user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      conversationId: currentConversationId,
      role: 'user',
      content,
      createdAt: now,
    }
    await db.chatMessages.add(userMsg)
    set({ messages: [...get().messages, userMsg] })
    set({ loading: true })

    // Auto-title: use first message as title
    const conv = await db.conversations.get(currentConversationId)
    if (conv && conv.title === '新对话') {
      await db.conversations.update(currentConversationId, {
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        updatedAt: now,
      })
      get().loadConversations()
    }

    try {
      // Gather workbench context
      const context = await buildWorkbenchContext()

      // Build messages for API
      const apiMessages = [
        {
          role: 'system',
          content: `你是产品经理个人工作台中的 AI 助手。你可以基于用户的工作台数据回答问题。

## 工作台当前数据上下文
${context}

## 回答规则
1. 基于工作台数据回答时，引用具体数据（任务名称、数量、状态等）
2. 如果不确定或数据不足，明确告知用户
3. 回答简洁、结构化，使用 Markdown 格式
4. 可以给出建议和洞察，但需区分哪些是基于数据的、哪些是建议`,
        },
        ...get().messages.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content },
      ]

      // Call API
      const response = await callAIAPI(config, apiMessages)

      // Save assistant message
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        conversationId: currentConversationId,
        role: 'assistant',
        content: response,
        createdAt: new Date().toISOString(),
      }
      await db.chatMessages.add(assistantMsg)
      await db.conversations.update(currentConversationId, {
        updatedAt: new Date().toISOString(),
      })
      set({ messages: [...get().messages, assistantMsg] })
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        conversationId: currentConversationId,
        role: 'assistant',
        content: `请求失败：${error.message || '请检查 API 配置是否正确'}`,
        createdAt: new Date().toISOString(),
      }
      await db.chatMessages.add(errorMsg)
      set({ messages: [...get().messages, errorMsg] })
    } finally {
      set({ loading: false })
    }
  },

  deleteConversation: async (id) => {
    await db.chatMessages.where('conversationId').equals(id).delete()
    await db.conversations.delete(id)
    if (get().currentConversationId === id) {
      set({ currentConversationId: null, messages: [] })
    }
    get().loadConversations()
  },

  updateConfig: (config) => {
    localStorage.setItem('ai-config', JSON.stringify(config))
    set({ config })
  },
}))

// Build workbench context for AI
async function buildWorkbenchContext(): Promise<string> {
  const tasks = await db.tasks.toArray()
  const requirements = await db.requirements.toArray()
  const projects = await db.projects.toArray()
  const notes = await db.notes.toArray()
  const meetings = await db.meetings.toArray()
  const events = await db.calendarEvents.toArray()

  const todoTasks = tasks.filter((t) => t.status === 'todo')
  const inProgress = tasks.filter((t) => t.status === 'in-progress')
  const done = tasks.filter((t) => t.status === 'done')

  const activeProjects = projects.filter((p) => p.status === 'active')

  return `## 任务概览
- 总任务数: ${tasks.length}
  - 待办: ${todoTasks.length}
  - 进行中: ${inProgress.length}
  - 已完成: ${done.length}

## 近期待办任务
${todoTasks.slice(0, 10).map((t) => `- [${t.priority}] ${t.title}${t.dueDate ? ` (截止: ${t.dueDate})` : ''}`).join('\n') || '无'}

## 进行中任务
${inProgress.slice(0, 10).map((t) => `- [${t.priority}] ${t.title}`).join('\n') || '无'}

## 活跃项目
${activeProjects.map((p) => {
  const projectTasks = tasks.filter((t) => t.projectId === p.id)
  const doneCount = projectTasks.filter((t) => t.status === 'done').length
  return `- ${p.name}: ${projectTasks.length}个任务, ${projectTasks.length ? Math.round(doneCount / projectTasks.length * 100) : 0}%完成`
}).join('\n') || '无'}

## 需求池
${requirements.slice(0, 15).map((r) => `- [${r.priority}] ${r.title} (${r.status})`).join('\n') || '无'}

## 近期日程
${events.slice(0, 10).map((e) => `- ${e.title} (${e.startTime.slice(0, 10)})`).join('\n') || '无'}

## 笔记数
${notes.length} 篇笔记

## 会议记录
${meetings.length} 条记录`
}

// Call AI API
async function callAIAPI(config: AIConfig, messages: any[]): Promise<string> {
  const { baseUrl, apiKey, model } = config

  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key')
  }

  // Normalize base URL: trim trailing slash and /v1 suffix
  let normalized = baseUrl.replace(/\/+$/, '')
  normalized = normalized.replace(/\/v1\/?$/, '')
  const url = `${normalized}/v1/chat/completions`

  const body = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 4096,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API ${response.status}: ${err}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}