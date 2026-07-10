import Dexie, { type Table } from 'dexie'
import type { Task, CalendarEvent, Project, Milestone, Requirement, Note, Folder, Review, Tag, Conversation, ChatMessage, Meeting, ExtractedTask } from '@/types'

class WorkbenchDB extends Dexie {
  tasks!: Table<Task, string>
  calendarEvents!: Table<CalendarEvent, string>
  projects!: Table<Project, string>
  milestones!: Table<Milestone, string>
  requirements!: Table<Requirement, string>
  notes!: Table<Note, string>
  folders!: Table<Folder, string>
  reviews!: Table<Review, string>
  tags!: Table<Tag, string>
  conversations!: Table<Conversation, string>
  chatMessages!: Table<ChatMessage, string>
  meetings!: Table<Meeting, string>
  extractedTasks!: Table<ExtractedTask, string>

  constructor() {
    super('pm-workbench')
    this.version(1).stores({
      tasks: 'id, title, status, priority, dueDate, projectId, createdAt',
      calendarEvents: 'id, title, startTime, endTime, taskId, createdAt',
      projects: 'id, name, status, createdAt',
      milestones: 'id, projectId, title',
      requirements: 'id, title, status, priority, source, projectId, createdAt',
      notes: 'id, title, folderId, createdAt, updatedAt',
      folders: 'id, name, parentId, sortOrder',
      reviews: 'id, type, periodStart, periodEnd, createdAt',
      tags: 'id, name',
    })
    this.version(2).stores({
      conversations: 'id, updatedAt',
      chatMessages: 'id, conversationId, role, createdAt',
      meetings: 'id, title, date, createdAt',
      extractedTasks: 'id, meetingId, taskCreated',
    })
  }
}

export const db = new WorkbenchDB()