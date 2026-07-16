import React, { useEffect, useState, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { FolderOpen, FileText, Folder, BookOpen } from 'lucide-react'
import { useNoteStore } from '@/store/noteStore'
import Modal from '@/components/Modal'

const Knowledge: React.FC = () => {
  const {
    notes, folders, loading,
    loadNotes, loadFolders,
    addNote, updateNote, deleteNote,
    addFolder, updateFolder, deleteFolder,
  } = useNoteStore()

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [folderForm, setFolderForm] = useState({ name: '', id: '' })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Editor state
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editFolderId, setEditFolderId] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    loadNotes()
    loadFolders()
  }, [loadNotes, loadFolders])

  const selectedNote = notes.find((n) => n.id === selectedNoteId)

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (selectedFolderId) {
      if (selectedFolderId === '__uncategorized') {
        if (n.folderId) return false
      } else if (n.folderId !== selectedFolderId) return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return true
  })

  const openNewNote = () => {
    const newNote = {
      title: '无标题笔记',
      content: '',
      tags: [],
      linkedTaskIds: [],
      linkedNoteIds: [],
      folderId: selectedFolderId || undefined,
    }
    addNote(newNote as any).then(() => {
      loadNotes()
      // Select the newly created note
      setTimeout(() => {
        const latest = useNoteStore.getState().notes[0]
        if (latest) {
          setSelectedNoteId(latest.id)
          setEditTitle(latest.title)
          setEditContent(latest.content)
          setEditTags(latest.tags.join(', '))
          setEditFolderId(latest.folderId || '')
        }
      }, 100)
    })
  }

  const selectNote = (note: typeof notes[0]) => {
    // Save current note first
    if (selectedNoteId && autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
      saveCurrentNote()
    }
    setSelectedNoteId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditTags(note.tags.join(', '))
    setEditFolderId(note.folderId || '')
  }

  const saveCurrentNote = useCallback(async () => {
    if (!selectedNoteId) return
    const tags = editTags.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
    await updateNote(selectedNoteId, {
      title: editTitle || '无标题笔记',
      content: editContent,
      tags,
      folderId: editFolderId || undefined,
    })
  }, [selectedNoteId, editTitle, editContent, editTags, editFolderId, updateNote])

  // Auto-save
  useEffect(() => {
    if (!selectedNoteId) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      saveCurrentNote()
    }, 2000)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [editTitle, editContent, editTags, editFolderId, selectedNoteId, saveCurrentNote])

  const handleDeleteNote = async () => {
    if (!selectedNoteId) return
    await deleteNote(selectedNoteId)
    setSelectedNoteId(null)
    setEditTitle('')
    setEditContent('')
    setEditTags('')
    setShowDeleteConfirm(false)
  }

  const handleAddFolder = () => {
    setFolderForm({ name: '', id: '' })
    setShowFolderModal(true)
  }

  const handleSaveFolder = async () => {
    if (!folderForm.name.trim()) return
    if (folderForm.id) {
      await updateFolder(folderForm.id, { name: folderForm.name.trim() })
    } else {
      await addFolder({ name: folderForm.name.trim(), parentId: undefined, sortOrder: folders.length })
    }
    setShowFolderModal(false)
  }

  const handleDeleteFolder = async (id: string) => {
    if (confirm('删除文件夹不会删除其中的笔记，仅取消关联')) {
      await deleteFolder(id)
    }
  }

  // Basic markdown to HTML
  const renderMarkdown = (md: string) => {
    let html = md
      .replace(/### (.+)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/## (.+)/g, '<h2 class="text-xl font-semibold mt-5 mb-2">$1</h2>')
      .replace(/# (.+)/g, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded text-sm">$1</code>')
      .replace(/- (.+)/g, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')
      .replace(/\d+\. (.+)/g, '<li class="ml-4 list-decimal text-muted-foreground">$1</li>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-indigo-500 underline">$1</a>')
      .replace(/\n\n/g, '</p><p class="text-muted-foreground mb-2">')
      .replace(/\n/g, '<br/>')
    html = '<p class="text-muted-foreground mb-2">' + html + '</p>'
    return html
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">知识库</h2>
        <button className="btn-primary active:scale-[0.97] transition-all duration-200" onClick={openNewNote}>+ 新建笔记</button>
      </div>

      <div className="flex space-x-4">
        {/* Left sidebar */}
        <div className="w-48 shrink-0 space-y-4">
          {/* Folders */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">文件夹</h4>
              <button className="btn-ghost btn-sm text-xs active:scale-[0.97] transition-all duration-200" onClick={handleAddFolder}>+</button>
            </div>
            <div className="space-y-1">
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded-xl transition-all duration-200 flex items-center gap-2 ${!selectedFolderId ? 'bg-emerald-500/10 text-emerald-400 shadow-sm' : 'text-muted-foreground hover:bg-white/[0.04]'}`}
                onClick={() => setSelectedFolderId(null)}
              ><FolderOpen className="w-4 h-4" />全部</button>
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded-xl transition-all duration-200 flex items-center gap-2 ${selectedFolderId === '__uncategorized' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm' : 'text-muted-foreground hover:bg-white/[0.04]'}`}
                onClick={() => setSelectedFolderId('__uncategorized')}
              ><FileText className="w-4 h-4" />未分类</button>
              {folders.map((folder) => (
                <div key={folder.id} className="flex items-center group">
                  <button
                    className={`flex-1 text-left px-3 py-2 text-sm rounded-xl transition-all duration-200 flex items-center gap-2 ${selectedFolderId === folder.id ? 'bg-emerald-500/10 text-emerald-400 shadow-sm' : 'text-muted-foreground hover:bg-white/[0.04]'}`}
                    onClick={() => setSelectedFolderId(folder.id)}
                  ><Folder className="w-4 h-4" />{folder.name}</button>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-red-500 transition-all duration-200 px-1"
                    onClick={() => handleDeleteFolder(folder.id)}
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Note list */}
        <div className="w-64 shrink-0">
          <div className="card overflow-hidden">
            <div className="p-2 border-b border-border">
              <input
                className="input text-sm py-1.5"
                placeholder="搜索笔记..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <div className="empty-state py-8">
                  <p className="empty-title text-sm">暂无笔记</p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`px-4 py-3 cursor-pointer border-b border-border/50 card-hover transition-all duration-200 ${
                      selectedNoteId === note.id ? 'bg-emerald-500/10' : ''
                    }`}
                    onClick={() => selectNote(note)}
                  >
                    <p className="font-medium text-sm text-foreground truncate">{note.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(note.updatedAt), 'MM-dd HH:mm')}</p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {note.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 card overflow-hidden">
          {selectedNote ? (
            <div className="flex flex-col h-full">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center space-x-1">
                  <button
                    className={`btn-ghost btn-sm text-xs transition-all duration-200 active:scale-[0.97] ${showPreview ? 'bg-card shadow-sm' : ''}`}
                    onClick={() => setShowPreview(true)}
                  >预览</button>
                  <button
                    className={`btn-ghost btn-sm text-xs transition-all duration-200 active:scale-[0.97] ${!showPreview ? 'bg-card shadow-sm' : ''}`}
                    onClick={() => setShowPreview(false)}
                  >编辑</button>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="btn-ghost btn-sm text-xs text-red-500 hover:text-red-600 transition-all duration-200 active:scale-[0.97]" onClick={() => setShowDeleteConfirm(true)}>删除</button>
                </div>
              </div>

              {/* Meta */}
              <div className="px-4 py-3 border-b border-white/[0.06] space-y-3 bg-white/[0.02]">
                <input
                  className="input text-sm py-1.5 font-semibold"
                  placeholder="笔记标题"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <div className="flex items-center space-x-2">
                  <input
                    className="input text-xs py-1 flex-1"
                    placeholder="标签（逗号分隔）"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                  />
                  <select
                    className="input text-xs py-1.5 w-auto"
                    value={editFolderId}
                    onChange={(e) => setEditFolderId(e.target.value)}
                  >
                    <option value="">未分类</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex overflow-hidden">
                {showPreview ? (
                  <div className="flex-1 overflow-y-auto p-4">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }}
                    />
                    {!editContent && (
                      <p className="text-muted-foreground text-sm mt-4">暂无内容，切换到编辑模式开始写笔记...</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    className="flex-1 p-4 text-sm font-mono leading-relaxed resize-none focus:outline-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground"
                    placeholder="支持 Markdown 语法\n\n# 标题\n## 二级标题\n**粗体** *斜体*\n- 列表项\n`代码`"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state min-h-[400px]">
              <div className="empty-icon"><BookOpen className="w-10 h-10" /></div>
              <p className="empty-title">选择一篇笔记开始编辑</p>
              <p className="empty-desc">或点击"新建笔记"创建</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="确认删除"
        footer={
          <>
            <button className="btn-secondary active:scale-[0.97] transition-all duration-200" onClick={() => setShowDeleteConfirm(false)}>取消</button>
            <button className="btn-destructive active:scale-[0.97] transition-all duration-200" onClick={handleDeleteNote}>确认删除</button>
          </>
        }
      >
        <p className="text-foreground">确定删除这篇笔记？此操作不可撤销。</p>
      </Modal>

      {/* Folder modal */}
      <Modal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        title={folderForm.id ? '重命名文件夹' : '新建文件夹'}
        footer={
          <>
            <button className="btn-secondary active:scale-[0.97] transition-all duration-200" onClick={() => setShowFolderModal(false)}>取消</button>
            <button className="btn-primary active:scale-[0.97] transition-all duration-200" onClick={handleSaveFolder} disabled={!folderForm.name.trim()}>保存</button>
          </>
        }
      >
        <input
          className="input"
          placeholder="文件夹名称"
          value={folderForm.name}
          onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
          autoFocus
        />
      </Modal>
    </div>
  )
}

export default Knowledge
