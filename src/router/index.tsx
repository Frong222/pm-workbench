import { createHashRouter, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Schedule from '@/pages/Schedule'
import Requirements from '@/pages/Requirements'
import Projects from '@/pages/Projects'
import Knowledge from '@/pages/Knowledge'
import Reviews from '@/pages/Reviews'
import AI from '@/pages/AI'
import Meetings from '@/pages/Meetings'

export const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'schedule', element: <Schedule /> },
      { path: 'tasks', element: <Navigate to="/schedule" replace /> },
      { path: 'calendar', element: <Navigate to="/schedule" replace /> },
      { path: 'requirements', element: <Requirements /> },
      { path: 'projects', element: <Projects /> },
      { path: 'knowledge', element: <Knowledge /> },
      { path: 'reviews', element: <Reviews /> },
      { path: 'ai', element: <AI /> },
      { path: 'meetings', element: <Meetings /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])