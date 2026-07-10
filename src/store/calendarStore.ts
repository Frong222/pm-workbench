import { create } from 'zustand'
import { db } from '@/db'
import type { CalendarEvent } from '@/types'

interface CalendarStore {
  events: CalendarEvent[]
  loading: boolean
  loadEvents: () => Promise<void>
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => Promise<void>
  updateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  loading: false,
  loadEvents: async () => {
    set({ loading: true })
    const events = await db.calendarEvents.orderBy('startTime').toArray()
    set({ events, loading: false })
  },
  addEvent: async (event) => {
    const id = crypto.randomUUID()
    await db.calendarEvents.add({ ...event, id, createdAt: new Date().toISOString() })
    get().loadEvents()
  },
  updateEvent: async (id, data) => {
    await db.calendarEvents.update(id, data)
    get().loadEvents()
  },
  deleteEvent: async (id) => {
    await db.calendarEvents.delete(id)
    get().loadEvents()
  },
}))