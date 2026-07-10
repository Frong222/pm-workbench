import { create } from 'zustand'
import { db } from '@/db'
import type { Project } from '@/types'

interface ProjectStore {
  projects: Project[]
  loading: boolean
  loadProjects: () => Promise<void>
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  loading: false,
  loadProjects: async () => {
    set({ loading: true })
    const projects = await db.projects.orderBy('createdAt').reverse().toArray()
    set({ projects, loading: false })
  },
  addProject: async (project) => {
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    await db.projects.add({ ...project, id, createdAt: now, updatedAt: now })
    get().loadProjects()
  },
  updateProject: async (id, data) => {
    await db.projects.update(id, { ...data, updatedAt: new Date().toISOString() })
    get().loadProjects()
  },
  deleteProject: async (id) => {
    await db.projects.delete(id)
    get().loadProjects()
  },
}))