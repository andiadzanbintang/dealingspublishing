// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  BookText,
  Tags,
  Newspaper,
  CalendarDays,
  CalendarCheck,
  ClipboardCheck,
  ShieldCheck,
  Users,
  UsersRound,
  Settings,
  Bot,
  ChevronLeft,
  ChevronRight,
  Handshake,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

/**
 * `roles` lists who may see each entry. A reviewer is scoped to the events
 * assigned to them, so they only get their event list and the review queue —
 * every other section would be empty or forbidden for them anyway.
 */
const navItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['superadmin', 'editor'],
  },
  { label: 'Journals', path: '/journals', icon: BookOpen, roles: ['superadmin', 'editor'] },
  { label: 'Books', path: '/books', icon: BookText, roles: ['superadmin', 'editor'] },
  {
    label: 'Partnerships',
    path: '/partnerships',
    icon: Handshake,
    roles: ['superadmin', 'editor'],
  },
  { label: 'Topics', path: '/topics', icon: Tags, roles: ['superadmin', 'editor'] },
  { label: 'News', path: '/news', icon: Newspaper, roles: ['superadmin', 'editor'] },
  { label: 'Events', path: '/events', icon: CalendarDays, roles: ['superadmin', 'editor'] },
  {
    label: 'My Events',
    path: '/my-events',
    icon: CalendarCheck,
    roles: ['reviewer'],
  },
  {
    label: 'Registrations',
    path: '/registrations',
    icon: ClipboardCheck,
    roles: ['superadmin', 'editor', 'reviewer'],
  },
  { label: 'Users', path: '/users', icon: UsersRound, roles: ['superadmin', 'editor'] },
  { label: 'Reviewers', path: '/reviewers', icon: ShieldCheck, roles: ['superadmin'] },
  { label: 'Subscribers', path: '/subscribers', icon: Users, roles: ['superadmin', 'editor'] },
  { label: 'AI Config', path: '/ai-config', icon: Bot, roles: ['superadmin', 'editor'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['superadmin', 'editor'] },
]

const roleLabels = {
  superadmin: 'Superadmin',
  editor: 'Editor',
  reviewer: 'Event reviewer',
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()

  const role = user?.role || 'editor'
  const visibleItems = navItems.filter((item) => item.roles.includes(role))

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-neutral-200 flex flex-col transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-neutral-100 flex-shrink-0">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">D</span>
        </div>
        {!collapsed && (
          <span className="ml-3 text-lg font-bold text-neutral-900 truncate">
            Dealings Publishing
          </span>
        )}
      </div>

      {/* Role badge — a reviewer should never wonder why the menu is short */}
      {!collapsed && role === 'reviewer' && (
        <div className="px-5 pt-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            {roleLabels[role]}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-neutral-100 flex-shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-all"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
