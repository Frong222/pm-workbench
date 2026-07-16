import React, { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, ListTodo, FileText, Folder, BookOpen, Target, Brain, BarChart3 } from 'lucide-react'
import SettingsModal from './SettingsModal'

const Layout: React.FC = () => {
  const location = useLocation()
  const [showSettings, setShowSettings] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navItems = [
    { path: '/', label: '首页', icon: <Home className="w-5 h-5" /> },
    { path: '/schedule', label: '日程管理', icon: <ListTodo className="w-5 h-5" /> },
    { path: '/requirements', label: '需求管理', icon: <FileText className="w-5 h-5" /> },
    { path: '/projects', label: '项目管理', icon: <Folder className="w-5 h-5" /> },
    { path: '/knowledge', label: '知识库', icon: <BookOpen className="w-5 h-5" /> },
    { path: '/meetings', label: '会议记录', icon: <Target className="w-5 h-5" /> },
    { path: '/ai', label: 'AI 问答', icon: <Brain className="w-5 h-5" /> },
    { path: '/reviews', label: '复盘总结', icon: <BarChart3 className="w-5 h-5" /> },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B0F19' }}>
      <header
        className="h-16 flex items-center justify-between px-6 sticky top-0 z-20"
        style={{
          background: 'rgba(11, 15, 25, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="flex items-center gap-4">
          <button
            className="btn-ghost btn-icon hidden lg:flex"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
              boxShadow: '0 4px 15px rgba(52, 211, 153, 0.3)',
            }}
          >
            <span className="text-[#0B0F19] font-bold text-base">P</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">PM Workbench</h1>
            <p className="text-xs text-muted-foreground">Product Manager Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: '#94a3b8',
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: '#34d399', boxShadow: '0 0 8px rgba(52, 211, 153, 0.5)' }} />
            本地存储
          </div>
          <button
            className="btn-ghost btn-icon"
            onClick={() => setShowSettings(true)}
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`shrink-0 transition-all duration-300 ease-out ${sidebarCollapsed ? 'w-16' : 'w-56'}`}
          style={{
            background: 'rgba(11, 15, 25, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <nav className="py-4 px-3">
            <p className="px-4 text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>
              {!sidebarCollapsed && '导航'}
            </p>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 relative group ${
                        active
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      style={
                        active
                          ? {
                              background: 'rgba(52, 211, 153, 0.1)',
                              border: '1px solid rgba(52, 211, 153, 0.15)',
                            }
                          : { border: '1px solid transparent' }
                      }
                    >
                      <span className={`text-lg shrink-0 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                        {item.icon}
                      </span>
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {active && !sidebarCollapsed && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#34d399', boxShadow: '0 0 6px rgba(52, 211, 153, 0.5)' }} />
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 overflow-auto p-6 lg:p-8 page-enter">
          <Outlet />
        </main>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

export default Layout
