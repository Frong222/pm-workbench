import React, { useEffect, useState, useRef } from 'react'
import { format } from 'date-fns'
import { MessageSquare, Brain, Lightbulb, AlertTriangle } from 'lucide-react'
import { useAIStore } from '@/store/aiStore'
import Modal from '@/components/Modal'

const AI: React.FC = () => {
  const {
    conversations, messages, currentConversationId, config, loading,
    loadConversations, createConversation, selectConversation, sendMessage, deleteConversation, updateConfig,
  } = useAIStore()

  const [input, setInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ ...config })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')

    if (!currentConversationId) {
      const id = await createConversation()
      selectConversation(id)
      // Need to wait for state to update
      setTimeout(() => {
        useAIStore.getState().sendMessage(text)
      }, 100)
      return
    }
    sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSaveSettings = () => {
    updateConfig(settingsForm)
    setShowSettings(false)
  }

  const handleNewChat = async () => {
    const id = await createConversation()
    selectConversation(id)
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] space-x-4">
      {/* Conversations sidebar */}
      <div className="w-56 shrink-0 card overflow-hidden flex flex-col">
        <div className="p-2 border-b border-border">
          <button className="btn-primary btn-sm w-full" onClick={handleNewChat}>
            + 新对话
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-icon"><MessageSquare className="w-8 h-8" /></div>
              <p className="empty-title">暂无对话</p>
              <p className="empty-desc">点击上方按钮开始新对话</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center px-3 py-2.5 cursor-pointer border-b border-border hover:bg-muted transition-all duration-200 ${
                  currentConversationId === conv.id ? 'bg-primary/15 text-primary' : ''
                }`}
                onClick={() => selectConversation(conv.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(conv.updatedAt), 'MM-dd HH:mm')}</p>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-red-500 ml-2 transition-opacity duration-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('删除该对话？')) deleteConversation(conv.id)
                  }}
                >✕</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 card overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/50">
          <h3 className="font-semibold text-foreground">AI 助手</h3>
          <button className="btn-ghost btn-sm" onClick={() => {
            setSettingsForm({ ...config })
            setShowSettings(true)
          }}>
            ⚙ 设置
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentConversationId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="empty-state">
                  <div className="empty-icon"><Brain className="w-10 h-10" /></div>
                  <h3 className="empty-title">AI 工作台助手</h3>
                  <p className="empty-desc">
                    我可以帮你查询任务进度、分析需求池、总结项目状态、
                    推荐优先级、生成复盘报告等。
                  </p>
                </div>
                <div className="mt-6 space-y-2">
                  {[
                    '我本周有哪些待办任务？',
                    '帮我分析需求池的优先级分布',
                    '总结一下所有项目的进度',
                    '今天有什么日程安排？',
                  ].map((q) => (
                    <button
                      key={q}
                      className="block w-full text-left px-4 py-3 text-sm bg-muted/50 hover:bg-muted rounded-xl transition-all duration-200 text-foreground border border-transparent hover:border-green-500/30 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                      onClick={() => {
                        handleNewChat().then(() => {
                          setTimeout(() => {
                            useAIStore.getState().sendMessage(q)
                          }, 200)
                        })
                      }}
                    >
                    <span className="flex items-center"><Lightbulb className="w-4 h-4 mr-2" />{q}</span>
                    </button>
                  ))}
                </div>
                {!config.apiKey && (
                  <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-sm text-amber-400 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />请先点击右上角"设置"配置 API Key 以启用 AI 功能
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="empty-state">
                <div className="empty-icon"><MessageSquare className="w-8 h-8" /></div>
                <p className="empty-title">开始提问吧！</p>
                <p className="empty-desc">在下方输入你的问题，我会尽力解答</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-green-400 to-green-600 rounded-2xl rounded-tr-sm'
                      : 'bg-card border border-border/60 rounded-2xl rounded-tl-sm text-foreground'
                  }`}
                  style={msg.role === 'user' ? { color: '#0f172a' } : undefined}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  <p
                    className={`text-xs mt-1 ${msg.role !== 'user' ? 'text-muted-foreground' : ''}`}
                    style={msg.role === 'user' ? { color: '#064e3b' } : undefined}
                  >
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </p>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border/60 text-foreground rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex space-x-1">
                  <span className="dot-loading" style={{ animationDelay: '0ms' }} />
                  <span className="dot-loading" style={{ animationDelay: '150ms' }} />
                  <span className="dot-loading" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border bg-muted/50">
          <div className="flex items-end space-x-2">
            <textarea
              className="input flex-1 min-h-[44px] max-h-[120px] resize-none py-2.5 focus:border-green-500 focus:shadow-[0_0_0_2px_rgba(34,197,94,0.25)]"
              placeholder="输入你的问题... (Enter 发送, Shift+Enter 换行)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className="btn-primary h-[44px] px-5"
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              发送
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="AI 配置"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowSettings(false)}>取消</button>
            <button className="btn-primary" onClick={handleSaveSettings}>保存</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">AI 提供商</label>
            <select
              className="input"
              value={settingsForm.provider}
              onChange={(e) => {
                const provider = e.target.value as any
                const defaults: Record<string, { baseUrl: string; model: string }> = {
                  deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
                  openai: { baseUrl: 'https://api.openai.com', model: 'gpt-4o-mini' },
                  custom: { baseUrl: '', model: '' },
                }
                const d = defaults[provider] || { baseUrl: '', model: '' }
                setSettingsForm({ ...settingsForm, provider, ...d })
              }}
            >
              <option value="deepseek">DeepSeek</option>
              <option value="openai">OpenAI</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">API Key</label>
            <input
              className="input"
              type="password"
              placeholder="sk-..."
              value={settingsForm.apiKey}
              onChange={(e) => setSettingsForm({ ...settingsForm, apiKey: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">API Key 仅保存在本地浏览器</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">接口地址</label>
            <input
              className="input"
              placeholder="https://api.deepseek.com"
              value={settingsForm.baseUrl}
              onChange={(e) => setSettingsForm({ ...settingsForm, baseUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">模型名称</label>
            <input
              className="input"
              placeholder="deepseek-chat"
              value={settingsForm.model}
              onChange={(e) => setSettingsForm({ ...settingsForm, model: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AI
