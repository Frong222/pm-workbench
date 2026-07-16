import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { ToastProvider } from '@/components/Toast'
import '@/index.css'

const App: React.FC = () => (
  <ToastProvider>
    <RouterProvider router={router} />
  </ToastProvider>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
