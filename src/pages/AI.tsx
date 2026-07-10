import React, { useEffect, useState, useRef } from 'react'
import { format } from 'date-fns'
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
        <div className="p-2 border-b border-gray-100">
          <button className="btn-primary btn-sm w-full" onClick={handleNewChat}>
            + 新对话
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">暂无对话</div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center px-3 py-2.5 cursor-pointer border-b border-gray-50 hover:bg-gray-50 ${
                  currentConversationId === conv.id ? 'bg-primary-50' : ''
                }`}
                onClick={() => selectConversation(conv.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{conv.title}</p>
                  <p className="text-xs text-gray-500">{format(new Date(conv.updatedAt), 'MM-dd HH:mm')}</p>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-500 ml-2"
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
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-gray-900">AI 助手</h3>
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
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI 工作台助手</h3>
                <p className="text-gray-500 text-sm">
                  我可以帮你查询任务进度、分析需求池、总结项目状态、
                  推荐优先级、生成复盘报告等。
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    '我本周有哪些待办任务？',
                    '帮我分析需求池的优先级分布',
                    '总结一下所有项目的进度',
                    '今天有什么日程安排？',
                  ].map((q) => (
                    <button
                      key={q}
                      className="block w-full text-left px-4 py-2 text-sm bg-gray-50 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                      onClick={() => {
                        handleNewChat().then(() => {
                          setTimeout(() => {
                            useAIStore.getState().sendMessage(q)
                          }, 200)
                        })
                      }}
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
                {!config.apiKey && (
                  <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      ⚠️ 请先点击右上角"设置"配置 API Key 以启用 AI 功能
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-gray-500">开始提问吧！</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-primary-100' : 'text-gray-400'}`}>
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </p>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-end space-x-2">
            <textarea
              className="input flex-1 min-h-[44px] max-h-[120px] resize-none py-2.5"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">AI 提供商</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              className="input"
              type="password"
              placeholder="sk-..."
              value={settingsForm.apiKey}
              onChange={(e) => setSettingsForm({ ...settingsForm, apiKey: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">API Key 仅保存在本地浏览器</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">接口地址</label>
            <input
              className="input"
              placeholder="https://api.deepseek.com"
              value={settingsForm.baseUrl}
              onChange={(e) => setSettingsForm({ ...settingsForm, baseUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
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