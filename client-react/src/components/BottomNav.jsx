import { useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, History, House, Sparkles, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { t } from '../i18n'

const navItems = [
  { key: 'home', path: '/dashboard', Icon: House },
  { key: 'analytics', path: '/analytics', Icon: BarChart3 },
  { key: 'aiSummary', path: '/ai-summary', Icon: Sparkles },
  { key: 'history', path: '/history', Icon: History },
  { key: 'profile', path: '/profile', Icon: User },
]

function isActive(pathname, path) {
  if (path === '/profile') return pathname.startsWith('/profile')
  return pathname === path
}

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { language } = useApp()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-appStroke bg-white/95 px-3 pb-2 pt-2 shadow-[0_-2px_8px_rgba(15,23,42,0.04)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-[1120px] items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(location.pathname, item.path)
          const Icon = item.Icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex w-[68px] flex-col items-center gap-1"
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                  active
                    ? 'bg-brand/20 text-brand'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <Icon size={17} />
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t(language, item.key)}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
