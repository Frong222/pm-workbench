import { create } from 'zustand'
import { db } from '@/db'
import type { Task } from '@/types'

interface TaskStore {
  tasks: Task[]
  loading: boolean
  loadTasks: () => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTask: (id: string, data: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  loadTasks: async () => {
    set({ loading: true })
    const tasks = await db.tasks.orderBy('createdAt').reverse().toArray()
    set({ tasks, loading: false })
  },
  addTask: async (task) => {
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    await db.tasks.add({ ...task, id, createdAt: now, updatedAt: now })
    get().loadTasks()
  },
  updateTask: async (id, data) => {
    await db.tasks.update(id, { ...data, updatedAt: new Date().toISOString() })
    get().loadTasks()
  },
  deleteTask: async (id) => {
    await db.tasks.delete(id)
    get().loadTasks()
  },
}))