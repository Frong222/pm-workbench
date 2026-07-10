import { create } from 'zustand'
import { db } from '@/db'
import type { Note, Folder } from '@/types'

interface NoteStore {
  notes: Note[]
  folders: Folder[]
  loading: boolean
  loadNotes: () => Promise<void>
  loadFolders: () => Promise<void>
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateNote: (id: string, data: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  addFolder: (folder: Omit<Folder, 'id'>) => Promise<void>
  updateFolder: (id: string, data: Partial<Folder>) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  folders: [],
  loading: false,
  loadNotes: async () => {
    set({ loading: true })
    const notes = await db.notes.orderBy('updatedAt').reverse().toArray()
    set({ notes, loading: false })
  },
  loadFolders: async () => {
    const folders = await db.folders.orderBy('sortOrder').toArray()
    set({ folders })
  },
  addNote: async (note) => {
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    await db.notes.add({ ...note, id, createdAt: now, updatedAt: now })
    get().loadNotes()
  },
  updateNote: async (id, data) => {
    await db.notes.update(id, { ...data, updatedAt: new Date().toISOString() })
    get().loadNotes()
  },
  deleteNote: async (id) => {
    await db.notes.delete(id)
    get().loadNotes()
  },
  addFolder: async (folder) => {
    const id = crypto.randomUUID()
    await db.folders.add({ ...folder, id })
    get().loadFolders()
  },
  updateFolder: async (id, data) => {
    await db.folders.update(id, data)
    get().loadFolders()
  },
  deleteFolder: async (id) => {
    await db.folders.delete(id)
    get().loadFolders()
  },
}))