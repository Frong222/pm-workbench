import { create } from 'zustand'
import { db } from '@/db'
import type { Meeting, ExtractedTask } from '@/types'

interface MeetingStore {
  meetings: Meeting[]
  loading: boolean
  loadMeetings: () => Promise<void>
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Meeting>
  updateMeeting: (id: string, data: Partial<Meeting>) => Promise<void>
  deleteMeeting: (id: string) => Promise<void>
  getExtractedTasks: (meetingId: string) => Promise<ExtractedTask[]>
  saveExtractedTask: (task: Omit<ExtractedTask, 'id'>) => Promise<void>
  updateExtractedTask: (id: string, data: Partial<ExtractedTask>) => Promise<void>
  deleteExtractedTask: (id: string) => Promise<void>
}

export const useMeetingStore = create<MeetingStore>((set, get) => ({
  meetings: [],
  loading: false,
  loadMeetings: async () => {
    set({ loading: true })
    const meetings = await db.meetings.orderBy('date').reverse().toArray()
    set({ meetings, loading: false })
  },
  addMeeting: async (meeting) => {
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const newMeeting: Meeting = { ...meeting, id, createdAt: now, updatedAt: now }
    await db.meetings.add(newMeeting)
    get().loadMeetings()
    return newMeeting
  },
  updateMeeting: async (id, data) => {
    await db.meetings.update(id, { ...data, updatedAt: new Date().toISOString() })
    get().loadMeetings()
  },
  deleteMeeting: async (id) => {
    await db.extractedTasks.where('meetingId').equals(id).delete()
    await db.meetings.delete(id)
    get().loadMeetings()
  },
  getExtractedTasks: async (meetingId) => {
    return db.extractedTasks.where('meetingId').equals(meetingId).toArray()
  },
  saveExtractedTask: async (task) => {
    const id = crypto.randomUUID()
    await db.extractedTasks.add({ ...task, id })
  },
  updateExtractedTask: async (id, data) => {
    await db.extractedTasks.update(id, data)
  },
  deleteExtractedTask: async (id) => {
    await db.extractedTasks.delete(id)
  },
}))