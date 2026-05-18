import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const TABS = [
  { path: '/', icon: '◉', label: 'Home' },
  { path: '/chat', icon: '💬', label: 'Chat' },
  { path: '/quiz', icon: '✦', label: 'Quiz' },
  { path: '/analytics', icon: '📊', label: 'Stats' },
  { path: '/settings', icon: '⚙', label: 'More' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="teacher-bottom-nav" aria-label="Main navigation">
      {TABS.map(tab => {
        const active = tab.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(tab.path)
        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={`teacher-bottom-nav-item${active ? ' active' : ''}`}
          >
            <span className="teacher-bottom-nav-icon">{tab.icon}</span>
            <span className="teacher-bottom-nav-label">{tab.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
