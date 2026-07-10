import { create } from 'zustand'
import { db } from '@/db'

export interface SyncConfig {
  webdavUrl: string
  webdavUser: string
  webdavPassword: string
  syncPath: string
}

interface SyncStore {
  config: SyncConfig
  syncing: boolean
  lastSyncTime: string | null
  syncStatus: 'idle' | 'success' | 'error' | 'syncing'
  syncMessage: string
  updateConfig: (config: SyncConfig) => void
  testConnection: () => Promise<void>
  uploadToCloud: () => Promise<void>
  downloadFromCloud: () => Promise<void>
}

const DEFAULT_CONFIG: SyncConfig = {
  webdavUrl: '',
  webdavUser: '',
  webdavPassword: '',
  syncPath: '/pm-workbench-backup.json',
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  config: (() => {
    try {
      const saved = localStorage.getItem('sync-config')
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG
    } catch {
      return DEFAULT_CONFIG
    }
  })(),
  syncing: false,
  lastSyncTime: localStorage.getItem('sync-last-time') || null,
  syncStatus: 'idle',
  syncMessage: '',

  updateConfig: (config) => {
    localStorage.setItem('sync-config', JSON.stringify(config))
    set({ config })
  },

  testConnection: async () => {
    const { config } = get()
    if (!config.webdavUrl || !config.webdavUser || !config.webdavPassword) {
      set({ syncStatus: 'error', syncMessage: '请先填写完整的连接信息' })
      return
    }

    set({ syncStatus: 'syncing', syncMessage: '正在测试连接...' })

    try {
      const targetUrl = `${config.webdavUrl.replace(/\/+$/, '')}${config.syncPath}`
      const auth = btoa(unescape(encodeURIComponent(`${config.webdavUser}:${config.webdavPassword}`)))

      // 通过 Vite 代理发送请求，绕过 CORS 限制
      const response = await fetch('/api/webdav-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          method: 'GET',
          headers: { Authorization: `Basic ${auth}` },
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || `代理请求失败 (${response.status})`)
      }

      const status = result.status
      if (status === 200 || status === 404) {
        // 200 = file exists, 404 = file doesn't exist yet (new backup)
        set({ syncStatus: 'success', syncMessage: '✅ 连接成功！WebDAV 配置有效。' })
      } else if (status === 401) {
        set({ syncStatus: 'error', syncMessage: '❌ 认证失败，请检查用户名和密码/授权码' })
      } else if (status === 403) {
        set({ syncStatus: 'error', syncMessage: '❌ 权限不足，请检查目录权限' })
      } else {
        set({ syncStatus: 'error', syncMessage: `❌ 连接异常 (HTTP ${status})` })
      }
    } catch (error: any) {
      set({ syncStatus: 'error', syncMessage: `❌ 连接失败: ${error.message || '无法连接到服务器，请检查地址是否正确'}` })
    }
  },

  uploadToCloud: async () => {
    const { config } = get()
    if (!config.webdavUrl || !config.webdavUser || !config.webdavPassword) {
      set({ syncStatus: 'error', syncMessage: '请先配置云端连接信息' })
      return
    }

    set({ syncing: true, syncStatus: 'syncing', syncMessage: '正在备份到云端...' })

    try {
      // Collect all data from IndexedDB
      const data = {
        version: 2,
        exportedAt: new Date().toISOString(),
        tasks: await db.tasks.toArray(),
        calendarEvents: await db.calendarEvents.toArray(),
        projects: await db.projects.toArray(),
        milestones: await db.milestones.toArray(),
        requirements: await db.requirements.toArray(),
        notes: await db.notes.toArray(),
        folders: await db.folders.toArray(),
        reviews: await db.reviews.toArray(),
        tags: await db.tags.toArray(),
        conversations: await db.conversations.toArray(),
        chatMessages: await db.chatMessages.toArray(),
        meetings: await db.meetings.toArray(),
        extractedTasks: await db.extractedTasks.toArray(),
      }

      const jsonStr = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })

      // Upload via WebDAV PUT
      await webdavPut(config, blob)

      const now = new Date().toISOString()
      localStorage.setItem('sync-last-time', now)
      set({
        syncing: false,
        lastSyncTime: now,
        syncStatus: 'success',
        syncMessage: `备份成功！共 ${data.tasks.length} 个任务, ${data.requirements.length} 个需求, ${data.notes.length} 篇笔记`,
      })
    } catch (error: any) {
      set({
        syncing: false,
        syncStatus: 'error',
        syncMessage: `备份失败: ${error.message || '未知错误'}`,
      })
    }
  },

  downloadFromCloud: async () => {
    const { config } = get()
    if (!config.webdavUrl || !config.webdavUser || !config.webdavPassword) {
      set({ syncStatus: 'error', syncMessage: '请先配置云端连接信息' })
      return
    }

    set({ syncing: true, syncStatus: 'syncing', syncMessage: '正在从云端恢复...' })

    try {
      // Download via WebDAV GET
      const jsonStr = await webdavGet(config)
      const data = JSON.parse(jsonStr)

      if (!data.version || !data.tasks) {
        throw new Error('备份文件格式不正确')
      }

      // Clear existing data and restore
      await clearAllData()
      await restoreData(data)

      // Reload all data by triggering store loads
      const now = new Date().toISOString()
      localStorage.setItem('sync-last-time', now)
      set({
        syncing: false,
        lastSyncTime: now,
        syncStatus: 'success',
        syncMessage: `恢复成功！共恢复 ${data.tasks.length} 个任务, ${data.requirements.length} 个需求, ${data.notes.length} 篇笔记`,
      })

      // Force page reload to refresh all stores
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      set({
        syncing: false,
        syncStatus: 'error',
        syncMessage: `恢复失败: ${error.message || '未知错误'}`,
      })
    }
  },
}))

