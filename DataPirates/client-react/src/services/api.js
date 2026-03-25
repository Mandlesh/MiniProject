import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  )
}

function cacheData(key, data) {
  localStorage.setItem(`cache_${key}`, JSON.stringify(data))
  localStorage.setItem(`cache_${key}_timestamp`, new Date().toISOString())
}

function getCachedData(key) {
  const raw = localStorage.getItem(`cache_${key}`)
  return raw ? JSON.parse(raw) : null
}

export async function registerUser(payload) {
  try {
    const response = await api.post('/auth/register', payload)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, message: getErrorMessage(error, 'Registration failed') }
  }
}

export async function loginUser(payload) {
  try {
    const response = await api.post('/auth/login', payload)
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
    if (response.data?.user) cacheData('user_profile', response.data.user)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, message: getErrorMessage(error, 'Failed to update profile') }
  }
}

export async function getAISummary({ retryCount = 0, forceRefresh = false } = {}) {
  try {
    if (forceRefresh && retryCount === 0) {
      localStorage.removeItem('cache_ai_summary')
      localStorage.removeItem('cache_ai_summary_timestamp')
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
