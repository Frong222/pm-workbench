import React, { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import SettingsModal from './SettingsModal'

const Layout: React.FC = () => {
  const location = useLocation()
  const [showSettings, setShowSettings] = useState(false)

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/tasks', label: '任务管理', icon: '📋' },
    { path: '/requirements', label: '需求管理', icon: '📝' },
    { path: '/calendar', label: '日程安排', icon: '🗓️' },
    { path: '/projects', label: '项目管理', icon: '📁' },
    { path: '/knowledge', label: '知识库', icon: '📚' },
    { path: '/meetings', label: '会议记录', icon: '🎯' },
    { path: '/ai', label: 'AI 问答', icon: '🤖' },
    { path: '/reviews', label: '复盘总结', icon: '📊' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">P</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">产品经理个人工作台</h1>
        </div>
        <button
          className="btn-ghost btn-sm flex items-center space-x-1"
          onClick={() => setShowSettings(true)}
        >
          <span>⚙</span>
          <span className="hidden sm:inline text-sm">设置</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 bg-white border-r border-gray-200 min-h-[calc(100vh-3rem)] shrink-0">
          <nav className="py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <span className="mr-2 text-base">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

export default Layout