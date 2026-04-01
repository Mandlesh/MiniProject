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

export async function getGamificationProfile() {
  try {
    const response = await api.get('/gamification/profile')
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, message: getErrorMessage(error, 'Failed to fetch profile') }
  }
}

export async function syncGamification() {
  try {
    const response = await api.post('/gamification/sync')
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, message: getErrorMessage(error, 'Gamification sync failed') }
  }
}

export async function getTodayLeaderboard() {
  try {
    const response = await api.get('/gamification/leaderboard/today')
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, message: getErrorMessage(error, 'Failed to fetch leaderboard') }
  }
}

export async function resetGamification() {
  try {
    const response = await api.post('/gamification/reset')
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, message: getErrorMessage(error, 'Reset failed') }
  }
}

export async function markProgressShared() {
  try {
    const response = await api.post('/gamification/share')
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, message: getErrorMessage(error, 'Share sync failed') }
  }
}