// Proxy helper: send request through Vite dev server to bypass CORS
async function proxyRequest(config: SyncConfig, method: string, body?: string): Promise<{ status: number; body: string }> {
  const targetUrl = `${config.webdavUrl.replace(/\/+$/, '')}${config.syncPath}`
  const auth = btoa(unescape(encodeURIComponent(`${config.webdavUser}:${config.webdavPassword}`)))

  const response = await fetch('/api/webdav-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetUrl,
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body || undefined,
    }),
  })

  const result = await response.json()
  if (!response.ok) {
    throw new Error(result.error || `代理请求失败 (${response.status})`)
  }
  return result
}

// WebDAV PUT - upload file
async function webdavPut(config: SyncConfig, blob: Blob): Promise<void> {
  const text = await blob.text()
  const result = await proxyRequest(config, 'PUT', text)

  if (result.status >= 400) {
    throw new Error(`WebDAV ${result.status}: ${result.body.slice(0, 200)}`)
  }
}

// WebDAV GET - download file
async function webdavGet(config: SyncConfig): Promise<string> {
  const result = await proxyRequest(config, 'GET')

  if (result.status === 404) {
    throw new Error('云端没有找到备份文件，请先执行一次备份')
  }
  if (result.status >= 400) {
    throw new Error(`WebDAV ${result.status}: 无法从云端获取备份文件`)
  }

  return result.body
}

// Clear all data from IndexedDB
async function clearAllData(): Promise<void> {
  await db.tasks.clear()
  await db.calendarEvents.clear()
  await db.projects.clear()
  await db.milestones.clear()
  await db.requirements.clear()
  await db.notes.clear()
  await db.folders.clear()
  await db.reviews.clear()
  await db.tags.clear()
  await db.conversations.clear()
  await db.chatMessages.clear()
  await db.meetings.clear()
  await db.extractedTasks.clear()
}

// Restore data to IndexedDB
async function restoreData(data: any): Promise<void> {
  const batchSize = 100

  const batchAdd = async (table: any, items: any[]) => {
    for (let i = 0; i < items.length; i += batchSize) {
      await table.bulkAdd(items.slice(i, i + batchSize))
    }
  }

  if (data.tasks?.length) await batchAdd(db.tasks, data.tasks)
  if (data.calendarEvents?.length) await batchAdd(db.calendarEvents, data.calendarEvents)
  if (data.projects?.length) await batchAdd(db.projects, data.projects)
  if (data.milestones?.length) await batchAdd(db.milestones, data.milestones)
  if (data.requirements?.length) await batchAdd(db.requirements, data.requirements)
  if (data.notes?.length) await batchAdd(db.notes, data.notes)
  if (data.folders?.length) await batchAdd(db.folders, data.folders)
  if (data.reviews?.length) await batchAdd(db.reviews, data.reviews)
  if (data.tags?.length) await batchAdd(db.tags, data.tags)
  if (data.conversations?.length) await batchAdd(db.conversations, data.conversations)
  if (data.chatMessages?.length) await batchAdd(db.chatMessages, data.chatMessages)
  if (data.meetings?.length) await batchAdd(db.meetings, data.meetings)
  if (data.extractedTasks?.length) await batchAdd(db.extractedTasks, data.extractedTasks)
}