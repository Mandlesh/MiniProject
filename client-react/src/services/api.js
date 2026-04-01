import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

const CACHE_PREFIX = 'cache_'
const CACHE_NAMESPACE_SEPARATOR = '__'
const ACTIVE_CACHE_USER_KEY = 'cache_active_user_key'

function normalizeCacheNamespace(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
}

function resolveUserNamespace(userLike) {
  if (!userLike) return ''

  if (typeof userLike === 'string') {
    return normalizeCacheNamespace(userLike)
  }

  const idLike = userLike.id || userLike._id || userLike.userId
  if (idLike) {
    return normalizeCacheNamespace(idLike)
  }

  if (userLike.email) {
    return normalizeCacheNamespace(userLike.email)
  }

  return ''
}

function getActiveCacheNamespace() {
  const stored = normalizeCacheNamespace(localStorage.getItem(ACTIVE_CACHE_USER_KEY))
  return stored || 'anonymous'
}

function toStorageKey(key) {
  const namespace = getActiveCacheNamespace()
  return `${CACHE_PREFIX}${namespace}${CACHE_NAMESPACE_SEPARATOR}${key}`
}

export function setActiveCacheUser(userLike) {
  const namespace = resolveUserNamespace(userLike)
  if (namespace) {
    localStorage.setItem(ACTIVE_CACHE_USER_KEY, namespace)
  }
  return namespace
}

export function clearLegacyGlobalCache() {
  const keys = Object.keys(localStorage)
  for (const storageKey of keys) {
    if (!storageKey.startsWith(CACHE_PREFIX)) continue
    if (storageKey === ACTIVE_CACHE_USER_KEY) continue

    const logicalKey = storageKey.slice(CACHE_PREFIX.length)
    if (!logicalKey.includes(CACHE_NAMESPACE_SEPARATOR)) {
      localStorage.removeItem(storageKey)
    }
  }
}

export function clearActiveCacheUser() {
  localStorage.removeItem(ACTIVE_CACHE_USER_KEY)
}

export function clearCurrentUserCache() {
  const namespace = getActiveCacheNamespace()
  const prefix = `${CACHE_PREFIX}${namespace}${CACHE_NAMESPACE_SEPARATOR}`
  const keys = Object.keys(localStorage)

  for (const storageKey of keys) {
    if (storageKey.startsWith(prefix)) {
      localStorage.removeItem(storageKey)
    }
  }
}

export function clearApiSessionCache() {
  clearCurrentUserCache()
  clearActiveCacheUser()
  clearLegacyGlobalCache()
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  )
}

function cacheData(key, data) {
  const dataKey = toStorageKey(key)
  localStorage.setItem(dataKey, JSON.stringify(data))
  localStorage.setItem(`${dataKey}_timestamp`, new Date().toISOString())
}

function getCachedData(key) {
  const storageKey = toStorageKey(key)
  const raw = localStorage.getItem(storageKey)

  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(storageKey)
    localStorage.removeItem(`${storageKey}_timestamp`)
    return null
  }
}

export async function registerUser(payload) {
  try {
    const response = await api.post('/auth/register', payload)
    setActiveCacheUser(response.data?.user)
    clearLegacyGlobalCache()
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, message: getErrorMessage(error, 'Registration failed') }
  }
}

export async function loginUser(payload) {
  try {
    const response = await api.post('/auth/login', payload)
    setActiveCacheUser(response.data?.user)
    clearLegacyGlobalCache()
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, message: getErrorMessage(error, 'Login failed') }
  }
}

export async function logoutUser() {
  try {
    await api.post('/auth/logout')
  } catch {
    // Ignore logout network failures and still clear local state
  } finally {
    clearApiSessionCache()
  }
}

export async function getHealthData(date) {
  try {
    const response = await api.get(`/health/day/${date}`)
    cacheData(`health_data_${date}`, response.data)
    return { success: true, data: response.data }
  } catch (error) {
    if (error?.response?.status === 404) {
      return { success: true, data: null }
    }
    const cached = getCachedData(`health_data_${date}`)
    if (cached) return { success: true, data: cached, cached: true }
    return { success: false, message: getErrorMessage(error, 'Failed to fetch health data') }
  }
}

export async function getWeeklyAnalytics() {
  try {
    const response = await api.get('/analytics/weekly')
    cacheData('weekly_analytics', response.data)
    return { success: true, data: response.data }
  } catch (error) {
    const cached = getCachedData('weekly_analytics')
    if (cached) return { success: true, data: cached, cached: true }
    return { success: false, message: getErrorMessage(error, 'Failed to fetch weekly analytics') }
  }
}

export async function getMonthlyAnalytics() {
  try {
    const response = await api.get('/analytics/monthly')
    cacheData('monthly_analytics', response.data)
    return { success: true, data: response.data }
  } catch (error) {
    const cached = getCachedData('monthly_analytics')
    if (cached) return { success: true, data: cached, cached: true }
    return { success: false, message: getErrorMessage(error, 'Failed to fetch monthly analytics') }
  }
}

export async function getUserProfile() {
  try {
    const response = await api.get('/auth/profile')
    setActiveCacheUser(response.data)
    cacheData('user_profile', response.data)
    return { success: true, data: response.data }
  } catch (error) {
    const cached = getCachedData('user_profile')
    if (cached) return { success: true, data: cached, cached: true }
    return { success: false, message: getErrorMessage(error, 'Failed to fetch profile') }
  }
}

export async function updateUserProfile(payload) {
  try {
    const response = await api.put('/auth/profile', payload)
    if (response.data?.user) {
      setActiveCacheUser(response.data.user)
      cacheData('user_profile', response.data.user)
    }
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, message: getErrorMessage(error, 'Failed to update profile') }
  }
}

export async function getAISummary({ retryCount = 0, forceRefresh = false } = {}) {
  try {
    const aiSummaryKey = toStorageKey('ai_summary')

    if (forceRefresh && retryCount === 0) {
      localStorage.removeItem(aiSummaryKey)
      localStorage.removeItem(`${aiSummaryKey}_timestamp`)
    }

    const response = await api.get('/ai/summary', { timeout: 60000 })
    cacheData('ai_summary', response.data)
    return { success: true, data: response.data }
  } catch (error) {
    if (retryCount < 2) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return getAISummary({ retryCount: retryCount + 1, forceRefresh: false })
    }
    if (!forceRefresh) {
      const cached = getCachedData('ai_summary')
      if (cached) return { success: true, data: cached, cached: true }
    }
    return { success: false, message: getErrorMessage(error, 'Failed to fetch AI summary') }
  }
}

export async function getHealthHistory(days = 30) {
  try {
    const response = await api.get(`/history?days=${days}`)
    cacheData(`health_history_${days}`, response.data)
    return { success: true, data: response.data }
  } catch (error) {
    const cached = getCachedData(`health_history_${days}`)
    if (cached) return { success: true, data: cached, cached: true }
    return { success: false, message: getErrorMessage(error, 'Failed to fetch health history') }
  }
}

export async function syncStravaActivities() {
  try {
    const response = await api.get('/strava/sync')
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, message: getErrorMessage(error, 'Strava sync failed') }
  }
}

export async function analyzeFoodImage(imageBase64) {
  try {
    const response = await api.post('/food/analyze', { imageBase64 })
    return { success: true, data: response.data.data || response.data }
  } catch (error) {
    return { success: false, message: getErrorMessage(error, 'Food analysis failed') }
  }
}
