import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Icon, IconName } from './Icon'

const TABS: { path: string; icon: IconName; label: string }[] = [
  { path: '/', icon: 'dashboard', label: 'Home' },
  { path: '/chat', icon: 'chat', label: 'Chat' },
  { path: '/quiz', icon: 'quiz', label: 'Quiz' },
  { path: '/analytics', icon: 'analytics', label: 'Stats' },
  { path: '/settings', icon: 'settings', label: 'More' },
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
            <span className="teacher-bottom-nav-icon"><Icon name={tab.icon} size={20} /></span>
            <span className="teacher-bottom-nav-label">{tab.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
