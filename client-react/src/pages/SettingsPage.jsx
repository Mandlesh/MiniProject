import { useNavigate } from 'react-router-dom'
import MainLayout from '../components/MainLayout'
import { useApp } from '../context/AppContext'
import { logoutUser, syncStravaActivities } from '../services/api'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { themeMode, toggleTheme, language, setLanguage, logoutLocal } = useApp()

  async function syncNow() {
    const result = await syncStravaActivities()
    if (result.success) alert('Synced successfully')
    else alert(result.message || 'Sync failed')
  }

  async function doLogout() {
    const confirmed = window.confirm('Are you sure you want to logout?')
    if (!confirmed) return

    await logoutUser()
    logoutLocal()
    navigate('/login', { replace: true })
  }

  return (
    <MainLayout title="App Settings" back headerMode="back">
      <SectionTitle title="APPEARANCE" />
      <section className="card mt-2 p-4">
        <Row
          icon="🌙"
          title="Dark Mode"
          subtitle="Adjust screen brightness"
          right={
            <button
              className={`h-7 w-12 rounded-full p-1 ${themeMode === 'dark' ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-600'}`}
              onClick={toggleTheme}
            >
              <span className={`block h-5 w-5 rounded-full bg-white ${themeMode === 'dark' ? 'translate-x-5' : ''}`} />
            </button>
          }
        />
      </section>

      <SectionTitle title="LOCALIZATION" />
      <section className="card mt-2 p-4">
        <Row
          icon="🌐"
          title="Language"
          subtitle="Choose your preferred language"
          right={
            <select
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Marathi">Marathi</option>
            </select>
          }
        />
      </section>

      <SectionTitle title="DATA MANAGEMENT" />
      <section className="card mt-2 p-4">
        <Row
          icon="☁"
          title="Cloud Sync"
          subtitle="Auto-sync is enabled on Wi-Fi"
          right={
            <button className="rounded-lg bg-brand/10 px-3 py-1 text-xs font-bold text-brand" onClick={syncNow}>
              Sync Now
            </button>
          }
        />
      </section>

      <section className="card mt-5 p-4">
        <button className="flex w-full items-center gap-3 text-left" onClick={doLogout}>
          <span className="rounded-xl bg-red-100 px-3 py-2 text-lg text-red-500">↩</span>
          <span className="flex-1">
            <span className="block text-sm font-semibold">Logout</span>
            <span className="block text-xs text-slate-500">Sign out of your account</span>
          </span>
          <span className="text-slate-400">›</span>
        </button>
      </section>

      <div className="py-8 text-center text-xs text-slate-400">
        <p>HealthTrack Pro</p>
        <p>Version 2.4.0 (Build 812)</p>
      </div>
    </MainLayout>
  )
}

function SectionTitle({ title }) {
  return <p className="mt-5 px-1 text-[11px] font-bold tracking-[0.16em] text-slate-500">{title}</p>
}

function Row({ icon, title, subtitle, right }) {
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-xl bg-slate-100 px-3 py-2 text-lg dark:bg-slate-700">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      {right}
    </div>
  )
}
