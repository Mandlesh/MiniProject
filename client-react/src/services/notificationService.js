const THRESHOLDS = {
  lowActivity: 3000,
  highHeartRate: 120,
  minSleepHours: 5,
  maxSleepHours: 10,
}

const COOLDOWN_HOURS = {
  low_activity: 6,
  high_heart_rate: 2,
  abnormal_sleep: 24,
}

export async function initializeNotifications() {
  if (!('Notification' in window)) return false
  return true
}

export async function requestNotificationPermissions() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export function setNotificationEnabled(key, enabled) {
  localStorage.setItem(key, String(Boolean(enabled)))
}

export function isNotificationEnabled(key) {
  const stored = localStorage.getItem(key)
  return stored == null ? true : stored === 'true'
}

export function cacheHealthData({ steps, heartRate, sleepHours }) {
  localStorage.setItem(
    'cached_health_data',
    JSON.stringify({
      steps,
      heartRate,
      sleepHours,
      cachedAt: new Date().toISOString(),
    }),
  )
}

export function getCachedHealthData() {
  const raw = localStorage.getItem('cached_health_data')
  return raw ? JSON.parse(raw) : null
}

function shouldShowNotification(type, cooldownHours) {
  const last = Number(localStorage.getItem(`last_notification_${type}`) || 0)
  const now = Date.now()
  return now - last > cooldownHours * 60 * 60 * 1000
}

function markNotificationShown(type) {
  localStorage.setItem(`last_notification_${type}`, String(Date.now()))
}

function notify(title, body, type) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  if (type && COOLDOWN_HOURS[type]) {
    if (!shouldShowNotification(type, COOLDOWN_HOURS[type])) return
    markNotificationShown(type)
  }

  new Notification(title, { body })
}

export function checkHealthAndNotify({ steps, heartRate, sleepHours }) {
  const hour = new Date().getHours()

  if (isNotificationEnabled('notify_low_activity') && steps > 0 && steps < THRESHOLDS.lowActivity && hour >= 18) {
    const remaining = THRESHOLDS.lowActivity - steps
    notify(
      '🚶 Low Activity Alert',
      `You've only taken ${steps} steps. Try ${remaining} more steps today.`,
      'low_activity',
    )
  }

  if (isNotificationEnabled('notify_high_heart_rate') && heartRate > THRESHOLDS.highHeartRate) {
    notify(
      '❤️ High Heart Rate Detected',
      `Resting heart rate is ${heartRate} BPM. Consider resting and consulting a doctor if this persists.`,
      'high_heart_rate',
    )
  }

  if (
    isNotificationEnabled('notify_abnormal_sleep') &&
    sleepHours > 0 &&
    (sleepHours < THRESHOLDS.minSleepHours || sleepHours > THRESHOLDS.maxSleepHours)
  ) {
    const body =
      sleepHours < THRESHOLDS.minSleepHours
        ? `You slept ${sleepHours.toFixed(1)} hours. Aim for 7-9 hours.`
        : `You slept ${sleepHours.toFixed(1)} hours. Oversleeping may affect energy levels.`
    notify('😴 Abnormal Sleep Pattern', body, 'abnormal_sleep')
  }
}

export function showTestNotification() {
  notify(
    '🎉 SwasthSetu Test',
    "Notifications are working! You'll receive health alerts here.",
  )
}

export function scheduleEveningHealthCheck() {
  const timer = setInterval(() => {
    const now = new Date()
    if (now.getHours() === 20 && now.getMinutes() === 0) {
      notify(
        '📊 Daily Health Check',
        'Open SwasthSetu to review your health metrics and sync latest data.',
      )
    }
  }, 60_000)

  return () => clearInterval(timer)
}
