import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { clearApiSessionCache, setActiveCacheUser } from '../services/api'

const AppContext = createContext(null)

const STORAGE_KEYS = {
  theme: 'themeMode',
  language: 'language',
  isLoggedIn: 'isLoggedIn',
  userName: 'userName',
  userId: 'userId',
  userEmail: 'userEmail',
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
  const [userId, setUserIdState] = useState(
    localStorage.getItem(STORAGE_KEYS.userId) || '',
  )
  const [userEmail, setUserEmailState] = useState(
    localStorage.getItem(STORAGE_KEYS.userEmail) || '',
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

  useEffect(() => {
    if (isLoggedIn) {
      setActiveCacheUser({ id: userId, email: userEmail })
    }
  }, [isLoggedIn, userId, userEmail])

  const login = (identity) => {
    setIsLoggedIn(true)
    localStorage.setItem(STORAGE_KEYS.isLoggedIn, 'true')

    const name =
      typeof identity === 'string'
        ? identity
        : identity?.name || identity?.user?.name || 'User'

    const id =
      typeof identity === 'object' && identity !== null
        ? identity.id || identity._id || identity.user?.id || identity.user?._id || ''
        : ''

    const email =
      typeof identity === 'object' && identity !== null
        ? identity.email || identity.user?.email || ''
        : ''

    setUserNameState(name || 'User')
    localStorage.setItem(STORAGE_KEYS.userName, name || 'User')

    setUserIdState(id)
    if (id) localStorage.setItem(STORAGE_KEYS.userId, id)
    else localStorage.removeItem(STORAGE_KEYS.userId)

    setUserEmailState(email)
    if (email) localStorage.setItem(STORAGE_KEYS.userEmail, email)
    else localStorage.removeItem(STORAGE_KEYS.userEmail)

    setActiveCacheUser({ id, email })
  }

  const logoutLocal = () => {
    setIsLoggedIn(false)
    localStorage.setItem(STORAGE_KEYS.isLoggedIn, 'false')
    localStorage.removeItem('token')
    localStorage.removeItem(STORAGE_KEYS.userName)
    localStorage.removeItem(STORAGE_KEYS.userId)
    localStorage.removeItem(STORAGE_KEYS.userEmail)
    setUserNameState('User')
    setUserIdState('')
    setUserEmailState('')
    clearApiSessionCache()
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
      userId,
      userEmail,
      setUserName,
    }),
    [themeMode, language, isLoggedIn, userName, userId, userEmail],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
