import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Globe, Moon, RefreshCcw, Sun, Trophy } from 'lucide-react'
import { useApp } from '../context/AppContext'

const SUPPORTED_LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'हिंदी' },
  { value: 'Marathi', label: 'मराठी' },
]

function HeaderActions({
  isDark,
  language,
  onRefresh,
  toggleTheme,
  showGamification,
  onOpenGamification,
  setLanguage,
}) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const languageMenuRef = useRef(null)

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!languageMenuRef.current) return
      if (!languageMenuRef.current.contains(event.target)) {
        setShowLanguageMenu(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div className="flex items-center gap-2">
      {showGamification ? (
        <button
          onClick={onOpenGamification}
          className="inline-flex h-9 items-center gap-1 rounded-full bg-gradient-to-r from-brand to-[#2D7A6D] px-3 text-xs font-bold text-white shadow-soft"
          title="Gamification"
        >
          <Trophy size={13} />
          XP
        </button>
      ) : null}

      {onRefresh ? (
        <button className="icon-btn" onClick={onRefresh} title="Refresh">
          <RefreshCcw size={15} />
        </button>
      ) : null}

      <div className="relative" ref={languageMenuRef}>
        <button
          className="icon-btn"
          onClick={() => setShowLanguageMenu((previous) => !previous)}
          title={`Language: ${language}`}
        >
          <Globe size={15} />
        </button>

        {showLanguageMenu ? (
          <div className="absolute right-0 top-10 z-50 w-40 overflow-hidden rounded-xl border border-appStroke bg-white shadow-card dark:border-slate-700 dark:bg-slate-800">
            {SUPPORTED_LANGUAGES.map((item) => {
              const active = item.value === language
              return (
                <button
                  key={item.value}
                  onClick={() => {
                    setLanguage(item.value)
                    setShowLanguageMenu(false)
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm ${
                    active
                      ? 'bg-slate-100 font-semibold text-slate-900 dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      <button className="icon-btn" onClick={toggleTheme} title="Theme">
        {isDark ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </div>
  )
}

export default function TopHeader({ title, back = false, onRefresh, mode = 'center', showGamification = false }) {
  const navigate = useNavigate()
  const { language, setLanguage, toggleTheme, themeMode } = useApp()
  const isDark = themeMode === 'dark'
  const headerMode = mode || (back ? 'back' : 'center')

  if (headerMode === 'dashboard') {
    return (
      <header className="sticky top-0 z-20 bg-appBg/95 px-4 py-4 backdrop-blur dark:bg-appBgDark/95">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between">
          <h1 className="text-[32px] font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">{title || 'SwasthSetu'}</h1>
          <HeaderActions
            isDark={isDark}
            language={language}
            onRefresh={onRefresh}
            toggleTheme={toggleTheme}
            showGamification={showGamification}
            onOpenGamification={() => navigate('/gamification')}
            setLanguage={setLanguage}
          />
        </div>
      </header>
    )
  }

  if (headerMode === 'back' || back) {
    return (
      <header className="sticky top-0 z-20 bg-appBg/95 px-4 py-3 backdrop-blur dark:bg-appBgDark/95">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <button className="icon-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
            </button>
            <p className="truncate text-xl font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">{title}</p>
          </div>

          <HeaderActions
            isDark={isDark}
            language={language}
            onRefresh={onRefresh}
            toggleTheme={toggleTheme}
            showGamification={false}
            onOpenGamification={() => {}}
            setLanguage={setLanguage}
          />
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-20 bg-appBg/95 px-4 py-3 backdrop-blur dark:bg-appBgDark/95">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between">
        <div className="w-[80px]" />
        <p className="text-xl font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">{title || 'SwasthSetu'}</p>

        <HeaderActions
          isDark={isDark}
          language={language}
          onRefresh={onRefresh}
          toggleTheme={toggleTheme}
          showGamification={false}
          onOpenGamification={() => {}}
          setLanguage={setLanguage}
        />
      </div>
    </header>
  )
}
