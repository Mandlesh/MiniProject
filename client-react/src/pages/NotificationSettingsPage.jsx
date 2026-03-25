import { useEffect, useState } from 'react'
import MainLayout from '../components/MainLayout'
import {
  initializeNotifications,
  requestNotificationPermissions,
  setNotificationEnabled,
  showTestNotification,
} from '../services/notificationService'

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [lowActivity, setLowActivity] = useState(true)
  const [highHeartRate, setHighHeartRate] = useState(true)
  const [abnormalSleep, setAbnormalSleep] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    await initializeNotifications()
    setLowActivity((localStorage.getItem('notify_low_activity') ?? 'true') === 'true')
    setHighHeartRate((localStorage.getItem('notify_high_heart_rate') ?? 'true') === 'true')
    setAbnormalSleep((localStorage.getItem('notify_abnormal_sleep') ?? 'true') === 'true')
    setLoading(false)
  }

  async function toggle(key, value, setter) {
    setter(value)
    setNotificationEnabled(key, value)
  }

  async function testNotification() {
    const granted = await requestNotificationPermissions()
    if (!granted) {
      alert('Notification permission is required')
      return
    }
    showTestNotification()
    alert('Test notification sent')
  }

  return (
    <MainLayout title="Notification Settings" back headerMode="back">
      <p className="mt-4 text-sm text-slate-500">
        Choose which health alerts you’d like to receive on your device.
      </p>

      {loading ? (
        <div className="card mt-4 p-10 text-center text-sm text-slate-500">Loading settings...</div>
      ) : (
        <section className="card mt-4 divide-y divide-slate-100 dark:divide-slate-700">
          <ToggleRow
            title="Low Activity Alert"
            subtitle="Alert when daily steps are below 3,000"
            icon="🚶"
            value={lowActivity}
            onChange={(value) => toggle('notify_low_activity', value, setLowActivity)}
          />
          <ToggleRow
            title="High Heart Rate Alert"
            subtitle="Alert when resting heart rate exceeds 120 BPM"
            icon="❤️"
            value={highHeartRate}
            onChange={(value) => toggle('notify_high_heart_rate', value, setHighHeartRate)}
          />
          <ToggleRow
            title="Abnormal Sleep Pattern"
            subtitle="Alert for sleep less than 5hrs or more than 10hrs"
            icon="😴"
            value={abnormalSleep}
            onChange={(value) => toggle('notify_abnormal_sleep', value, setAbnormalSleep)}
          />

          <button className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50" onClick={testNotification}>
            <span className="rounded-xl bg-brand/15 px-3 py-2 text-lg">🔔</span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">Test Notifications</span>
              <span className="block text-xs text-slate-500">Send a test notification to verify setup</span>
            </span>
            <span className="text-slate-400">›</span>
          </button>
        </section>
      )}

      <section className="card mt-5 p-4">
        <p className="text-sm font-bold">System Permissions</p>
        <p className="mt-2 text-sm text-slate-500">
          If notifications are not arriving, ensure browser permissions are enabled for this site.
        </p>
      </section>

      <p className="py-6 text-center text-xs text-slate-400">v1.4.2 (Build 209)</p>
    </MainLayout>
  )
}

function ToggleRow({ title, subtitle, icon, value, onChange }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <span className="rounded-xl bg-slate-100 px-3 py-2 text-lg dark:bg-slate-700">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <button
        className={`h-7 w-12 rounded-full p-1 transition ${value ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-600'}`}
        onClick={() => onChange(!value)}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white transition ${value ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}
