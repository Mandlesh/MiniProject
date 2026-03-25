import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AppContext = createContext(null)

const STORAGE_KEYS = {
  theme: 'themeMode',
  language: 'language',
  isLoggedIn: 'isLoggedIn',
  userName: 'userName',
}

function getStoredBool(key, fallback = false) {
  const raw = localStorage.getItem(key)
  if (raw == null) return fallback
  return raw === 'true'
}

export function AppProvider({ children }) {
  const [themeMode, setThemeMode] = useState(
    localStorage.getItem(STORAGE_KEYS.theme) || 'light',
  )
  const [language, setLanguageState] = useState(
    localStorage.getItem(STORAGE_KEYS.language) || 'English',
  )
  const [isLoggedIn, setIsLoggedIn] = useState(
    getStoredBool(STORAGE_KEYS.isLoggedIn, false),
  )
  const [userName, setUserNameState] = useState(
    localStorage.getItem(STORAGE_KEYS.userName) || 'User',
  )

  useEffect(() => {
    const root = document.documentElement
    if (themeMode === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem(STORAGE_KEYS.theme, themeMode)
  }, [themeMode])

  const toggleTheme = () => {
    setThemeMode((previous) => (previous === 'light' ? 'dark' : 'light'))
  }

  const setLanguage = (nextLanguage) => {
    setLanguageState(nextLanguage)
    localStorage.setItem(STORAGE_KEYS.language, nextLanguage)
  }

  const login = (name) => {
    setIsLoggedIn(true)
    localStorage.setItem(STORAGE_KEYS.isLoggedIn, 'true')

    if (name) {
      setUserNameState(name)
      localStorage.setItem(STORAGE_KEYS.userName, name)
    }
  }

  const logoutLocal = () => {
    setIsLoggedIn(false)
    localStorage.setItem(STORAGE_KEYS.isLoggedIn, 'false')
    localStorage.removeItem('token')
    localStorage.removeItem(STORAGE_KEYS.userName)
    setUserNameState('User')
  }

  const setUserName = (name) => {
    setUserNameState(name || 'User')
    localStorage.setItem(STORAGE_KEYS.userName, name || 'User')
  }

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      toggleTheme,
      language,
      setLanguage,
      isLoggedIn,
      login,
      logoutLocal,
      userName,
      setUserName,
    }),
    [themeMode, language, isLoggedIn, userName],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
