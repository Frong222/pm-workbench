import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Tasks from '@/pages/Tasks'
import Requirements from '@/pages/Requirements'
import Calendar from '@/pages/Calendar'
import Projects from '@/pages/Projects'
import Knowledge from '@/pages/Knowledge'
import Reviews from '@/pages/Reviews'
import AI from '@/pages/AI'
import Meetings from '@/pages/Meetings'

const basePath = import.meta.env.BASE_URL || '/'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Dashboard /> },
        { path: 'tasks', element: <Tasks /> },
        { path: 'requirements', element: <Requirements /> },
        { path: 'calendar', element: <Calendar /> },
        { path: 'projects', element: <Projects /> },
        { path: 'knowledge', element: <Knowledge /> },
        { path: 'reviews', element: <Reviews /> },
        { path: 'ai', element: <AI /> },
        { path: 'meetings', element: <Meetings /> },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  {
    basename: basePath,
  }
)