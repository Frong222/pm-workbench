import { create } from 'zustand'
import { db } from '@/db'
import type { Requirement } from '@/types'

interface RequirementStore {
  requirements: Requirement[]
  loading: boolean
  loadRequirements: () => Promise<void>
  addRequirement: (req: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateRequirement: (id: string, data: Partial<Requirement>) => Promise<void>
  deleteRequirement: (id: string) => Promise<void>
}

export const useRequirementStore = create<RequirementStore>((set, get) => ({
  requirements: [],
  loading: false,
  loadRequirements: async () => {
    set({ loading: true })
    const requirements = await db.requirements.orderBy('createdAt').reverse().toArray()
    set({ requirements, loading: false })
  },
  addRequirement: async (req) => {
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    await db.requirements.add({ ...req, id, createdAt: now, updatedAt: now })
    get().loadRequirements()
  },
  updateRequirement: async (id, data) => {
    await db.requirements.update(id, { ...data, updatedAt: new Date().toISOString() })
    get().loadRequirements()
  },
  deleteRequirement: async (id) => {
    await db.requirements.delete(id)
    get().loadRequirements()
  },
}))